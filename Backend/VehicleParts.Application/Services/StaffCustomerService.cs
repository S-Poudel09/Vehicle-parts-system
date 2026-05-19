using VehicleParts.Application.DTOs;
using VehicleParts.Application.Interfaces;

namespace VehicleParts.Application.Services;

public class StaffCustomerService : IStaffCustomerService
{
    private readonly IStaffCustomerRepository _repository;

    public StaffCustomerService(IStaffCustomerRepository repository)
    {
        _repository = repository;
    }

    public async Task<List<StaffCustomerDto>> GetAllCustomersAsync()
    {
        return await _repository.GetAllCustomersAsync();
    }

    public async Task<StaffCustomerDto> AddCustomerAsync(StaffCustomerDto dto)
    {
        return await _repository.AddCustomerAsync(dto);
    }
}