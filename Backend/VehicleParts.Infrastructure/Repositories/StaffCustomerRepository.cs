using Microsoft.EntityFrameworkCore;
using VehicleParts.Application.DTOs;
using VehicleParts.Application.Interfaces;
using VehicleParts.Domain.Entities;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.Infrastructure.Repositories;

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

        return dto;
    }
}