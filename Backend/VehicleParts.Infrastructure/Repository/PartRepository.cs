using Microsoft.EntityFrameworkCore;
using VehicleParts.Application.Interfaces;
using VehicleParts.Domain.Entities;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.Infrastructure.Repositories;

// Database code for part operations.
public class PartRepository : RepositoryBase<Part>, IPartRepository
{
    public PartRepository(AppDbContext context) : base(context)
    {
    }

    public void IncreaseStock(int partId, int quantity)
    {
        var part = _context.Parts.FirstOrDefault(p => p.Id == partId);
        if (part is null)
        {
            return;
        }

        part.Stock += quantity;
        _context.Parts.Update(part);
    }

    public async Task<bool> VendorExistsAsync(int vendorId)
    {
        return await _context.Vendors.AnyAsync(v => v.Id == vendorId);
    }

    public async Task<bool> IsPartUsedAsync(int partId)
    {
        return await _context.SaleItems.AnyAsync(si => si.PartId == partId)
            || await _context.PurchaseItems.AnyAsync(pi => pi.PartId == partId);
    }
}
