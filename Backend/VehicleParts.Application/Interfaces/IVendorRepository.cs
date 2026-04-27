using System;
using System.Collections.Generic;
using System.Text;
using VehicleParts.Domain.Entities;

namespace VehicleParts.Application.Interfaces
{
    // Vendor-specific persistence contract with detail loading methods.
    public interface IVendorRepository : IRepositoryBase<Vendor>
    {
        // Loads vendors with related part and purchase collections.
        Task<List<Vendor>> GetAllWithDetailsAsync();
        // Loads a single vendor with related part and purchase collections.
        Task<Vendor?> GetByIdWithDetailsAsync(int id);
    }
}
