using Microsoft.AspNetCore.Mvc;
using VehicleParts.Application.DTOs.Vendor;
using VehicleParts.Application.Interfaces;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class VendorController : ControllerBase
{
    private readonly IVendorService _service;

    public VendorController(IVendorService service)
    {
        _service = service;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
        // Returns vendors with related ids (parts and purchases).
        => Ok(await _service.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var vendor = await _service.GetByIdAsync(id);
        if (vendor is null)
        {
            return NotFound();
        }

        return Ok(vendor);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateVendorDto dto)
    {
        // Creates a new vendor and returns location header for GET by id.
        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }
}