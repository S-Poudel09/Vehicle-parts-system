using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/staff/customers")]
[Authorize(Roles = "Admin,Staff")]
public class CustomerHistoryController : ControllerBase
{
    private readonly AppDbContext _context;

    public CustomerHistoryController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet("{id:int}/history")]
    public async Task<IActionResult> GetCustomerHistory(int id)
    {
        var customer = await _context.Customers
            .Include(c => c.User)
            .Include(c => c.Vehicles)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer == null)
            return NotFound("Customer not found.");

        var salesHistory = await _context.Sales
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Part)
            .Where(s => s.CustomerId == id)
            .OrderByDescending(s => s.SaleDate)
            .Select(s => new
            {
                saleId = s.Id,
                saleDate = s.SaleDate,
                totalAmount = s.TotalAmount,
                discount = s.Discount,
                finalAmount = s.FinalAmount,
                paymentStatus = s.PaymentStatus.ToString(),

                items = s.SaleItems.Select(si => new
                {
                    partId = si.PartId,
                    partName = si.Part.Name,
                    quantity = si.Quantity,
                    price = si.Price,
                    lineTotal = si.Quantity * si.Price
                }).ToList()
            })
            .ToListAsync();

        return Ok(new
        {
            customer = new
            {
                id = customer.Id,
                fullName = customer.User.Name,
                email = customer.User.Email,
                phoneNumber = customer.Phone,
                address = customer.Address
            },

            vehicles = customer.Vehicles.Select(v => new
            {
                id = v.Id,
                vehicleNumber = v.VehicleNumber,
                brand = v.Brand,
                model = v.Model
            }).ToList(),

            purchaseHistory = salesHistory
        });
    }
}