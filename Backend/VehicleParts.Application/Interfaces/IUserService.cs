using VehicleParts.Application.DTOs;
using VehicleParts.Application.DTOs.Auth;

namespace VehicleParts.Application.Interfaces;

// Application service contract for authentication-related use cases.
public interface IUserService
{
    // Validates credentials and returns login profile data on success.
    Task<LoginResponseDto?> LoginAsync(LoginDto dto);
}