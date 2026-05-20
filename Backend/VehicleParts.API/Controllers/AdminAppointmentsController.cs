using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleParts.Domain.Entities;
using VehicleParts.Domain.Enums;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/admin/appointments")]
[Authorize(Roles = "Admin,Staff")]
public class AdminAppointmentsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminAppointmentsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var appointments = await _context.Appointments
            .Include(a => a.Customer)
                .ThenInclude(c => c.User)
            .Include(a => a.Vehicle)
            .OrderByDescending(a => a.AppointmentDate)
            .Select(a => new
            {
                id = a.Id,
                customerId = a.CustomerId,
                customerName = a.Customer.User.Name,
                customerPhone = a.Customer.Phone,
                vehicleId = a.VehicleId,
                vehicleNumber = a.Vehicle.VehicleNumber,
                vehicleModel = a.Vehicle.Model,
                vehicleBrand = a.Vehicle.Brand,
                appointmentDate = a.AppointmentDate,
                status = a.Status.ToString(),
                description = a.Description
            })
            .ToListAsync();

        return Ok(appointments);
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateAppointmentStatusDto dto)
    {
        var appointment = await _context.Appointments
            .Include(a => a.Customer)
            .Include(a => a.Vehicle)
            .FirstOrDefaultAsync(a => a.Id == id);

        if (appointment == null)
            return NotFound(new { message = "Appointment not found." });

        if (!Enum.TryParse<AppointmentStatus>(dto.Status, true, out var parsedStatus))
            return BadRequest(new { message = "Invalid status value." });

        appointment.Status = parsedStatus;

        string message = parsedStatus switch
        {
            AppointmentStatus.Confirmed => $"Your service booking for {appointment.Vehicle?.Brand} {appointment.Vehicle?.Model} on {appointment.AppointmentDate:MMM dd, yyyy} has been confirmed.",
            AppointmentStatus.Completed => $"Your vehicle service for {appointment.Vehicle?.Brand} {appointment.Vehicle?.Model} has been completed. Thank you for choosing GadiParts!",
            AppointmentStatus.Cancelled => $"Your service booking for {appointment.Vehicle?.Brand} {appointment.Vehicle?.Model} on {appointment.AppointmentDate:MMM dd, yyyy} was cancelled.",
            _ => ""
        };

        if (!string.IsNullOrEmpty(message) && appointment.Customer != null)
        {
            var notification = new Notification
            {
                Type = parsedStatus == AppointmentStatus.Cancelled ? NotificationType.Warning : NotificationType.Success,
                Message = message,
                CreatedAt = DateTime.UtcNow,
                UserId = appointment.Customer.UserId
            };
            _context.Notifications.Add(notification);
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Appointment status updated successfully.",
            id = appointment.Id,
            status = appointment.Status.ToString()
        });
    }
}

public class UpdateAppointmentStatusDto
{
    public string Status { get; set; } = string.Empty;
}
