namespace VehicleParts.Application.DTOs;

public class CreatePartOrderDto
{
    public int PartId { get; set; }
    public int Quantity { get; set; } = 1;
}

public class SubmitPartOrderPaymentDto
{
    public string PaymentReferenceId { get; set; } = string.Empty;
    public decimal DeclaredAmount { get; set; }
}

public class UpdatePartOrderStatusDto
{
    public string Status { get; set; } = string.Empty;
    public string? StaffNotes { get; set; }
}

public class VerifyPartOrderPaymentDto
{
    public decimal PaidAmount { get; set; }
    public string? PaymentReferenceId { get; set; }
    public string? Notes { get; set; }
}

public class PartOrderListItemDto
{
    public int Id { get; set; }
    public int PartId { get; set; }
    public string PartName { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal FinalAmount { get; set; }
    public decimal PaidAmount { get; set; }
    public decimal PendingAmount { get; set; }
    public string Status { get; set; } = string.Empty;
    public string? PaymentReferenceId { get; set; }
    public string? InvoiceNumber { get; set; }
    public int? SaleId { get; set; }
    public DateTime CreatedAt { get; set; }
    public string? CustomerName { get; set; }
    public string? CustomerEmail { get; set; }
    public string? CustomerPhone { get; set; }
    public string? StaffName { get; set; }
}

public class PartOrderDetailDto : PartOrderListItemDto
{
    public decimal TotalAmount { get; set; }
    public decimal Discount { get; set; }
    public decimal CustomerDeclaredAmount { get; set; }
    public string? StaffNotes { get; set; }
    public DateTime? ApprovedAt { get; set; }
    public DateTime? PaymentSubmittedAt { get; set; }
    public DateTime? VerifiedAt { get; set; }
    public DateTime? CompletedAt { get; set; }
    public string? PartImageUrl { get; set; }
    public List<PartOrderPaymentLogDto> PaymentLogs { get; set; } = new();
}

public class PartOrderPaymentLogDto
{
    public int Id { get; set; }
    public string StaffName { get; set; } = string.Empty;
    public decimal AmountVerified { get; set; }
    public decimal TotalPaidAfter { get; set; }
    public decimal PendingAfter { get; set; }
    public string? PaymentReferenceId { get; set; }
    public string? Notes { get; set; }
    public DateTime VerifiedAt { get; set; }
}
