using Microsoft.EntityFrameworkCore;
using VehicleParts.Application.Interfaces;
using VehicleParts.Domain.Entities;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.Infrastructure.Repositories;

// EF Core implementation of vendor-specific repository operations.
public class VendorRepository : RepositoryBase<Vendor>, IVendorRepository
{
    public VendorRepository(AppDbContext context) : base(context)
    {
    }

    public async Task<List<Vendor>> GetAllWithDetailsAsync()
    {
        return await _context.Vendors
            .Include(v => v.Parts)
            .Include(v => v.Purchases)
            .ToListAsync();
    }

    public async Task<Vendor?> GetByIdWithDetailsAsync(int id)
    {
        return await _context.Vendors
            .Include(v => v.Parts)
            .Include(v => v.Purchases)
            .FirstOrDefaultAsync(v => v.Id == id);
    }
}