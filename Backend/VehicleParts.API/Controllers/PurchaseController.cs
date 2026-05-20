using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleParts.Application.Constants;
using VehicleParts.Application.DTOs;
using VehicleParts.Application.Interfaces;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class PurchaseController : ControllerBase
{
    private readonly IPurchaseService _purchaseService;
    private readonly IAdminActivityLogService _activityLogs;

    public PurchaseController(IPurchaseService purchaseService, IAdminActivityLogService activityLogs)
    {
        _purchaseService = purchaseService;
        _activityLogs = activityLogs;
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

            var itemsSummary = string.Join(", ",
                result.PurchaseItems.Select(i => $"{i.PartName} x{i.Quantity}"));

            await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
            {
                ActionType = AdminActivityActions.InventoryAdjust,
                Module = AdminActivityModules.Purchases,
                EntityType = "Purchase",
                EntityId = result.Id,
                Description = $"Recorded purchase order #{result.Id} — stock increased.",
                NewValue = itemsSummary,
                Severity = AdminActivitySeverity.Info
            });

            await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
            {
                ActionType = AdminActivityActions.StockUpdate,
                Module = AdminActivityModules.Inventory,
                EntityType = "Purchase",
                EntityId = result.Id,
                Description = $"Inventory updated via purchase #{result.Id}.",
                NewValue = itemsSummary
            });

            return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
        }
        catch (ArgumentException ex)
        {
            // Converts domain validation errors into client-friendly 400 responses.
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("export/csv")]
    public async Task<IActionResult> ExportCsv([FromQuery] PurchaseQueryDto query)
    {
        if (!query.From.HasValue && !query.To.HasValue)
            return BadRequest(new { message = "Select a start date, end date, or both to export purchase orders." });

        var bytes = await _purchaseService.ExportCsvAsync(query);

        var rangeLabel = query.From.HasValue && query.To.HasValue
            ? $"{query.From:yyyyMMdd}-{query.To:yyyyMMdd}"
            : query.From.HasValue
                ? $"from-{query.From:yyyyMMdd}"
                : $"to-{query.To:yyyyMMdd}";

        await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
        {
            ActionType = AdminActivityActions.ReportGenerated,
            Module = AdminActivityModules.Purchases,
            Description = "Exported purchase orders to CSV for the selected date range.",
            NewValue = $"range={rangeLabel}"
        });

        var fileName = $"purchase-orders-{rangeLabel}.csv";
        return File(bytes, "text/csv", fileName);
    }
}