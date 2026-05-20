using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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

    public AdminPartRequestsController(AppDbContext context)
    {
        _context = context;
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
            .FirstOrDefaultAsync(pr => pr.Id == id);

        if (request == null)
            return NotFound(new { message = "Part request not found." });

        if (!Enum.TryParse<PartRequestStatus>(dto.Status, true, out var parsedStatus))
            return BadRequest(new { message = "Invalid status value." });

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
