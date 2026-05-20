using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleParts.Domain.Enums;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/staff/reports")]
[Authorize(Roles = "Admin,Staff")]
public class StaffReportsController : ControllerBase
{
    private readonly AppDbContext _context;

    public StaffReportsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("regular-customers")]
    public async Task<IActionResult> GetRegularCustomers()
    {
        var summaries = await _context.Sales
            .GroupBy(s => s.CustomerId)
            .Select(g => new
            {
                CustomerId = g.Key,
                TotalPurchases = g.Count(),
                TotalSpent = g.Sum(s => s.FinalAmount)
            })
            .Where(x => x.TotalPurchases >= 2)
            .OrderByDescending(x => x.TotalPurchases)
            .ToListAsync();

        var customerIds = summaries.Select(x => x.CustomerId).ToList();

        var customers = await _context.Customers
            .Include(c => c.User)
            .Include(c => c.Vehicles)
            .Where(c => customerIds.Contains(c.Id))
            .ToListAsync();

        var result = summaries.Select(summary =>
        {
            var customer = customers.First(c => c.Id == summary.CustomerId);

            return new
            {
                customerId = customer.Id,
                fullName = customer.User.Name,
                email = customer.User.Email,
                phone = customer.Phone,
                address = customer.Address,
                vehicleNumbers = customer.Vehicles.Select(v => v.VehicleNumber).ToList(),
                totalPurchases = summary.TotalPurchases,
                totalSpent = summary.TotalSpent
            };
        });

        return Ok(result);
    }

    [HttpGet("high-spenders")]
    public async Task<IActionResult> GetHighSpenders([FromQuery] decimal minAmount = 5000)
    {
        var summaries = await _context.Sales
            .GroupBy(s => s.CustomerId)
            .Select(g => new
            {
                CustomerId = g.Key,
                TotalPurchases = g.Count(),
                TotalSpent = g.Sum(s => s.FinalAmount)
            })
            .Where(x => x.TotalSpent >= minAmount)
            .OrderByDescending(x => x.TotalSpent)
            .ToListAsync();

        var customerIds = summaries.Select(x => x.CustomerId).ToList();

        var customers = await _context.Customers
            .Include(c => c.User)
            .Include(c => c.Vehicles)
            .Where(c => customerIds.Contains(c.Id))
            .ToListAsync();

        var result = summaries.Select(summary =>
        {
            var customer = customers.First(c => c.Id == summary.CustomerId);

            return new
            {
                customerId = customer.Id,
                fullName = customer.User.Name,
                email = customer.User.Email,
                phone = customer.Phone,
                address = customer.Address,
                vehicleNumbers = customer.Vehicles.Select(v => v.VehicleNumber).ToList(),
                totalPurchases = summary.TotalPurchases,
                totalSpent = summary.TotalSpent
            };
        });

        return Ok(result);
    }

    [HttpGet("pending-credits")]
    public async Task<IActionResult> GetPendingCredits()
    {
        var result = await _context.Sales
            .Include(s => s.Customer)
                .ThenInclude(c => c.User)
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Part)
            .Where(s => s.PaymentStatus == PaymentStatus.Pending)
            .OrderByDescending(s => s.SaleDate)
            .Select(s => new
            {
                saleId = s.Id,
                customerId = s.CustomerId,
                fullName = s.Customer.User.Name,
                email = s.Customer.User.Email,
                phone = s.Customer.Phone,
                totalAmount = s.TotalAmount,
                discount = s.Discount,
                finalAmount = s.FinalAmount,
                paymentStatus = s.PaymentStatus.ToString(),
                saleDate = s.SaleDate,
                items = s.SaleItems.Select(si => new
                {
                    partName = si.Part.Name,
                    quantity = si.Quantity,
                    price = si.Price > 0 ? si.Price : si.Part.Price,
                    lineTotal = si.Quantity * (si.Price > 0 ? si.Price : si.Part.Price)
                }).ToList()
            })
            .ToListAsync();

        return Ok(result);
    }
}