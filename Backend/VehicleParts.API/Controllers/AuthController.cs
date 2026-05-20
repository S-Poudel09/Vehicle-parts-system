using Microsoft.AspNetCore.Mvc;
using VehicleParts.Application.Constants;
using VehicleParts.Application.DTOs;
using VehicleParts.Application.DTOs.Auth;
using VehicleParts.Application.Interfaces;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _service;
    private readonly IUserRepository _userRepository;
    private readonly IAdminActivityLogService _activityLogs;

    public AuthController(
        IUserService service,
        IUserRepository userRepository,
        IAdminActivityLogService activityLogs)
    {
        _service = service;
        _userRepository = userRepository;
        _activityLogs = activityLogs;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var result = await _service.LoginAsync(dto);

        if (result.Response != null)
        {
            if (string.Equals(result.Response.Role, "Admin", StringComparison.OrdinalIgnoreCase))
            {
                await _activityLogs.LogAsync(new AdminActivityLogEntryDto
                {
                    ActorUserId = result.Response.Id,
                    ActorName = result.Response.Name,
                    ActorRole = "Admin",
                    ActionType = AdminActivityActions.Login,
                    Module = AdminActivityModules.Auth,
                    EntityType = "User",
                    EntityId = result.Response.Id,
                    Description = $"Admin {result.Response.Name} (id: {result.Response.Id}) signed in.",
                    Severity = AdminActivitySeverity.Info
                });

                await _activityLogs.LogAsync(new AdminActivityLogEntryDto
                {
                    ActorUserId = result.Response.Id,
                    ActorName = result.Response.Name,
                    ActorRole = "Admin",
                    ActionType = AdminActivityActions.SessionStart,
                    Module = AdminActivityModules.Auth,
                    Description = "Admin session started.",
                    Severity = AdminActivitySeverity.Info
                });
            }

            return Ok(result.Response);
        }

        if (result.ErrorCode == "EMAIL_NOT_VERIFIED")
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                code = result.ErrorCode,
                message = result.Message
            });
        }

        var attemptedUser = await _userRepository.GetByEmailAsync(dto.Email);
        if (attemptedUser?.Role.Name == "Admin")
        {
            await _activityLogs.LogAsync(new AdminActivityLogEntryDto
            {
                ActorUserId = attemptedUser.Id,
                ActorName = attemptedUser.Name,
                ActorRole = "Admin",
                ActionType = AdminActivityActions.LoginFailed,
                Module = AdminActivityModules.Auth,
                EntityType = "User",
                EntityId = attemptedUser.Id,
                Description = $"Failed login attempt for admin account {attemptedUser.Name} (id: {attemptedUser.Id}).",
                Severity = AdminActivitySeverity.Warning
            });
        }

        return Unauthorized(new { code = "INVALID_CREDENTIALS", message = result.Message });
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        var result = await _service.RegisterAsync(dto);

        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(new
        {
            message = result.Message,
            requiresEmailVerification = result.RequiresEmailVerification
        });
    }

    [HttpPost("verify-email")]
    public async Task<IActionResult> VerifyEmail([FromBody] VerifyEmailDto dto)
    {
        var (success, message) = await _service.VerifyEmailAsync(dto.Token);
        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    [HttpPost("resend-verification")]
    public async Task<IActionResult> ResendVerification([FromBody] ResendVerificationDto dto)
    {
        var (success, message) = await _service.ResendVerificationEmailAsync(dto.Email);
        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    [HttpPost("forgot-password")]
    public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordDto dto)
    {
        var (success, message) = await _service.RequestPasswordResetAsync(dto.Email);
        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }

    [HttpPost("reset-password")]
    public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordDto dto)
    {
        var (success, message) = await _service.ResetPasswordAsync(dto);
        if (!success)
            return BadRequest(new { message });

        return Ok(new { message });
    }
}
