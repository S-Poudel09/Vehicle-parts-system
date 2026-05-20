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
}