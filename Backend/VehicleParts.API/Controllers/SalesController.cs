using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleParts.Application.DTOs;
using VehicleParts.Domain.Entities;
using VehicleParts.Domain.Enums;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/staff/sales")]
[Authorize(Roles = "Admin,Staff")]
public class SalesController : ControllerBase
{
    private readonly AppDbContext _context;

    public SalesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetSale(int id)
    {
        var sale = await LoadSaleAsync(id);
        if (sale == null)
            return NotFound(new { message = "Sale invoice not found." });

        var paidAmount =
            sale.PaymentStatus == PaymentStatus.Paid ? sale.FinalAmount : 0m;
        return Ok(MapToInvoiceDto(sale, paidAmount));
    }

    [HttpPost]
    public async Task<IActionResult> CreateSale(CreateSaleDto dto)
    {
        if (dto.Items == null || !dto.Items.Any())
            return BadRequest(new { message = "At least one part is required." });

        var customer = await _context.Customers
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == dto.CustomerId);

        if (customer == null)
            return NotFound(new { message = "Customer not found." });

        var staffIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(staffIdClaim))
            return Unauthorized(new { message = "Staff id not found in token." });

        int staffId = int.Parse(staffIdClaim);

        decimal totalAmount = 0;
        var saleItems = new List<SaleItem>();

        foreach (var item in dto.Items)
        {
            var part = await _context.Parts.FindAsync(item.PartId);

            if (part == null)
                return NotFound(new { message = $"Part with ID {item.PartId} not found." });

            if (item.Quantity <= 0)
                return BadRequest(new { message = "Quantity must be greater than zero." });

            if (part.Stock < item.Quantity)
                return BadRequest(new { message = $"Not enough stock for {part.Name}." });

            decimal lineTotal = part.Price * item.Quantity;
            totalAmount += lineTotal;

            part.Stock -= item.Quantity;

            if (part.Stock < 10)
            {
                var notificationExists = await _context.Notifications.AnyAsync(n =>
                    n.Type == NotificationType.Warning &&
                    n.Message.Contains($"Part '{part.Name}' (ID: {part.Id})"));

                if (!notificationExists)
                {
                    _context.Notifications.Add(new Notification
                    {
                        Type = NotificationType.Warning,
                        Message =
                            $"Part '{part.Name}' (ID: {part.Id}) is low in stock. Current stock: {part.Stock} units.",
                        CreatedAt = DateTime.UtcNow,
                        UserId = null
                    });
                }
            }

            saleItems.Add(new SaleItem
            {
                PartId = part.Id,
                Quantity = item.Quantity,
                Price = part.Price
            });
        }

        decimal discount = totalAmount > 5000 ? totalAmount * 0.10m : 0;
        decimal finalAmount = totalAmount - discount;
        PaymentStatus paymentStatus =
            dto.PaidAmount >= finalAmount ? PaymentStatus.Paid : PaymentStatus.Pending;

        var sale = new Sale
        {
            CustomerId = dto.CustomerId,
            StaffId = staffId,
            TotalAmount = totalAmount,
            Discount = discount,
            FinalAmount = finalAmount,
            SaleDate = DateTime.UtcNow,
            PaymentStatus = paymentStatus,
            SaleItems = saleItems
        };

        _context.Sales.Add(sale);
        await _context.SaveChangesAsync();

        var saved = await LoadSaleAsync(sale.Id);
        return Ok(MapToInvoiceDto(saved!, dto.PaidAmount));
    }

    private async Task<Sale?> LoadSaleAsync(int id) =>
        await _context.Sales
            .Include(s => s.Customer)
                .ThenInclude(c => c.User)
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Part)
            .FirstOrDefaultAsync(s => s.Id == id);

    private static SaleInvoiceDto MapToInvoiceDto(Sale sale, decimal paidAmount) =>
        new()
        {
            Id = sale.Id,
            CustomerId = sale.CustomerId,
            CustomerName = sale.Customer.User.Name,
            CustomerEmail = sale.Customer.User.Email,
            CustomerPhone = sale.Customer.Phone,
            CustomerAddress = sale.Customer.Address,
            TotalAmount = sale.TotalAmount,
            Discount = sale.Discount,
            FinalAmount = sale.FinalAmount,
            PaidAmount = paidAmount,
            SaleDate = sale.SaleDate,
            PaymentStatus = sale.PaymentStatus.ToString(),
            Items = sale.SaleItems.Select(si => new SaleInvoiceItemDto
            {
                Id = si.Id,
                PartId = si.PartId,
                PartName = si.Part.Name,
                Quantity = si.Quantity,
                Price = si.Price > 0 ? si.Price : si.Part.Price,
                LineTotal = (si.Price > 0 ? si.Price : si.Part.Price) * si.Quantity
            }).ToList()
        };
}
