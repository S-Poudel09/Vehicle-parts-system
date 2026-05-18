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

    public async Task<PartDto?> GetByIdAsync(int id)
    {
        var part = await _partRepository.GetByIdAsync(id);
        return part is null ? null : MapToDto(part);
    }

    public async Task<PartDto> CreateAsync(CreatePartDto dto)
    {
        await ValidatePartInputAsync(dto.Name, dto.Price, dto.Stock, dto.VendorId);

        var part = new Part
        {
            Name = dto.Name.Trim(),
            Description = dto.Description.Trim(),
            Price = dto.Price,
            Stock = dto.Stock,
            VendorId = dto.VendorId
        };

        _partRepository.Create(part);
        await _partRepository.SaveChangesAsync();

        return MapToDto(part);
    }

    public async Task<PartDto?> UpdateAsync(int id, UpdatePartDto dto)
    {
        var part = await _partRepository.GetByIdAsync(id);
        if (part is null)
        {
            return null;
        }

        await ValidatePartInputAsync(dto.Name, dto.Price, dto.Stock, dto.VendorId);

        part.Name = dto.Name.Trim();
        part.Description = dto.Description.Trim();
        part.Price = dto.Price;
        part.Stock = dto.Stock;
        part.VendorId = dto.VendorId;

        _partRepository.Update(part);
        await _partRepository.SaveChangesAsync();

        return MapToDto(part);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var part = await _partRepository.GetByIdAsync(id);
        if (part is null)
        {
            return false;
        }

        var partIsUsed = await _partRepository.IsPartUsedAsync(id);
        if (partIsUsed)
        {
            throw new InvalidOperationException(
                "Cannot delete a part that is already used in sales or purchase invoices.");
        }

        _partRepository.Delete(part);
        await _partRepository.SaveChangesAsync();
        return true;
    }

    private async Task ValidatePartInputAsync(string name, decimal price, int stock, int? vendorId)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Part name is required.");
        }

        if (price < 0)
        {
            throw new ArgumentException("Part price cannot be negative.");
        }

        if (stock < 0)
        {
            throw new ArgumentException("Part stock cannot be negative.");
        }

        if (vendorId.HasValue)
        {
            var vendorExists = await _partRepository.VendorExistsAsync(vendorId.Value);
            if (!vendorExists)
            {
                throw new ArgumentException($"Vendor with id {vendorId.Value} does not exist.");
            }
        }
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
