namespace VehicleParts.Application.DTOs.Auth;

public class RegisterResultDto
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool RequiresEmailVerification { get; set; }
}
