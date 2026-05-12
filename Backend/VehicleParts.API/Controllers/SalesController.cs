using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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

    [HttpPost]
    public async Task<IActionResult> CreateSale(CreateSaleDto dto)
    {
        if (dto.Items == null || !dto.Items.Any())
            return BadRequest("At least one part is required.");

        var customer = await _context.Customers.FindAsync(dto.CustomerId);
        if (customer == null)
            return NotFound("Customer not found.");

        var staffIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

        if (string.IsNullOrEmpty(staffIdClaim))
            return Unauthorized("Staff id not found in token.");

        int staffId = int.Parse(staffIdClaim);

        decimal totalAmount = 0;
        var saleItems = new List<SaleItem>();

        foreach (var item in dto.Items)
        {
            var part = await _context.Parts.FindAsync(item.PartId);

            if (part == null)
                return NotFound($"Part with ID {item.PartId} not found.");

            if (item.Quantity <= 0)
                return BadRequest("Quantity must be greater than zero.");

            if (part.Stock < item.Quantity)
                return BadRequest($"Not enough stock for {part.Name}.");

            decimal lineTotal = part.Price * item.Quantity;
            totalAmount += lineTotal;

            part.Stock -= item.Quantity;

            saleItems.Add(new SaleItem
            {
                PartId = part.Id,
                Quantity = item.Quantity
            });
        }

        decimal discount = totalAmount > 5000 ? totalAmount * 0.10m : 0;
        decimal finalAmount = totalAmount - discount;

        var sale = new Sale
        {
            CustomerId = dto.CustomerId,
            StaffId = staffId,
            TotalAmount = totalAmount,
            Discount = discount,
            FinalAmount = finalAmount,
            SaleDate = DateTime.UtcNow,
            PaymentStatus = PaymentStatus.Paid,
            SaleItems = saleItems
        };

        _context.Sales.Add(sale);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Sale created successfully.",
            saleId = sale.Id,
            totalAmount = sale.TotalAmount,
            discount = sale.Discount,
            finalAmount = sale.FinalAmount
        });
    }
}