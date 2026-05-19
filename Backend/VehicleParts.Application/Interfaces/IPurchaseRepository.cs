using VehicleParts.Domain.Entities;

namespace VehicleParts.Application.Interfaces;

// Purchase-specific data contract with validation helpers.
public interface IPurchaseRepository
{
    // Loads purchases with vendor and item details.
    Task<List<Purchase>> GetAllWithDetailsAsync();
    // Loads a single purchase with vendor and item details.
    Task<Purchase?> GetByIdAsync(int id);
    // Checks whether a vendor exists before creating purchase.
    Task<bool> VendorExistsAsync(int vendorId);
    // Returns any part ids that do not exist in the catalog.
    Task<List<int>> GetMissingPartIdsAsync(IEnumerable<int> partIds);
    // Loads tracked parts so purchase invoices can update stock.
    Task<List<Part>> GetPartsByIdsAsync(IEnumerable<int> partIds);
    Task ClearLowStockNotificationsAsync(IEnumerable<int> partIds);

    void Create(Purchase purchase);
    void Update(Purchase purchase);
    void Delete(Purchase purchase);

    Task SaveChangesAsync();
}

