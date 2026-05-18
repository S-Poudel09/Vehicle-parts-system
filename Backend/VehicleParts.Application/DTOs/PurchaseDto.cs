namespace VehicleParts.Application.DTOs;

// Response model used by purchase GET and POST endpoints.
public class PurchaseDto
{
    public int Id { get; set; }
    public int VendorId { get; set; }
    public string VendorName { get; set; } = string.Empty;
    public decimal TotalAmount { get; set; }
    public DateTime PurchaseDate { get; set; }
    public List<PurchaseItemDto> PurchaseItems { get; set; } = [];
}

// Request model used to create a purchase with one or more items.
public class CreatePurchaseDto
{
    public int VendorId { get; set; }
    // Kept for compatibility; the server calculates the saved total from invoice items.
    public decimal TotalAmount { get; set; }
    public List<CreatePurchaseItemDto> PurchaseItems { get; set; } = [];
}

// Request model for each line item in a new purchase.
public class CreatePurchaseItemDto
{
    public int PartId { get; set; }
    public int Quantity { get; set; }
    public decimal Price { get; set; }
}

// Response model for each persisted purchase item.
public class PurchaseItemDto
{
    public int Id { get; set; }
    public int PartId { get; set; }
    public string PartName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal Price { get; set; }
    public decimal LineTotal { get; set; }
}
