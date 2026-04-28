using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleParts.Application.DTOs;
using VehicleParts.Application.Interfaces;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class PurchaseController : ControllerBase
{
    private readonly IPurchaseService _purchaseService;

    public PurchaseController(IPurchaseService purchaseService)
    {
        _purchaseService = purchaseService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        // Returns purchases with vendor name and purchase items.
        var result = await _purchaseService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var purchase = await _purchaseService.GetByIdAsync(id);
        if (purchase is null)
        {
            return NotFound();
        }

        return Ok(purchase);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreatePurchaseDto dto)
    {
        try
        {
            // Validates vendor/parts before saving; returns created purchase shape.
            var result = await _purchaseService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            // Converts domain validation errors into client-friendly 400 responses.
            return BadRequest(new { message = ex.Message });
        }
    }
}