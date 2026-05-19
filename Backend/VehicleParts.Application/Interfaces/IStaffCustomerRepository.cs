using VehicleParts.Application.DTOs;

namespace VehicleParts.Application.Interfaces;

public interface IStaffCustomerRepository
{
    Task<List<StaffCustomerDto>> GetAllCustomersAsync();
    Task<StaffCustomerDto> AddCustomerAsync(StaffCustomerDto dto);
    Task<StaffCustomerDetailDto?> GetCustomerByIdAsync(int id);
    Task<StaffCustomerDetailDto?> UpdateCustomerAsync(int id, UpdateStaffCustomerDto dto);
    Task<StaffVehicleDto?> AddVehicleAsync(int customerId, UpdateStaffVehicleDto dto);
    Task<StaffVehicleDto?> UpdateVehicleAsync(int customerId, int vehicleId, UpdateStaffVehicleDto dto);
}