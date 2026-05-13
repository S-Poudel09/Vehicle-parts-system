namespace VehicleParts.Application.DTOs.Vendor;

// Response model used by vendor endpoints.
public class VendorDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
    public List<int> PartIds { get; set; } = [];
    public List<int> PurchaseIds { get; set; } = [];
}

// Request model used to create a new vendor.
public class CreateVendorDto
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
}

// Request model used to update an existing vendor.
public class UpdateVendorDto
{
    public string Name { get; set; } = string.Empty;
    public string Phone { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;
}