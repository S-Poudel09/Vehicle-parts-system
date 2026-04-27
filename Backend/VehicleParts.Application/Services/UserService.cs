using VehicleParts.Application.Interfaces;
using VehicleParts.Application.DTOs.Auth;

namespace VehicleParts.Application.Services;

// Handles temporary user sign-in use case.
public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;

    public UserService(IUserRepository userRepository)
    {
        _userRepository = userRepository;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginDto dto)
    {
        // For now this is plain credential matching for seeded users.
        var user = await _userRepository.GetByEmail(dto.Email);
        if (user is null || user.Password != dto.Password)
        {
            return null;
        }

        return new LoginResponseDto
        {
            Id = user.Id,
            Name = user.Name,
            Email = user.Email,
            Role = user.Role?.Name ?? string.Empty
        };
    }
}