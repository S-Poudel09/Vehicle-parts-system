using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleParts.Application.Constants;
using VehicleParts.Application.DTOs;
using VehicleParts.Application.DTOs.Vendor;
using VehicleParts.Application.Interfaces;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class VendorController : ControllerBase
{
    private readonly IVendorService _service;
    private readonly IAdminActivityLogService _activityLogs;

    public VendorController(IVendorService service, IAdminActivityLogService activityLogs)
    {
        _service = service;
        _activityLogs = activityLogs;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll() =>
        Ok(await _service.GetAllAsync());

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var vendor = await _service.GetByIdAsync(id);
        if (vendor is null)
            return NotFound();

        return Ok(vendor);
    }

    [HttpPost]
    public async Task<IActionResult> Create(CreateVendorDto dto)
    {
        var created = await _service.CreateAsync(dto);

        await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
        {
            ActionType = AdminActivityActions.Create,
            Module = AdminActivityModules.Vendors,
            EntityType = "Vendor",
            EntityId = created.Id,
            Description = $"Created vendor {created.Name} (id: {created.Id}).",
            NewValue = $"phone={created.Phone}"
        });

        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, UpdateVendorDto dto)
    {
        var existing = await _service.GetByIdAsync(id);
        var updated = await _service.UpdateAsync(id, dto);
        if (updated is null)
            return NotFound();

        await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
        {
            ActionType = AdminActivityActions.Update,
            Module = AdminActivityModules.Vendors,
            EntityType = "Vendor",
            EntityId = id,
            Description = $"Updated vendor {updated.Name} (id: {id}).",
            OldValue = existing != null ? $"name={existing.Name}" : null,
            NewValue = $"name={updated.Name}"
        });

        return Ok(updated);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var existing = await _service.GetByIdAsync(id);
            var deleted = await _service.DeleteAsync(id);
            if (!deleted)
                return NotFound();

            await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
            {
                ActionType = AdminActivityActions.Delete,
                Module = AdminActivityModules.Vendors,
                EntityType = "Vendor",
                EntityId = id,
                Description = $"Deleted vendor {existing?.Name ?? id.ToString()} (id: {id}).",
                Severity = AdminActivitySeverity.Critical
            });

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}
