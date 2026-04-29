using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using VehicleParts.Application.DTOs;
using VehicleParts.Application.DTOs.Auth;
using VehicleParts.Application.Interfaces;

namespace VehicleParts.Application.Services;

public class UserService : IUserService
{
    private readonly IUserRepository _userRepository;
    private readonly IConfiguration _configuration;

    // IConfiguration lets us read from appsettings.json
    public UserService(IUserRepository userRepository, IConfiguration configuration)
    {
        _userRepository = userRepository;
        _configuration  = configuration;
    }

    public async Task<LoginResponseDto?> LoginAsync(LoginDto dto)
    {
        // 1. Find the user by email (includes their Role)
        var user = await _userRepository.GetByEmailAsync(dto.Email);

        // 2. If not found or wrong password, return null → controller sends 401
        if (user == null || user.Password != dto.Password)
            return null;

        // 3. Build the JWT token
        var token = GenerateJwtToken(user.Id, user.Email, user.Role.Name);

        // 4. Return user info + token
        return new LoginResponseDto
        {
            Id    = user.Id,
            Name  = user.Name,
            Email = user.Email,
            Role  = user.Role.Name,
            Token = token
        };
    }

    // Retrieves all registered users for Admin API.
    public async Task<List<UserDto>> GetAllUsersAsync()
    {
        return await _userRepository.GetAllUsersAsync();
    }

    private string GenerateJwtToken(int userId, string email, string role)
    {
        // Read settings from appsettings.json
        var key    = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds  = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddMinutes(double.Parse(_configuration["Jwt:ExpiryMinutes"]!));

        // Claims are pieces of info baked INTO the token
        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub,   userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(ClaimTypes.Role,               role),   // used by [Authorize(Roles="Admin")]
            new Claim(JwtRegisteredClaimNames.Jti,   Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer:             _configuration["Jwt:Issuer"],
            audience:           _configuration["Jwt:Audience"],
            claims:             claims,
            expires:            expiry,
            signingCredentials: creds
        );

        // Serialize the token object into the string you send to frontend
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    public async Task<bool> RegisterAsync(RegisterDto dto)
    {
        // 1. Check if user with same email exists
        var existingUser = await _userRepository.GetByEmailAsync(dto.Email);
        if (existingUser != null)
            return false;

        // 2. Create new user with Customer role (RoleId = 3)
        var newUser = new VehicleParts.Domain.Entities.User
        {
            Name = dto.Name,
            Email = dto.Email,
            Password = dto.Password, // Should ideally be hashed, keeping it consistent with Login
            CreatedAt = DateTime.UtcNow,
            RoleId = 3,
            Customer = new VehicleParts.Domain.Entities.Customer
            {
                Phone = "",
                Address = ""
            }
        };

        // 3. Save to database
        _userRepository.Create(newUser);
        await _userRepository.SaveChangesAsync();

        return true;
    }
}