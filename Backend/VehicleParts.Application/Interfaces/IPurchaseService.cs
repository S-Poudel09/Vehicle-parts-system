using VehicleParts.Application.DTOs;

namespace VehicleParts.Application.Interfaces;

// Purchase use case contract exposed to API layer.
public interface IPurchaseService
{
    Task<IEnumerable<PurchaseDto>> GetAllAsync();
    Task<PurchaseDto?> GetByIdAsync(int id);
    Task<PurchaseDto> CreateAsync(CreatePurchaseDto dto);
}