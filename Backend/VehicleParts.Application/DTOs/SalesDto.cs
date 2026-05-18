namespace VehicleParts.Application.DTOs;

public class CreateSaleDto
{
    public int CustomerId { get; set; }
    public decimal PaidAmount { get; set; }

    public List<CreateSaleItemDto> Items { get; set; } = new();
}

public class CreateSaleItemDto
{
    public int PartId { get; set; }
    public int Quantity { get; set; }
}