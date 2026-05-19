using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleParts.Domain.Enums;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class ReportsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ReportsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("finance")]
    public async Task<IActionResult> GetFinancialReport(
        [FromQuery] string period = "monthly",
        [FromQuery] int? year = null,
        [FromQuery] int? month = null,
        [FromQuery] int? day = null)
    {
        var targetYear = year ?? DateTime.UtcNow.Year;
        var targetMonth = month ?? DateTime.UtcNow.Month;
        var targetDay = day ?? DateTime.UtcNow.Day;

        DateTime startDate;
        DateTime endDate;

        if (period.ToLower() == "daily")
        {
            startDate = new DateTime(targetYear, targetMonth, targetDay, 0, 0, 0, DateTimeKind.Utc);
            endDate = startDate.AddDays(1);
        }
        else if (period.ToLower() == "yearly")
        {
            startDate = new DateTime(targetYear, 1, 1, 0, 0, 0, DateTimeKind.Utc);
            endDate = startDate.AddYears(1);
        }
        else // default to monthly
        {
            startDate = new DateTime(targetYear, targetMonth, 1, 0, 0, 0, DateTimeKind.Utc);
            endDate = startDate.AddMonths(1);
        }

        // 1. Query Sales
        var sales = await _context.Sales
            .Where(s => s.SaleDate >= startDate && s.SaleDate < endDate)
            .ToListAsync();

        var totalSalesCount = sales.Count;
        var totalSalesRevenue = sales.Sum(s => s.FinalAmount);
        var totalDiscount = sales.Sum(s => s.Discount);
        var totalSalesRaw = sales.Sum(s => s.TotalAmount);

        // 2. Query Purchases
        var purchases = await _context.Purchases
            .Where(p => p.PurchaseDate >= startDate && p.PurchaseDate < endDate)
            .ToListAsync();

        var totalPurchasesCount = purchases.Count;
        var totalPurchasesCost = purchases.Sum(p => p.TotalAmount);

        // 3. Profit Calculation
        var netProfit = totalSalesRevenue - totalPurchasesCost;

        // 4. Top Selling Parts during this period
        var topSellingParts = await _context.SaleItems
            .Include(si => si.Sale)
            .Include(si => si.Part)
            .Where(si => si.Sale.SaleDate >= startDate && si.Sale.SaleDate < endDate)
            .GroupBy(si => new { si.PartId, si.Part.Name })
            .Select(g => new
            {
                partId = g.Key.PartId,
                partName = g.Key.Name,
                quantitySold = g.Sum(si => si.Quantity),
                totalRevenue = g.Sum(si => si.Quantity * si.Part.Price)
            })
            .OrderByDescending(x => x.quantitySold)
            .Take(5)
            .ToListAsync();

        // 5. Sales list for detail view
        var salesDetails = sales.OrderByDescending(s => s.SaleDate).Select(s => new
        {
            id = s.Id,
            date = s.SaleDate,
            total = s.TotalAmount,
            discount = s.Discount,
            final = s.FinalAmount,
            status = s.PaymentStatus.ToString()
        }).ToList();

        // 6. Purchases list for detail view
        var purchasesDetails = purchases.OrderByDescending(p => p.PurchaseDate).Select(p => new
        {
            id = p.Id,
            date = p.PurchaseDate,
            total = p.TotalAmount
        }).ToList();

        return Ok(new
        {
            period,
            startDate,
            endDate,
            summary = new
            {
                totalSalesCount,
                totalSalesRaw,
                totalSalesRevenue,
                totalDiscount,
                totalPurchasesCount,
                totalPurchasesCost,
                netProfit
            },
            topParts = topSellingParts,
            sales = salesDetails,
            purchases = purchasesDetails
        });
    }
}
