using VehicleParts.Application.DTOs;

namespace VehicleParts.Application.Interfaces;

// Methods the API can use for part features.
public interface IPartService
{
    Task<IEnumerable<PartDto>> GetAllAsync();
    Task<PartDto?> GetByIdAsync(int id);
    Task<PartDto> CreateAsync(CreatePartDto dto);
    Task<PartDto?> UpdateAsync(int id, UpdatePartDto dto);
    Task<bool> DeleteAsync(int id);
}
