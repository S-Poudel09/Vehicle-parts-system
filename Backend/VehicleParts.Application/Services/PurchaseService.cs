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
        if (dto.VendorId <= 0)
        {
            throw new ArgumentException("A valid vendor must be selected.");
        }

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

            if (item.Price <= 0)
            {
                throw new ArgumentException("Purchase item price must be greater than zero.");
            }
        }

        var duplicatePartIds = dto.PurchaseItems
            .GroupBy(i => i.PartId)
            .Where(g => g.Count() > 1)
            .Select(g => g.Key)
            .ToList();
        if (duplicatePartIds.Count > 0)
        {
            throw new ArgumentException($"Duplicate part ids are not allowed: {string.Join(", ", duplicatePartIds)}");
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

        // Clear low stock notifications if replenished stock is now >= 10
        var replenishedParts = dto.PurchaseItems
            .Where(i => partsById[i.PartId].Stock >= 10)
            .Select(i => i.PartId)
            .ToList();

        if (replenishedParts.Any())
        {
            await _purchaseRepository.ClearLowStockNotificationsAsync(replenishedParts);
        }

        await _purchaseRepository.SaveChangesAsync();


        var createdPurchase = await _purchaseRepository.GetByIdAsync(purchase.Id);
        if (createdPurchase is null)
        {
            throw new InvalidOperationException("Purchase was created but could not be loaded.");
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
            VendorPhone = purchase.Vendor?.Phone ?? string.Empty,
            VendorAddress = purchase.Vendor?.Address ?? string.Empty,
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
