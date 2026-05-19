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

    public async Task<StaffCustomerDetailDto?> GetCustomerByIdAsync(int id)
    {
        return await _repository.GetCustomerByIdAsync(id);
    }

    public async Task<(StaffCustomerDetailDto? Customer, string? ErrorMessage)> UpdateCustomerAsync(
        int id,
        UpdateStaffCustomerDto dto)
    {
        try
        {
            var customer = await _repository.UpdateCustomerAsync(id, dto);
            if (customer == null)
                return (null, "Customer not found.");

            return (customer, null);
        }
        catch (InvalidOperationException ex)
        {
            return (null, ex.Message);
        }
    }

    public async Task<(StaffVehicleDto? Vehicle, string? ErrorMessage)> AddVehicleAsync(
        int customerId,
        UpdateStaffVehicleDto dto)
    {
        try
        {
            var vehicle = await _repository.AddVehicleAsync(customerId, dto);
            if (vehicle == null)
                return (null, "Customer not found.");

            return (vehicle, null);
        }
        catch (InvalidOperationException ex)
        {
            return (null, ex.Message);
        }
    }

    public async Task<(StaffVehicleDto? Vehicle, string? ErrorMessage)> UpdateVehicleAsync(
        int customerId,
        int vehicleId,
        UpdateStaffVehicleDto dto)
    {
        var vehicle = await _repository.UpdateVehicleAsync(customerId, vehicleId, dto);
        if (vehicle == null)
            return (null, "Vehicle not found for this customer.");

        return (vehicle, null);
    }
}
