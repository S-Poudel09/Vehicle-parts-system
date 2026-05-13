using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleParts.Application.DTOs.Vendor;
using VehicleParts.Application.Interfaces;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
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

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateVendorDto dto)
    {
        var updated = await _service.UpdateAsync(id, dto);
        if (updated is null)
        {
            return NotFound();
        }

        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var deleted = await _service.DeleteAsync(id);
            if (!deleted)
            {
                return NotFound();
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}