using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleParts.Application.Constants;
using VehicleParts.Application.DTOs;
using VehicleParts.Application.Interfaces;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class PartController : ControllerBase
{
    private readonly IPartService _partService;
    private readonly IAdminActivityLogService _activityLogs;

    public PartController(IPartService partService, IAdminActivityLogService activityLogs)
    {
        _partService = partService;
        _activityLogs = activityLogs;
    }

    [HttpGet]
    [Authorize(Roles = "Admin,Staff,Customer")]
    public async Task<IActionResult> GetAll()
    {
        var result = await _partService.GetAllAsync();
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    [Authorize(Roles = "Admin,Staff,Customer")]
    public async Task<IActionResult> GetById(int id)
    {
        var part = await _partService.GetByIdAsync(id);
        if (part is null)
            return NotFound();

        return Ok(part);
    }

    [HttpPost]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Create(CreatePartDto dto)
    {
        try
        {
            var created = await _partService.CreateAsync(dto);

            if (User.IsInRole("Admin"))
            {
                await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
                {
                    ActionType = AdminActivityActions.Create,
                    Module = AdminActivityModules.Parts,
                    EntityType = "Part",
                    EntityId = created.Id,
                    Description = $"Created product {created.Name} (id: {created.Id}).",
                    NewValue = $"price={created.Price}, stock={created.Stock}"
                });
            }

            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id:int}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Update(int id, UpdatePartDto dto)
    {
        try
        {
            var existing = await _partService.GetByIdAsync(id);
            if (existing is null)
                return NotFound();

            var updated = await _partService.UpdateAsync(id, dto);
            if (updated is null)
                return NotFound();

            if (User.IsInRole("Admin"))
            {
                var oldVal = $"name={existing.Name}, price={existing.Price}, stock={existing.Stock}";
                var newVal = $"name={updated.Name}, price={updated.Price}, stock={updated.Stock}";

                await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
                {
                    ActionType = AdminActivityActions.Update,
                    Module = AdminActivityModules.Parts,
                    EntityType = "Part",
                    EntityId = id,
                    Description = $"Updated product {updated.Name} (id: {id}).",
                    OldValue = oldVal,
                    NewValue = newVal
                });

                if (existing.Price != updated.Price)
                {
                    await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
                    {
                        ActionType = AdminActivityActions.PriceChange,
                        Module = AdminActivityModules.Parts,
                        EntityType = "Part",
                        EntityId = id,
                        Description = $"Changed price for {updated.Name} (id: {id}).",
                        OldValue = $"Rs {existing.Price}",
                        NewValue = $"Rs {updated.Price}"
                    });
                }
            }

            return Ok(updated);
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpDelete("{id:int}")]
    [Authorize(Roles = "Admin,Staff")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var existing = await _partService.GetByIdAsync(id);
            var deleted = await _partService.DeleteAsync(id);
            if (!deleted)
                return NotFound();

            if (User.IsInRole("Admin") && existing != null)
            {
                await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
                {
                    ActionType = AdminActivityActions.Delete,
                    Module = AdminActivityModules.Parts,
                    EntityType = "Part",
                    EntityId = id,
                    Description = $"Deleted product {existing.Name} (id: {id}).",
                    OldValue = $"name={existing.Name}, price={existing.Price}",
                    Severity = AdminActivitySeverity.Critical
                });
            }

            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }
}
