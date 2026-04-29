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
    public async Task<IActionResult> SearchCustomers([FromQuery] string query)
    {
        var customers = await _service.GetAllCustomersAsync();

        if (string.IsNullOrWhiteSpace(query))
            return Ok(customers);

        query = query.ToLower();

        var result = customers.Where(c =>
            c.FullName.ToLower().Contains(query) ||
            c.Email.ToLower().Contains(query) ||
            c.PhoneNumber.Contains(query) ||
            c.Address.ToLower().Contains(query) ||
            c.VehicleNumber.ToLower().Contains(query)
        ).ToList();

        return Ok(result);
    }

    [HttpPost]
    public async Task<IActionResult> AddCustomer(StaffCustomerDto dto)
    {
        var result = await _service.AddCustomerAsync(dto);
        return Ok(result);
    }
}