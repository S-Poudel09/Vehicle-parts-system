using Microsoft.EntityFrameworkCore;
using VehicleParts.Application.Interfaces;
using VehicleParts.Domain.Entities;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.Infrastructure.Repositories;

// EF Core implementation of purchase repository operations.
public class PurchaseRepository : IPurchaseRepository
{
    private readonly AppDbContext _context;

    public PurchaseRepository(AppDbContext context)
    {
        _context = context;
    }

    
    public async Task<List<Purchase>> GetAllWithDetailsAsync()
    {
        return await _context.Purchases
            .Include(p => p.Vendor)
            .Include(p => p.PurchaseItems)
                .ThenInclude(i => i.Part)
            .ToListAsync();
    }

    public async Task<Purchase?> GetByIdAsync(int id)
    {
        return await _context.Purchases
            .Include(p => p.Vendor)
            .Include(p => p.PurchaseItems)
                .ThenInclude(i => i.Part)
            .FirstOrDefaultAsync(p => p.Id == id);
    }

    public async Task<bool> VendorExistsAsync(int vendorId)
    {
        return await _context.Vendors.AnyAsync(v => v.Id == vendorId);
    }

    public async Task<List<int>> GetMissingPartIdsAsync(IEnumerable<int> partIds)
    {
        var distinctPartIds = partIds.Distinct().ToList();
        var existingPartIds = await _context.Parts
            .Where(p => distinctPartIds.Contains(p.Id))
            .Select(p => p.Id)
            .ToListAsync();

        return distinctPartIds.Except(existingPartIds).ToList();
    }

    public async Task<List<Part>> GetPartsByIdsAsync(IEnumerable<int> partIds)
    {
        var distinctPartIds = partIds.Distinct().ToList();

        return await _context.Parts
            .Where(p => distinctPartIds.Contains(p.Id))
            .ToListAsync();
    }

    public void Create(Purchase purchase)
    {
        _context.Purchases.Add(purchase);
    }

    public void Update(Purchase purchase)
    {
        _context.Purchases.Update(purchase);
    }

    public void Delete(Purchase purchase)
    {
        _context.Purchases.Remove(purchase);
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}
