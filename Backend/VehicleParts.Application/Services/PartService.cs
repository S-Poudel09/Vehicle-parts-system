using VehicleParts.Application.DTOs;
using VehicleParts.Application.Interfaces;
using VehicleParts.Domain.Entities;

namespace VehicleParts.Application.Services;

// Business logic for part features.
public class PartService : IPartService
{
    private readonly IPartRepository _partRepository;

    public PartService(IPartRepository partRepository)
    {
        _partRepository = partRepository;
    }

    public async Task<IEnumerable<PartDto>> GetAllAsync()
    {
        var parts = await _partRepository.FindAllAsync();
        return parts.Select(MapToDto);
    }

    public async Task<PartDto> CreateAsync(CreatePartDto dto)
    {
        if (dto.VendorId.HasValue)
        {
            var vendorExists = await _partRepository.VendorExistsAsync(dto.VendorId.Value);
            if (!vendorExists)
            {
                throw new ArgumentException($"Vendor with id {dto.VendorId.Value} does not exist.");
            }
        }

        var part = new Part
        {
            Name = dto.Name,
            Description = dto.Description,
            Price = dto.Price,
            Stock = dto.Stock,
            VendorId = dto.VendorId
        };

        _partRepository.Create(part);
        await _partRepository.SaveChangesAsync();

        return MapToDto(part);
    }

    private static PartDto MapToDto(Part part)
    {
        return new PartDto
        {
            Id = part.Id,
            Name = part.Name,
            Description = part.Description,
            Price = part.Price,
            Stock = part.Stock,
            VendorId = part.VendorId
        };
    }
}
