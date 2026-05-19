using System.ComponentModel.DataAnnotations;

namespace VehicleParts.Application.DTOs.Auth;

public class ActivateUserDto
{
    [Required]
    [MinLength(6)]
    public string Password { get; set; } = string.Empty;
}
