using VehicleParts.Application.DTOs;
using VehicleParts.Application.DTOs.Auth;

namespace VehicleParts.Application.Interfaces;

// Application service contract for authentication-related use cases.
public interface IUserService
{
    // Validates credentials and returns login profile data on success.
    Task<LoginResponseDto?> LoginAsync(LoginDto dto);
    
    // Registers a new user with the default Customer role.
    Task<bool> RegisterAsync(RegisterDto dto);

    // Creates a new staff user from Admin portal.
    Task<bool> CreateStaffAsync(CreateStaffDto dto);

    // Deactivates a staff user account so they cannot sign in.
    Task<bool> DeactivateStaffAsync(int id);

    // Deletes a staff user account if safe to remove.
    Task<bool> DeleteStaffAsync(int id);

    // Retrieves all registered users for Admin access.
    Task<List<UserDto>> GetAllUsersAsync();

    // Deactivates any user so they cannot sign in.
    Task<(bool Success, string? ErrorMessage)> DeactivateUserAsync(int id);

    // Reactivates a deactivated user with a new password.
    Task<(bool Success, string? ErrorMessage)> ActivateUserAsync(int id, ActivateUserDto dto);

    // Deletes a user when safe to remove.
    Task<(bool Success, string? ErrorMessage)> DeleteUserAsync(int id);
}