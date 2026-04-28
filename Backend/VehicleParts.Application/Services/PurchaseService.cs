using VehicleParts.Application.DTOs;
using VehicleParts.Application.Interfaces;
using VehicleParts.Domain.Entities;

namespace VehicleParts.Application.Services;

// Handles purchase workflows, validation, and DTO mapping.
public class PurchaseService : IPurchaseService
{
    private readonly IPurchaseRepository _purchaseRepository;

    public PurchaseService(IPurchaseRepository purchaseRepository)
    {
        _purchaseRepository = purchaseRepository;
    }

    // GET ALL
    public async Task<IEnumerable<PurchaseDto>> GetAllAsync()
    {
        var purchases = await _purchaseRepository.GetAllWithDetailsAsync();

        return purchases.Select(p => new PurchaseDto
        {
            Id = p.Id,
            VendorId = p.VendorId,
            VendorName = p.Vendor?.Name ?? string.Empty,
            TotalAmount = p.TotalAmount,
            PurchaseDate = p.PurchaseDate,
            PurchaseItems = p.PurchaseItems.Select(i => new PurchaseItemDto
            {
                Id = i.Id,
                PartId = i.PartId,
                Quantity = i.Quantity,
                Price = i.Price
            }).ToList()
        });
    }

    // GET BY ID
    public async Task<PurchaseDto?> GetByIdAsync(int id)
    {
        var p = await _purchaseRepository.GetByIdAsync(id);
        if (p == null) return null;

        return new PurchaseDto
        {
            Id = p.Id,
            VendorId = p.VendorId,
            VendorName = p.Vendor?.Name ?? string.Empty,
            TotalAmount = p.TotalAmount,
            PurchaseDate = p.PurchaseDate,
            PurchaseItems = p.PurchaseItems.Select(i => new PurchaseItemDto
            {
                Id = i.Id,
                PartId = i.PartId,
                Quantity = i.Quantity,
                Price = i.Price
            }).ToList()
        };
    }

    // CREATE PURCHASE
    public async Task<PurchaseDto> CreateAsync(CreatePurchaseDto dto)
    {
        if (dto.PurchaseItems.Count == 0)
        {
            throw new ArgumentException("At least one purchase item is required.");
        }

        var vendorExists = await _purchaseRepository.VendorExistsAsync(dto.VendorId);
        if (!vendorExists)
        {
            throw new ArgumentException($"Vendor with id {dto.VendorId} does not exist.");
        }

        var missingPartIds = await _purchaseRepository.GetMissingPartIdsAsync(dto.PurchaseItems.Select(i => i.PartId));
        if (missingPartIds.Count > 0)
        {
            throw new ArgumentException($"Invalid part ids: {string.Join(", ", missingPartIds)}");
        }

        var purchase = new Purchase
        {
            VendorId = dto.VendorId,
            TotalAmount = dto.TotalAmount,
            PurchaseDate = DateTime.UtcNow,
            PurchaseItems = dto.PurchaseItems.Select(i => new PurchaseItem
            {
                PartId = i.PartId,
                Quantity = i.Quantity,
                Price = i.Price
            }).ToList()
        };

        _purchaseRepository.Create(purchase);
        await _purchaseRepository.SaveChangesAsync();

        return new PurchaseDto
        {
            Id = purchase.Id,
            VendorId = purchase.VendorId,
            VendorName = purchase.Vendor?.Name ?? string.Empty,
            TotalAmount = purchase.TotalAmount,
            PurchaseDate = purchase.PurchaseDate,
            PurchaseItems = purchase.PurchaseItems.Select(i => new PurchaseItemDto
            {
                Id = i.Id,
                PartId = i.PartId,
                Quantity = i.Quantity,
                Price = i.Price
            }).ToList()
        };
    }
}