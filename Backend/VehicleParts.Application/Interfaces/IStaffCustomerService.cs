using VehicleParts.Application.DTOs;

namespace VehicleParts.Application.Interfaces;

public interface IStaffCustomerService
{
    Task<List<StaffCustomerDto>> GetAllCustomersAsync();
    Task<StaffCustomerDto> AddCustomerAsync(StaffCustomerDto dto);
    Task<StaffCustomerDetailDto?> GetCustomerByIdAsync(int id);
    Task<(StaffCustomerDetailDto? Customer, string? ErrorMessage)> UpdateCustomerAsync(int id, UpdateStaffCustomerDto dto);
    Task<(StaffVehicleDto? Vehicle, string? ErrorMessage)> UpdateVehicleAsync(int customerId, int vehicleId, UpdateStaffVehicleDto dto);
}