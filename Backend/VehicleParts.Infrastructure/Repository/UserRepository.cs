using Microsoft.EntityFrameworkCore;
using VehicleParts.Application.Constants;
using VehicleParts.Application.DTOs;
using VehicleParts.Application.Interfaces;
using VehicleParts.Domain.Entities;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.Infrastructure.Repositories;

public class UserRepository : IUserRepository
{
    private readonly AppDbContext _context;

    public UserRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<User?> GetByEmailAsync(string email)
    {
        // .Include(u => u.Role) loads the Role row from DB
        // so we can read user.Role.Name in the service
        return await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.Email == email);
    }

    public async Task<User?> GetByVerificationTokenAsync(string tokenHash) =>
        await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.EmailVerificationToken == tokenHash);

    public async Task<User?> GetByPasswordResetTokenAsync(string tokenHash) =>
        await _context.Users
            .Include(u => u.Role)
            .FirstOrDefaultAsync(u => u.PasswordResetToken == tokenHash);
    
    public async Task<User?> GetByIdAsync(int id) => await _context.Users.FindAsync(id);

    public async Task<User?> GetByIdWithDetailsAsync(int id) =>
        await _context.Users
            .Include(u => u.Customer)
            .FirstOrDefaultAsync(u => u.Id == id);

    public async Task<bool> HasSalesByStaffIdAsync(int staffId)
        => await _context.Sales.AnyAsync(s => s.StaffId == staffId);

    public async Task<bool> HasLinkedCustomerRecordsAsync(int customerId) =>
        await _context.Sales.AnyAsync(s => s.CustomerId == customerId) ||
        await _context.Vehicles.AnyAsync(v => v.CustomerId == customerId) ||
        await _context.Appointments.AnyAsync(a => a.CustomerId == customerId) ||
        await _context.Reviews.AnyAsync(r => r.CustomerId == customerId) ||
        await _context.PartRequests.AnyAsync(p => p.CustomerId == customerId);

    public async Task<int> CountAdminsAsync() =>
        await _context.Users.CountAsync(u => u.RoleId == 1);
    public async Task<List<User>> FindAllAsync() => await _context.Users.ToListAsync();
    public void Create(User user) => _context.Users.Add(user);
    public void Update(User user) => _context.Users.Update(user);
    public void Delete(User user) => _context.Users.Remove(user);
    public void DeleteCustomer(Customer customer) => _context.Customers.Remove(customer);
    public async Task SaveChangesAsync() => await _context.SaveChangesAsync();

    // Retrieves all users with their role name for Admin API.
    public async Task<List<UserDto>> GetAllUsersAsync()
    {
        return await _context.Users
            .Include(u => u.Role)
            .Select(u => new UserDto
            {
                Id = u.Id,
                Name = u.Name,
                Email = u.Email,
                Role = u.Role.Name,
                IsActive = !u.Password.StartsWith(UserStatusConstants.DeactivatedPasswordPrefix)
            })
            .ToListAsync();
    }
}