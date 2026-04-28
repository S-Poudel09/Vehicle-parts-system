using Microsoft.AspNetCore.Mvc;
using VehicleParts.Application.DTOs;
using VehicleParts.Application.Interfaces;
using Microsoft.AspNetCore.Authorization;

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

    [HttpPost]
    public async Task<IActionResult> AddCustomer(StaffCustomerDto dto)
    {
        var result = await _service.AddCustomerAsync(dto);
        return Ok(result);
    }
}