using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
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
    private readonly IEmailService _emailService;
    private readonly IConfiguration _configuration;

    public UserService(
        IUserRepository userRepository,
        IEmailService emailService,
        IConfiguration configuration)
    {
        _userRepository = userRepository;
        _emailService = emailService;
        _configuration = configuration;
    }

    public async Task<LoginResultDto> LoginAsync(LoginDto dto)
    {
        var user = await _userRepository.GetByEmailAsync(dto.Email);

        if (user == null || user.Password != dto.Password)
        {
            return new LoginResultDto
            {
                ErrorCode = "INVALID_CREDENTIALS",
                Message = "Invalid email or password."
            };
        }

        if (user.Password.StartsWith(UserStatusConstants.DeactivatedPasswordPrefix))
        {
            return new LoginResultDto
            {
                ErrorCode = "INVALID_CREDENTIALS",
                Message = "Invalid email or password."
            };
        }

        // Email verification applies to customer accounts only (public signup).
        if (user.RoleId == 3 && !user.EmailVerified)
        {
            return new LoginResultDto
            {
                ErrorCode = "EMAIL_NOT_VERIFIED",
                Message = "Please verify your email before signing in."
            };
        }

        var token = GenerateJwtToken(user.Id, user.Email, user.Role.Name);

        return new LoginResultDto
        {
            Response = new LoginResponseDto
            {
                Id = user.Id,
                Name = user.Name,
                Email = user.Email,
                Role = user.Role.Name,
                Token = token
            }
        };
    }

    public async Task<List<UserDto>> GetAllUsersAsync()
    {
        return await _userRepository.GetAllUsersAsync();
    }

    public async Task<RegisterResultDto> RegisterAsync(RegisterDto dto)
    {
        var existingUser = await _userRepository.GetByEmailAsync(dto.Email);
        if (existingUser != null)
        {
            return new RegisterResultDto
            {
                Success = false,
                Message = "User with this email already exists."
            };
        }

        var (rawToken, tokenHash) = CreateVerificationToken();

        var newUser = new VehicleParts.Domain.Entities.User
        {
            Name = dto.Name,
            Email = dto.Email.Trim(),
            Password = dto.Password,
            CreatedAt = DateTime.UtcNow,
            RoleId = 3,
            EmailVerified = false,
            EmailVerificationToken = tokenHash,
            EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24),
            Customer = new VehicleParts.Domain.Entities.Customer
            {
                Phone = "",
                Address = ""
            }
        };

        _userRepository.Create(newUser);
        await _userRepository.SaveChangesAsync();

        try
        {
            await SendVerificationEmailAsync(newUser.Email, newUser.Name, rawToken);
        }
        catch
        {
            return new RegisterResultDto
            {
                Success = false,
                Message = "Account created but verification email could not be sent. Contact support or try again later."
            };
        }

        return new RegisterResultDto
        {
            Success = true,
            RequiresEmailVerification = true,
            Message = "Registration successful. Check your email for a verification link."
        };
    }

    public async Task<(bool Success, string Message)> VerifyEmailAsync(string token)
    {
        if (string.IsNullOrWhiteSpace(token))
            return (false, "Invalid verification link.");

        var tokenHash = HashVerificationToken(token.Trim());
        var user = await _userRepository.GetByVerificationTokenAsync(tokenHash);

        if (user == null)
            return (false, "Invalid or expired verification link.");

        if (user.RoleId != 3)
            return (false, "This verification link is not valid for this account.");

        if (user.EmailVerified)
            return (true, "Email is already verified. You can sign in.");

        if (user.EmailVerificationTokenExpiresAt is null ||
            user.EmailVerificationTokenExpiresAt < DateTime.UtcNow)
        {
            return (false, "Verification link has expired. Request a new one from the sign-in page.");
        }

        user.EmailVerified = true;
        user.EmailVerificationToken = null;
        user.EmailVerificationTokenExpiresAt = null;
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        return (true, "Email verified successfully. You can now sign in.");
    }

    public async Task<(bool Success, string Message)> ResendVerificationEmailAsync(string email)
    {
        if (string.IsNullOrWhiteSpace(email))
            return (false, "Email is required.");

        var user = await _userRepository.GetByEmailAsync(email.Trim());
        if (user == null)
            return (true, "If an account exists for this email, a verification link has been sent.");

        if (user.EmailVerified)
            return (false, "This email is already verified. You can sign in.");

        if (user.RoleId != 3)
            return (true, "If an account exists for this email, a verification link has been sent.");

        var (rawToken, tokenHash) = CreateVerificationToken();
        user.EmailVerificationToken = tokenHash;
        user.EmailVerificationTokenExpiresAt = DateTime.UtcNow.AddHours(24);
        _userRepository.Update(user);
        await _userRepository.SaveChangesAsync();

        try
        {
            await SendVerificationEmailAsync(user.Email, user.Name, rawToken);
        }
        catch
        {
            return (false, "Could not send verification email. Check SMTP settings and try again.");
        }

        return (true, "Verification email sent. Check your inbox.");
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
            Password = dto.Password,
            CreatedAt = DateTime.UtcNow,
            RoleId = 2,
            EmailVerified = true
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

    private async Task SendVerificationEmailAsync(string email, string name, string rawToken)
    {
        var frontendBase = _configuration["App:FrontendBaseUrl"]?.TrimEnd('/')
            ?? "http://localhost:5173";
        var verifyUrl = $"{frontendBase}/verify-email?token={Uri.EscapeDataString(rawToken)}";

        var subject = "Verify your GadiParts account";
        var body = $"""
            <p>Hi {System.Net.WebUtility.HtmlEncode(name)},</p>
            <p>Thanks for signing up. Please verify your email address by clicking the link below:</p>
            <p><a href="{verifyUrl}">Verify my email</a></p>
            <p>This link expires in 24 hours.</p>
            <p>If you did not create an account, you can ignore this email.</p>
            """;

        await _emailService.SendEmailAsync(email, subject, body);
    }

    private static (string RawToken, string TokenHash) CreateVerificationToken()
    {
        var rawToken = Convert.ToBase64String(RandomNumberGenerator.GetBytes(32))
            .Replace("+", "-")
            .Replace("/", "_")
            .TrimEnd('=');
        return (rawToken, HashVerificationToken(rawToken));
    }

    private static string HashVerificationToken(string token)
    {
        var bytes = SHA256.HashData(Encoding.UTF8.GetBytes(token));
        return Convert.ToHexString(bytes);
    }

    private string GenerateJwtToken(int userId, string email, string role)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_configuration["Jwt:Key"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiry = DateTime.UtcNow.AddMinutes(double.Parse(_configuration["Jwt:ExpiryMinutes"]!));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, userId.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, email),
            new Claim(ClaimTypes.Role, role),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _configuration["Jwt:Issuer"],
            audience: _configuration["Jwt:Audience"],
            claims: claims,
            expires: expiry,
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }
}
