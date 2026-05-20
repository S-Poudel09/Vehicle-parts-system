using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleParts.Application.Constants;
using VehicleParts.Application.DTOs;
using VehicleParts.Application.Interfaces;
using VehicleParts.Domain.Entities;
using VehicleParts.Domain.Enums;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class NotificationController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAdminActivityLogService _activityLogs;

    public NotificationController(AppDbContext context, IAdminActivityLogService activityLogs)
    {
        _context = context;
        _activityLogs = activityLogs;
    }

    [HttpGet]
    public async Task<IActionResult> GetNotifications()
    {
        // 1. Sync low stock warnings with current catalog stock levels
        var lowStockParts = await _context.Parts
            .Where(p => p.Stock < 10)
            .ToListAsync();

        var normalStockParts = await _context.Parts
            .Where(p => p.Stock >= 10)
            .ToListAsync();

        var existingWarnings = await _context.Notifications
            .Where(n => n.Type == NotificationType.Warning)
            .ToListAsync();

        bool changed = false;

        // Add/Update warnings for low stock parts
        foreach (var part in lowStockParts)
        {
            var warning = existingWarnings.FirstOrDefault(w => w.Message.Contains($"(ID: {part.Id})"));
            var expectedMsg = $"Part '{part.Name}' (ID: {part.Id}) is low in stock. Current stock: {part.Stock} units.";

            if (warning == null)
            {
                var notification = new Notification
                {
                    Type = NotificationType.Warning,
                    Message = expectedMsg,
                    CreatedAt = DateTime.UtcNow,
                    UserId = null
                };
                _context.Notifications.Add(notification);
                changed = true;
            }
            else if (warning.Message != expectedMsg)
            {
                warning.Message = expectedMsg;
                _context.Notifications.Update(warning);
                changed = true;
            }
        }

        // Remove warnings for parts that have replenished stock (>= 10)
        foreach (var part in normalStockParts)
        {
            var warning = existingWarnings.FirstOrDefault(w => w.Message.Contains($"(ID: {part.Id})"));
            if (warning != null)
            {
                _context.Notifications.Remove(warning);
                changed = true;
            }
        }

        if (changed)
        {
            await _context.SaveChangesAsync();
        }

        // 2. Fetch and return current notifications
        var notifications = await _context.Notifications
            .OrderByDescending(n => n.CreatedAt)
            .Select(n => new
            {
                id = n.Id,
                type = n.Type.ToString(),
                message = n.Message,
                createdAt = n.CreatedAt
            })
            .ToListAsync();

        return Ok(notifications);
    }


    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DismissNotification(int id)
    {
        var notification = await _context.Notifications.FindAsync(id);
        if (notification == null)
        {
            return NotFound();
        }

        _context.Notifications.Remove(notification);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    [HttpPost("send-reminders")]
    public async Task<IActionResult> SendUnpaidCreditReminders()
    {
        // Find sales with PaymentStatus == Pending and SaleDate < 1 month ago
        var oneMonthAgo = DateTime.UtcNow.AddMonths(-1);

        var overdueSales = await _context.Sales
            .Include(s => s.Customer)
                .ThenInclude(c => c.User)
            .Where(s => s.PaymentStatus == PaymentStatus.Pending && s.SaleDate < oneMonthAgo)
            .ToListAsync();

        var notifiedEmails = new List<string>();

        foreach (var sale in overdueSales)
        {
            if (sale.Customer?.User != null && !string.IsNullOrEmpty(sale.Customer.User.Email))
            {
                var customerEmail = sale.Customer.User.Email;
                var customerName = sale.Customer.User.Name;
                var amountDue = sale.FinalAmount;
                var saleDateStr = sale.SaleDate.ToString("yyyy-MM-dd");

                // Mock email sending: Log to console
                System.Console.WriteLine($"[EMAIL SENT] To: {customerEmail}, Subject: Overdue Credit Reminder, Body: Hello {customerName}, you have an outstanding balance of Rs {amountDue} for your purchase on {saleDateStr} which is overdue by more than a month.");
                
                notifiedEmails.Add(customerEmail);
            }
        }

        await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
        {
            ActionType = AdminActivityActions.NotificationSent,
            Module = AdminActivityModules.Notifications,
            Description = $"Sent credit reminder emails to {notifiedEmails.Count} customer(s).",
            NewValue = string.Join(", ", notifiedEmails.Take(20))
        });

        return Ok(new
        {
            message = $"Successfully sent reminders to {notifiedEmails.Count} customer(s) with unpaid credits overdue by more than 1 month.",
            notifiedEmails
        });
    }
}
