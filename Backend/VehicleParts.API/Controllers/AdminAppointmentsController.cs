using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
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
                status = a.Status.ToString()
            })
            .ToListAsync();

        return Ok(appointments);
    }

    [HttpPatch("{id:int}/status")]
    public async Task<IActionResult> UpdateStatus(int id, [FromBody] UpdateAppointmentStatusDto dto)
    {
        var appointment = await _context.Appointments.FindAsync(id);
        if (appointment == null)
            return NotFound(new { message = "Appointment not found." });

        if (!Enum.TryParse<AppointmentStatus>(dto.Status, true, out var parsedStatus))
            return BadRequest(new { message = "Invalid status value." });

        appointment.Status = parsedStatus;
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
