namespace VehicleParts.Application.DTOs;

// return part info.
public class PartDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public int? VendorId { get; set; }
}

// create a new part.
public class CreatePartDto
{
    public string Name { get; set; } = string.Empty;
    public string Description { get; set; } = string.Empty;
    public decimal Price { get; set; }
    public int Stock { get; set; }
    public int? VendorId { get; set; }
}
