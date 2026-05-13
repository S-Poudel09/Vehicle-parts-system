using VehicleParts.Application.DTOs.Vendor;

namespace VehicleParts.Application.Interfaces;

// Vendor use case contract exposed to API layer.
public interface IVendorService
{
    Task<IEnumerable<VendorDto>> GetAllAsync();
    Task<VendorDto?> GetByIdAsync(int id);
    Task<VendorDto> CreateAsync(CreateVendorDto dto);
    Task<VendorDto?> UpdateAsync(int id, UpdateVendorDto dto);
    Task<bool> DeleteAsync(int id);
}