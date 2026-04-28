using VehicleParts.Application.DTOs.Vendor;
using VehicleParts.Application.Interfaces;
using VehicleParts.Domain.Entities;

namespace VehicleParts.Application.Services;

// Handles vendor-related application use cases and DTO mapping.
public class VendorService : IVendorService
{
    private readonly IVendorRepository _repo;

    public VendorService(IVendorRepository repo)
    {
        _repo = repo;
    }

    public async Task<IEnumerable<VendorDto>> GetAllAsync()
    {
        var vendors = await _repo.GetAllWithDetailsAsync();

        return vendors.Select(v => new VendorDto
        {
            Id = v.Id,
            Name = v.Name,
            Phone = v.Phone,
            Address = v.Address,
            PartIds = v.Parts.Select(p => p.Id).ToList(),
            PurchaseIds = v.Purchases.Select(p => p.Id).ToList()
        });
    }

    public async Task<VendorDto> CreateAsync(CreateVendorDto dto)
    {
        var vendor = new Vendor
        {
            Name = dto.Name,
            Phone = dto.Phone,
            Address = dto.Address
        };

        _repo.Create(vendor);
        await _repo.SaveChangesAsync();

        return new VendorDto
        {
            Id = vendor.Id,
            Name = vendor.Name,
            Phone = vendor.Phone,
            Address = vendor.Address,
            PartIds = [],
            PurchaseIds = []
        };
    }

    public async Task<VendorDto?> GetByIdAsync(int id)
    {
        var v = await _repo.GetByIdWithDetailsAsync(id);
        if (v is null)
        {
            return null;
        }

        return new VendorDto
        {
            Id = v.Id,
            Name = v.Name,
            Phone = v.Phone,
            Address = v.Address,
            PartIds = v.Parts.Select(p => p.Id).ToList(),
            PurchaseIds = v.Purchases.Select(p => p.Id).ToList()
        };
    }
}