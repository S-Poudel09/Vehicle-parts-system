using VehicleParts.Domain.Entities;
using VehicleParts.Application.DTOs;

namespace VehicleParts.Application.Interfaces;

// User-specific query/persistence operations.
public interface IUserRepository
{
    // Fetches a user by email for login lookup.
    Task<User?> GetByEmailAsync(string email);
    Task<User?> GetByIdAsync(int id);
    Task<List<User>> FindAllAsync();
    Task<List<UserDto>> GetAllUsersAsync();

    void Create(User user);
    void Update(User user);
    void Delete(User user);

    Task SaveChangesAsync();
}