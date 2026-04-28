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
        // Temporary sign-in endpoint: validates seeded credentials from database.
        var result = await _service.LoginAsync(dto);

        if (result == null)
            return Unauthorized("Invalid credentials");

        // Returns basic user info (no JWT/token yet).
        return Ok(result);
    }
}