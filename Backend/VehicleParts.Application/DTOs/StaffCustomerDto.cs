namespace VehicleParts.Application.DTOs;

public class StaffCustomerDto
{
    public int Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PhoneNumber { get; set; } = string.Empty;
    public string Address { get; set; } = string.Empty;

    public string? VehicleNumber { get; set; }
    
    public string Model { get; set; } = string.Empty;
    
    public string Brand { get; set; } = string.Empty;

    public int? Year { get; set; }
    public int? Odometer { get; set; }
    public string? PrimaryDrivingEnvironment { get; set; }
    public string? EngineType { get; set; }
    public string? VehicleType { get; set; }

    public List<string> VehicleNumbers { get; set; } = new();
}

