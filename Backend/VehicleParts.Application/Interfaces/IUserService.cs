using VehicleParts.Application.DTOs;
using VehicleParts.Application.DTOs.Auth;

namespace VehicleParts.Application.Interfaces;

public interface IUserService
{
    Task<LoginResultDto> LoginAsync(LoginDto dto);
    Task<RegisterResultDto> RegisterAsync(RegisterDto dto);
    Task<(bool Success, string Message)> VerifyEmailAsync(string token);
    Task<(bool Success, string Message)> ResendVerificationEmailAsync(string email);
    Task<(bool Success, string Message)> RequestPasswordResetAsync(string email);
    Task<(bool Success, string Message)> ResetPasswordAsync(ResetPasswordDto dto);

    Task<bool> CreateStaffAsync(CreateStaffDto dto);
    Task<bool> DeactivateStaffAsync(int id);
    Task<bool> DeleteStaffAsync(int id);
    Task<List<UserDto>> GetAllUsersAsync();
    Task<(bool Success, string? ErrorMessage)> DeactivateUserAsync(int id);
    Task<(bool Success, string? ErrorMessage)> ActivateUserAsync(int id, ActivateUserDto dto);
    Task<(bool Success, string? ErrorMessage)> DeleteUserAsync(int id);
}
