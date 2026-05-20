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
[Route("api/admin/part-requests")]
[Authorize(Roles = "Admin,Staff")]
public class AdminPartRequestsController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAdminActivityLogService _activityLogs;

    public AdminPartRequestsController(AppDbContext context, IAdminActivityLogService activityLogs)
    {
        _context = context;
        _activityLogs = activityLogs;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var requests = await _context.PartRequests
            .Include(pr => pr.Customer)
                .ThenInclude(c => c.User)
            .OrderByDescending(pr => pr.Id)
            .Select(pr => new
            {
                id = pr.Id,
                customerId = pr.CustomerId,
                customerName = pr.Customer.User.Name,
                customerEmail = pr.Customer.User.Email,
                customerPhone = pr.Customer.Phone,
                partName = pr.PartName,
                description = pr.Description,
                status = pr.Status.ToString()
            })
            .ToListAsync();

        return Ok(requests);
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdatePartRequestStatusDto dto)
    {
        var request = await _context.PartRequests
            .Include(pr => pr.Customer)
                .ThenInclude(c => c.User)
            .FirstOrDefaultAsync(pr => pr.Id == id);

        if (request == null)
            return NotFound(new { message = "Part request not found." });

        if (!Enum.TryParse<PartRequestStatus>(dto.Status, true, out var parsedStatus))
            return BadRequest(new { message = "Invalid status value." });

        var oldStatus = request.Status.ToString();
        request.Status = parsedStatus;

        // Create notification for customer
        string message = parsedStatus switch
        {
            PartRequestStatus.Approved => $"Your request for part '{request.PartName}' has been approved and is being sourced from our vendors.",
            PartRequestStatus.Rejected => $"We regret to inform you that your request for part '{request.PartName}' could not be sourced and was rejected.",
            PartRequestStatus.Fulfilled => $"Good news! Your requested part '{request.PartName}' is now in stock. Please visit GadiParts to collect it.",
            _ => ""
        };

        if (!string.IsNullOrEmpty(message) && request.Customer != null)
        {
            var notification = new Notification
            {
                Type = parsedStatus == PartRequestStatus.Rejected ? NotificationType.Warning : NotificationType.Success,
                Message = message,
                CreatedAt = DateTime.UtcNow,
                UserId = request.Customer.UserId
            };
            _context.Notifications.Add(notification);
        }

        await _context.SaveChangesAsync();

        if (User.IsInRole("Admin"))
        {
            var customerName = request.Customer?.User?.Name ?? "Customer";
            var actionType = parsedStatus switch
            {
                PartRequestStatus.Approved => AdminActivityActions.Approve,
                PartRequestStatus.Rejected => AdminActivityActions.Reject,
                PartRequestStatus.Fulfilled => AdminActivityActions.Fulfill,
                _ => AdminActivityActions.Update
            };

            await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
            {
                ActionType = actionType,
                Module = AdminActivityModules.PartRequests,
                EntityType = "PartRequest",
                EntityId = request.Id,
                Description =
                    $"Part request #{request.Id} for {request.PartName} by {customerName} set to {parsedStatus}.",
                OldValue = oldStatus,
                NewValue = parsedStatus.ToString(),
                Severity = parsedStatus == PartRequestStatus.Rejected
                    ? AdminActivitySeverity.Warning
                    : AdminActivitySeverity.Info
            });
        }

        return Ok(new
        {
            message = "Part request status updated successfully.",
            id = request.Id,
            status = request.Status.ToString()
        });
    }
}

public class UpdatePartRequestStatusDto
{
    public string Status { get; set; } = string.Empty;
}
