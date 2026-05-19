using Microsoft.EntityFrameworkCore;
using VehicleParts.Application.DTOs;
using VehicleParts.Application.Interfaces;
using VehicleParts.Domain.Entities;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.Infrastructure.Repository;

public class StaffCustomerRepository : IStaffCustomerRepository
{
    private readonly AppDbContext _context;

    public StaffCustomerRepository(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<StaffCustomerDto>> GetAllCustomersAsync()
    {
        return await _context.Customers
            .Include(c => c.User)
            .Include(c => c.Vehicles)
            .SelectMany(c => c.Vehicles.Select(v => new StaffCustomerDto
            {
                Id = c.Id,
                FullName = c.User.Name,
                Email = c.User.Email,
                PhoneNumber = c.Phone,
                Address = c.Address,
                VehicleNumber = v.VehicleNumber,
                Model = v.Model,
                Brand = v.Brand
            }))
            .ToListAsync();
    }

    public async Task<StaffCustomerDto> AddCustomerAsync(StaffCustomerDto dto)
    {
        var emailExists = await _context.Users.AnyAsync(u => u.Email == dto.Email);
        if (emailExists)
            throw new InvalidOperationException("A customer with this email already exists.");

        var customerRole = await _context.Roles
            .FirstOrDefaultAsync(r => r.Name == "Customer");

        if (customerRole == null)
        {
            customerRole = new Role
            {
                Name = "Customer"
            };

            _context.Roles.Add(customerRole);
            await _context.SaveChangesAsync();
        }

        var user = new User
        {
            Name = dto.FullName,
            Email = dto.Email,
            Password = "Staff@123",
            CreatedAt = DateTime.UtcNow,
            RoleId = customerRole.Id
        };

        var customer = new Customer
        {
            User = user,
            Phone = dto.PhoneNumber,
            Address = dto.Address,
            Vehicles = new List<Vehicle>()
        };

        var vehicle = new Vehicle
        {
            VehicleNumber = dto.VehicleNumber,
            Model = dto.Model,
            Brand = dto.Brand,
            Customer = customer
        };

        customer.Vehicles.Add(vehicle);

        _context.Users.Add(user);
        _context.Customers.Add(customer);
        _context.Vehicles.Add(vehicle);

        await _context.SaveChangesAsync();

        dto.Id = customer.Id;
        return dto;
    }

    public async Task<StaffCustomerDetailDto?> GetCustomerByIdAsync(int id)
    {
        var customer = await _context.Customers
            .Include(c => c.User)
            .Include(c => c.Vehicles)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer == null)
            return null;

        return MapToDetailDto(customer);
    }

    public async Task<StaffCustomerDetailDto?> UpdateCustomerAsync(int id, UpdateStaffCustomerDto dto)
    {
        var customer = await _context.Customers
            .Include(c => c.User)
            .Include(c => c.Vehicles)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (customer == null)
            return null;

        var emailTaken = await _context.Users.AnyAsync(u => u.Email == dto.Email && u.Id != customer.UserId);
        if (emailTaken)
            throw new InvalidOperationException("Another account already uses this email.");

        customer.User.Name = dto.FullName.Trim();
        customer.User.Email = dto.Email.Trim();
        customer.Phone = dto.PhoneNumber.Trim();
        customer.Address = dto.Address.Trim();

        await _context.SaveChangesAsync();
        return MapToDetailDto(customer);
    }

    public async Task<StaffVehicleDto?> UpdateVehicleAsync(int customerId, int vehicleId, UpdateStaffVehicleDto dto)
    {
        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.Id == vehicleId && v.CustomerId == customerId);

        if (vehicle == null)
            return null;

        vehicle.VehicleNumber = dto.VehicleNumber.Trim();
        vehicle.Brand = dto.Brand.Trim();
        vehicle.Model = dto.Model.Trim();
        vehicle.Year = dto.Year;

        await _context.SaveChangesAsync();

        return new StaffVehicleDto
        {
            Id = vehicle.Id,
            VehicleNumber = vehicle.VehicleNumber,
            Brand = vehicle.Brand,
            Model = vehicle.Model,
            Year = vehicle.Year
        };
    }

    private static StaffCustomerDetailDto MapToDetailDto(Customer customer) =>
        new()
        {
            Id = customer.Id,
            FullName = customer.User.Name,
            Email = customer.User.Email,
            PhoneNumber = customer.Phone,
            Address = customer.Address,
            Vehicles = customer.Vehicles.Select(v => new StaffVehicleDto
            {
                Id = v.Id,
                VehicleNumber = v.VehicleNumber,
                Brand = v.Brand,
                Model = v.Model,
                Year = v.Year
            }).ToList()
        };
}