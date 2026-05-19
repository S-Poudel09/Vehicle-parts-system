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
        ValidatePartInput(dto.Name, dto.Price);

        var part = new Part
        {
            Name = dto.Name.Trim(),
            Description = dto.Description.Trim(),
            ImageUrl = dto.ImageUrl.Trim(),
            Price = dto.Price,
            // Stock starts from zero and is increased only via confirmed purchases.
            Stock = 0
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

        ValidatePartInput(dto.Name, dto.Price);

        part.Name = dto.Name.Trim();
        part.Description = dto.Description.Trim();
        part.ImageUrl = dto.ImageUrl.Trim();
        part.Price = dto.Price;

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

    private static void ValidatePartInput(string name, decimal price)
    {
        if (string.IsNullOrWhiteSpace(name))
        {
            throw new ArgumentException("Part name is required.");
        }

        if (price < 0)
        {
            throw new ArgumentException("Part price cannot be negative.");
        }
    }

    private static PartDto MapToDto(Part part)
    {
        return new PartDto
        {
            Id = part.Id,
            Name = part.Name,
            Description = part.Description,
            ImageUrl = part.ImageUrl,
            Price = part.Price,
            Stock = part.Stock
        };
    }
}
