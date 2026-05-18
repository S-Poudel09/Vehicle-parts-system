using VehicleParts.Domain.Entities;

namespace VehicleParts.Application.Interfaces;

// Methods for reading/writing part data.
public interface IPartRepository : IRepositoryBase<Part>
{
    // Add quantity to part stock.
    void IncreaseStock(int partId, int quantity);
    // Check if a vendor id is valid.
    Task<bool> VendorExistsAsync(int vendorId);
}
