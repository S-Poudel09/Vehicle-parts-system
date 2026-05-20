using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleParts.Application.Constants;
using VehicleParts.Application.DTOs;
using VehicleParts.Application.Interfaces;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/admin/activity-logs")]
[Authorize(Roles = "Admin")]
public class AdminActivityLogsController : ControllerBase
{
    private readonly IAdminActivityLogService _activityLogs;

    public AdminActivityLogsController(IAdminActivityLogService activityLogs)
    {
        _activityLogs = activityLogs;
    }

    [HttpGet]
    public async Task<IActionResult> GetLogs([FromQuery] AdminActivityLogQueryDto query) =>
        Ok(await _activityLogs.QueryAsync(query));

    [HttpGet("summary")]
    public async Task<IActionResult> GetSummary() =>
        Ok(await _activityLogs.GetSummaryAsync());

    [HttpGet("export/csv")]
    public async Task<IActionResult> ExportCsv([FromQuery] AdminActivityLogQueryDto query)
    {
        var bytes = await _activityLogs.ExportCsvAsync(query);
        await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
        {
            ActionType = AdminActivityActions.ReportGenerated,
            Module = AdminActivityModules.Reports,
            Description = "Exported admin activity log report (CSV) with current filters.",
            NewValue = "format=CSV"
        });
        var fileName = $"admin-activity-logs-{DateTime.UtcNow:yyyyMMdd-HHmm}.csv";
        return File(bytes, "text/csv", fileName);
    }

    [HttpGet("export/pdf")]
    public async Task<IActionResult> ExportPdf([FromQuery] AdminActivityLogQueryDto query)
    {
        var bytes = await _activityLogs.ExportPdfAsync(query);
        await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
        {
            ActionType = AdminActivityActions.ReportGenerated,
            Module = AdminActivityModules.Reports,
            Description = "Exported admin activity log report (PDF) with current filters.",
            NewValue = $"bytes={bytes.Length}"
        });
        var fileName = $"admin-activity-logs-{DateTime.UtcNow:yyyyMMdd-HHmm}.pdf";
        return File(bytes, "application/pdf", fileName);
    }

    [HttpPost("logout")]
    public async Task<IActionResult> LogLogout()
    {
        await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
        {
            ActionType = AdminActivityActions.Logout,
            Module = AdminActivityModules.Auth,
            EntityType = "Session",
            Description = "Admin signed out of the portal."
        });

        return Ok(new { message = "Logout recorded." });
    }
}
