using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleParts.Application.Constants;
using VehicleParts.Application.DTOs;
using VehicleParts.Application.DTOs.Auth;
using VehicleParts.Application.Interfaces;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Admin")]
public class UsersController : ControllerBase
{
    private readonly IUserService _userService;
    private readonly IAdminActivityLogService _activityLogs;

    public UsersController(IUserService userService, IAdminActivityLogService activityLogs)
    {
        _userService = userService;
        _activityLogs = activityLogs;
    }

    [HttpGet]
    public async Task<IActionResult> GetUsers()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }

    [HttpPost("staff")]
    public async Task<IActionResult> CreateStaff(CreateStaffDto dto)
    {
        var success = await _userService.CreateStaffAsync(dto);

        if (!success)
            return BadRequest("User with this email already exists.");

        await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
        {
            ActionType = AdminActivityActions.Create,
            Module = AdminActivityModules.Staff,
            EntityType = "Staff",
            Description = $"Created staff account {dto.Name} ({dto.Email}).",
            NewValue = $"email={dto.Email}"
        });

        return Ok("Staff user created successfully.");
    }

    [HttpPatch("staff/{id:int}/deactivate")]
    public async Task<IActionResult> DeactivateStaff(int id)
    {
        var success = await _userService.DeactivateStaffAsync(id);
        if (!success)
            return BadRequest("Staff user not found.");

        await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
        {
            ActionType = AdminActivityActions.AccountLock,
            Module = AdminActivityModules.Staff,
            EntityType = "Staff",
            EntityId = id,
            Description = $"Deactivated staff account (id: {id}).",
            Severity = AdminActivitySeverity.Warning
        });

        return Ok("Staff user deactivated successfully.");
    }

    [HttpDelete("staff/{id:int}")]
    public async Task<IActionResult> DeleteStaff(int id)
    {
        var success = await _userService.DeleteStaffAsync(id);
        if (!success)
            return BadRequest("Staff user cannot be deleted (not found or linked to sales).");

        await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
        {
            ActionType = AdminActivityActions.Delete,
            Module = AdminActivityModules.Staff,
            EntityType = "Staff",
            EntityId = id,
            Description = $"Deleted staff account (id: {id}).",
            Severity = AdminActivitySeverity.Critical
        });

        return Ok("Staff user deleted successfully.");
    }

    [HttpPatch("{id:int}/deactivate")]
    public async Task<IActionResult> DeactivateUser(int id)
    {
        var (success, errorMessage) = await _userService.DeactivateUserAsync(id);
        if (!success)
            return BadRequest(errorMessage);

        await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
        {
            ActionType = AdminActivityActions.AccountLock,
            Module = AdminActivityModules.Users,
            EntityType = "User",
            EntityId = id,
            Description = $"Deactivated user account (id: {id}).",
            Severity = AdminActivitySeverity.Warning
        });

        return Ok("User deactivated successfully.");
    }

    [HttpPatch("{id:int}/activate")]
    public async Task<IActionResult> ActivateUser(int id, ActivateUserDto dto)
    {
        var (success, errorMessage) = await _userService.ActivateUserAsync(id, dto);
        if (!success)
            return BadRequest(errorMessage);

        await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
        {
            ActionType = AdminActivityActions.AccountUnlock,
            Module = AdminActivityModules.Users,
            EntityType = "User",
            EntityId = id,
            Description = $"Activated user account (id: {id}).",
            NewValue = "isActive=true"
        });

        return Ok("User activated successfully.");
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteUser(int id)
    {
        var (success, errorMessage) = await _userService.DeleteUserAsync(id);
        if (!success)
            return BadRequest(errorMessage);

        await _activityLogs.LogForCurrentUserAsync(new AdminActivityLogEntryDto
        {
            ActionType = AdminActivityActions.Delete,
            Module = AdminActivityModules.Users,
            EntityType = "User",
            EntityId = id,
            Description = $"Deleted user account (id: {id}).",
            Severity = AdminActivitySeverity.Critical
        });

        return Ok("User deleted successfully.");
    }
}
