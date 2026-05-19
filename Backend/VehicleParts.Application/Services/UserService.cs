using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using VehicleParts.Application.Constants;
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

        if (user.Password.StartsWith(UserStatusConstants.DeactivatedPasswordPrefix))
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

    public async Task<bool> CreateStaffAsync(CreateStaffDto dto)
    {
        var existingUser = await _userRepository.GetByEmailAsync(dto.Email);
        if (existingUser != null)
            return false;

        var newStaff = new VehicleParts.Domain.Entities.User
        {
            Name = dto.Name,
            Email = dto.Email,
            Password = dto.Password, // TODO: hash before storing
            CreatedAt = DateTime.UtcNow,
            RoleId = 2
        };

        _userRepository.Create(newStaff);
        await _userRepository.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeactivateStaffAsync(int id)
    {
        var staff = await _userRepository.GetByIdAsync(id);
        if (staff == null || staff.RoleId != 2)
            return false;

        if (staff.Password.StartsWith(UserStatusConstants.DeactivatedPasswordPrefix))
            return true;

        staff.Password = $"{UserStatusConstants.DeactivatedPasswordPrefix}{Guid.NewGuid()}";
        _userRepository.Update(staff);
        await _userRepository.SaveChangesAsync();

        return true;
    }

    public async Task<bool> DeleteStaffAsync(int id)
    {
        var staff = await _userRepository.GetByIdAsync(id);
        if (staff == null || staff.RoleId != 2)
            return false;

        var hasLinkedSales = await _userRepository.HasSalesByStaffIdAsync(id);
        if (hasLinkedSales)
            return false;

        _userRepository.Delete(staff);
        await _userRepository.SaveChangesAsync();
        return true;
    }

    public async Task<(bool Success, string? ErrorMessage)> DeactivateUserAsync(int id)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
            return (false, "User not found.");

        if (user.RoleId == 1)
            return (false, "Admin accounts cannot be deactivated.");

        if (user.Password.StartsWith(UserStatusConstants.DeactivatedPasswordPrefix))
            return (true, null);

        user.Password = $"{UserStatusConstants.DeactivatedPasswordPrefix}{Guid.NewGuid()}";
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? ErrorMessage)> ActivateUserAsync(int id, ActivateUserDto dto)
    {
        var user = await _userRepository.GetByIdAsync(id);
        if (user == null)
            return (false, "User not found.");

        if (!user.Password.StartsWith(UserStatusConstants.DeactivatedPasswordPrefix))
            return (false, "User is already active.");

        user.Password = dto.Password;
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();
        return (true, null);
    }

    public async Task<(bool Success, string? ErrorMessage)> DeleteUserAsync(int id)
    {
        var user = await _userRepository.GetByIdWithDetailsAsync(id);
        if (user == null)
            return (false, "User not found.");

        if (user.RoleId == 1)
        {
            var adminCount = await _userRepository.CountAdminsAsync();
            if (adminCount <= 1)
                return (false, "Cannot delete the last admin account.");
        }

        if (user.RoleId == 2 && await _userRepository.HasSalesByStaffIdAsync(id))
            return (false, "Cannot delete staff linked to existing sales.");

        if (user.RoleId == 3 && user.Customer != null)
        {
            if (await _userRepository.HasLinkedCustomerRecordsAsync(user.Customer.Id))
                return (false, "Cannot delete customer linked to sales, vehicles, or other records.");

            _userRepository.DeleteCustomer(user.Customer);
        }

        _userRepository.Delete(user);
        await _userRepository.SaveChangesAsync();
        return (true, null);
    }
}