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

        return purchases.Select(MapToDto);
    }

    // GET BY ID
    public async Task<PurchaseDto?> GetByIdAsync(int id)
    {
        var p = await _purchaseRepository.GetByIdAsync(id);
        if (p == null) return null;

        return MapToDto(p);
    }

    // CREATE PURCHASE
    public async Task<PurchaseDto> CreateAsync(CreatePurchaseDto dto)
    {
        if (dto.PurchaseItems is null || dto.PurchaseItems.Count == 0)
        {
            throw new ArgumentException("At least one purchase item is required.");
        }

        foreach (var item in dto.PurchaseItems)
        {
            if (item.Quantity <= 0)
            {
                throw new ArgumentException("Purchase item quantity must be greater than zero.");
            }

            if (item.Price < 0)
            {
                throw new ArgumentException("Purchase item price cannot be negative.");
            }
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

        var parts = await _purchaseRepository.GetPartsByIdsAsync(dto.PurchaseItems.Select(i => i.PartId));
        var partsById = parts.ToDictionary(p => p.Id);
        foreach (var item in dto.PurchaseItems)
        {
            partsById[item.PartId].Stock += item.Quantity;
        }

        var calculatedTotal = dto.PurchaseItems.Sum(i => i.Quantity * i.Price);

        var purchase = new Purchase
        {
            VendorId = dto.VendorId,
            TotalAmount = calculatedTotal,
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

        var createdPurchase = await _purchaseRepository.GetByIdAsync(purchase.Id);
        if (createdPurchase is null)
        {
            throw new InvalidOperationException("Purchase invoice was created but could not be loaded.");
        }

        return MapToDto(createdPurchase);
    }

    private static PurchaseDto MapToDto(Purchase purchase)
    {
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
                PartName = i.Part?.Name ?? string.Empty,
                Quantity = i.Quantity,
                Price = i.Price,
                LineTotal = i.Quantity * i.Price
            }).ToList()
        };
    }
}
