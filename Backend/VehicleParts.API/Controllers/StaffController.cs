using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleParts.Domain.Enums;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/staff")]
[Authorize(Roles = "Admin,Staff")]
public class StaffController : ControllerBase
{
    private readonly AppDbContext _context;

    public StaffController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("pending-credits")]
    public async Task<IActionResult> GetPendingCredits()
    {
        var data = await _context.Sales
            .Include(s => s.Customer)
            .ThenInclude(c => c.User)
            .Where(s => s.PaymentStatus == PaymentStatus.Pending)
            .Select(s => new
            {
                id = s.Id,
                customerName = s.Customer.User.Name,
                phone = s.Customer.Phone,
                dueAmount = s.FinalAmount,
                saleDate = s.SaleDate
            })
            .ToListAsync();

        return Ok(data);
    }

    [HttpGet("dashboard")]
    public async Task<IActionResult> GetDashboard()
    {
        var now = DateTime.UtcNow;
        var todayStart = new DateTime(now.Year, now.Month, now.Day, 0, 0, 0, DateTimeKind.Utc);
        var monthStart = new DateTime(now.Year, now.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var monthEnd = monthStart.AddMonths(1);
        var weekStart = todayStart.AddDays(-6);

        var totalCustomers = await _context.Customers.CountAsync();

        var salesToday = await _context.Sales
            .Where(s => s.SaleDate >= todayStart && s.SaleDate < todayStart.AddDays(1))
            .ToListAsync();

        var salesThisMonth = await _context.Sales
            .Where(s => s.SaleDate >= monthStart && s.SaleDate < monthEnd)
            .ToListAsync();

        var pendingCredits = await _context.Sales
            .Where(s => s.PaymentStatus == PaymentStatus.Pending)
            .ToListAsync();

        var pendingAppointments = await _context.Appointments
            .CountAsync(a => a.Status == AppointmentStatus.Pending);

        var confirmedAppointments = await _context.Appointments
            .CountAsync(a => a.Status == AppointmentStatus.Confirmed);

        var regularCustomersCount = await _context.Sales
            .GroupBy(s => s.CustomerId)
            .Where(g => g.Count() >= 2)
            .CountAsync();

        var weekSales = await _context.Sales
            .Where(s => s.SaleDate >= weekStart && s.SaleDate < todayStart.AddDays(1))
            .ToListAsync();

        var salesLast7Days = Enumerable.Range(0, 7).Select(i =>
        {
            var dayStart = weekStart.AddDays(i);
            var dayEnd = dayStart.AddDays(1);
            var daySales = weekSales.Where(s => s.SaleDate >= dayStart && s.SaleDate < dayEnd).ToList();
            return new
            {
                label = dayStart.ToString("ddd"),
                date = dayStart.ToString("yyyy-MM-dd"),
                count = daySales.Count,
                revenue = daySales.Sum(s => s.FinalAmount)
            };
        }).ToList();

        var paidSalesMonth = salesThisMonth.Where(s => s.PaymentStatus == PaymentStatus.Paid).ToList();
        var pendingSalesMonth = salesThisMonth.Where(s => s.PaymentStatus == PaymentStatus.Pending).ToList();

        var topParts = await _context.SaleItems
            .Include(si => si.Sale)
            .Include(si => si.Part)
            .Where(si => si.Sale.SaleDate >= monthStart && si.Sale.SaleDate < monthEnd)
            .GroupBy(si => new { si.PartId, si.Part.Name })
            .Select(g => new
            {
                partName = g.Key.Name,
                quantitySold = g.Sum(si => si.Quantity),
                revenue = g.Sum(si => si.Quantity * (si.Price > 0 ? si.Price : si.Part.Price))
            })
            .OrderByDescending(x => x.quantitySold)
            .Take(5)
            .ToListAsync();

        return Ok(new
        {
            summary = new
            {
                totalCustomers,
                salesTodayCount = salesToday.Count,
                salesTodayRevenue = salesToday.Sum(s => s.FinalAmount),
                salesMonthCount = salesThisMonth.Count,
                salesMonthRevenue = salesThisMonth.Sum(s => s.FinalAmount),
                pendingCreditsCount = pendingCredits.Count,
                pendingCreditsAmount = pendingCredits.Sum(s => s.FinalAmount),
                pendingAppointments,
                confirmedAppointments,
                regularCustomersCount
            },
            salesLast7Days,
            paymentBreakdown = new
            {
                paidCount = paidSalesMonth.Count,
                pendingCount = pendingSalesMonth.Count,
                paidAmount = paidSalesMonth.Sum(s => s.FinalAmount),
                pendingAmount = pendingSalesMonth.Sum(s => s.FinalAmount)
            },
            topPartsThisMonth = topParts
        });
    }
}