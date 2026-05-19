namespace VehicleParts.Application.DTOs.Auth;

public class LoginResultDto
{
    public LoginResponseDto? Response { get; set; }
    public string? ErrorCode { get; set; }
    public string? Message { get; set; }
}
