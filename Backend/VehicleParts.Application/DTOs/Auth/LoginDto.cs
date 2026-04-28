namespace VehicleParts.Application.DTOs.Auth;

// Request model for temporary sign-in.
public class LoginDto
{
    public string Email { get; set; } = string.Empty;
    public string Password { get; set; } = string.Empty;
}