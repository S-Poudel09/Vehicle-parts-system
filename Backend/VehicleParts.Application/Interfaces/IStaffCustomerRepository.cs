using VehicleParts.Application.DTOs;

namespace VehicleParts.Application.Interfaces;

public interface IStaffCustomerRepository
{
    Task<List<StaffCustomerDto>> GetAllCustomersAsync();
    Task<StaffCustomerDto> AddCustomerAsync(StaffCustomerDto dto);
}