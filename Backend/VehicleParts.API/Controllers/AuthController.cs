using Microsoft.AspNetCore.Mvc;
using VehicleParts.Application.DTOs.Auth;
using VehicleParts.Application.Interfaces;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IUserService _service;

    public AuthController(IUserService service)
    {
        _service = service;
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        var result = await _service.LoginAsync(dto);

        if (result.Response != null)
            return Ok(result.Response);

        if (result.ErrorCode == "EMAIL_NOT_VERIFIED")
        {
            return StatusCode(StatusCodes.Status403Forbidden, new
            {
                code = result.ErrorCode,
                message = result.Message
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
}
