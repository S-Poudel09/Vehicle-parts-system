using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleParts.Application.DTOs;
using VehicleParts.Application.Interfaces;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/staff/customers")]
[Authorize(Roles = "Admin,Staff")]
public class StaffCustomersController : ControllerBase
{
    private readonly IStaffCustomerService _service;

    public StaffCustomersController(IStaffCustomerService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetCustomers()
    {
        var result = await _service.GetAllCustomersAsync();
        return Ok(result);
    }

    [HttpGet("search")]
    public async Task<IActionResult> SearchCustomers([FromQuery] string? query)
    {
        var customers = await _service.GetAllCustomersAsync();

        if (string.IsNullOrWhiteSpace(query))
        {
            return Ok(customers);
        }

        string searchTerm = query.Trim().ToLower();

        var result = customers
            .Where(c =>
                c.Id.ToString().Contains(searchTerm) ||
                (!string.IsNullOrWhiteSpace(c.FullName) &&
                    c.FullName.ToLower().Contains(searchTerm)) ||
                (!string.IsNullOrWhiteSpace(c.PhoneNumber) &&
                    c.PhoneNumber.ToLower().Contains(searchTerm)) ||
                (!string.IsNullOrWhiteSpace(c.VehicleNumber) &&
                    c.VehicleNumber.ToLower().Contains(searchTerm))
            )
            .ToList();

        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetCustomer(int id)
    {
        var customer = await _service.GetCustomerByIdAsync(id);
        if (customer == null)
            return NotFound(new { message = "Customer not found." });

        return Ok(customer);
    }

    [HttpPost]
    public async Task<IActionResult> AddCustomer([FromBody] StaffCustomerDto dto)
    {
        try
        {
            var result = await _service.AddCustomerAsync(dto);
            return Ok(result);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateCustomer(int id, [FromBody] UpdateStaffCustomerDto dto)
    {
        var (customer, errorMessage) = await _service.UpdateCustomerAsync(id, dto);
        if (customer == null)
            return BadRequest(new { message = errorMessage ?? "Customer not found." });

        return Ok(customer);
    }

    [HttpPut("{customerId:int}/vehicles/{vehicleId:int}")]
    public async Task<IActionResult> UpdateVehicle(
        int customerId,
        int vehicleId,
        [FromBody] UpdateStaffVehicleDto dto)
    {
        var (vehicle, errorMessage) = await _service.UpdateVehicleAsync(customerId, vehicleId, dto);
        if (vehicle == null)
            return BadRequest(new { message = errorMessage ?? "Vehicle not found." });

        return Ok(vehicle);
    }
}