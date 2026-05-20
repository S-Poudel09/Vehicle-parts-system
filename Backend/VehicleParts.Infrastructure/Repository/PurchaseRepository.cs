using Microsoft.EntityFrameworkCore;
using VehicleParts.Application.DTOs;
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

    public async Task<List<Purchase>> GetFilteredWithDetailsAsync(PurchaseQueryDto query)
    {
        var q = _context.Purchases
            .Include(p => p.Vendor)
            .Include(p => p.PurchaseItems)
                .ThenInclude(i => i.Part)
            .AsQueryable();

        if (query.From.HasValue)
            q = q.Where(p => p.PurchaseDate >= query.From.Value.ToUniversalTime());

        if (query.To.HasValue)
        {
            var toEnd = query.To.Value.Date.AddDays(1).ToUniversalTime();
            q = q.Where(p => p.PurchaseDate < toEnd);
        }

        if (query.VendorId.HasValue)
            q = q.Where(p => p.VendorId == query.VendorId.Value);

        if (query.MinAmount.HasValue)
            q = q.Where(p => p.TotalAmount >= query.MinAmount.Value);

        if (query.MaxAmount.HasValue)
            q = q.Where(p => p.TotalAmount <= query.MaxAmount.Value);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim();
            if (int.TryParse(term, out var purchaseId))
            {
                q = q.Where(p =>
                    p.Id == purchaseId ||
                    (p.Vendor != null && p.Vendor.Name.ToLower().Contains(term.ToLower())));
            }
            else
            {
                var lower = term.ToLower();
                q = q.Where(p => p.Vendor != null && p.Vendor.Name.ToLower().Contains(lower));
            }
        }

        return await q
            .OrderByDescending(p => p.PurchaseDate)
            .ThenByDescending(p => p.Id)
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

    public async Task ClearLowStockNotificationsAsync(IEnumerable<int> partIds)
    {
        var list = partIds.ToList();
        var warnings = await _context.Notifications
            .Where(n => n.Type == Domain.Enums.NotificationType.Warning)
            .ToListAsync();

        var toRemove = warnings
            .Where(n => list.Any(id => n.Message.Contains($"ID: {id}")))
            .ToList();

        if (toRemove.Any())
        {
            _context.Notifications.RemoveRange(toRemove);
        }
    }

    public async Task SaveChangesAsync()
    {
        await _context.SaveChangesAsync();
    }
}

