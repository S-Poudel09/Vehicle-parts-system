using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VehicleParts.Domain.Enums;

namespace VehicleParts.Domain.Entities;

public class CustomerPartOrder
{
    [Key]
    public int Id { get; set; }

    public int CustomerId { get; set; }

    [ForeignKey(nameof(CustomerId))]
    public Customer Customer { get; set; } = null!;

    public int PartId { get; set; }

    [ForeignKey(nameof(PartId))]
    public Part Part { get; set; } = null!;

    public int Quantity { get; set; }

    public decimal UnitPrice { get; set; }

    public decimal TotalAmount { get; set; }

    public decimal Discount { get; set; }

    public decimal FinalAmount { get; set; }

    public PartOrderStatus Status { get; set; }

    public string? PaymentReferenceId { get; set; }

    public decimal CustomerDeclaredAmount { get; set; }

    public decimal PaidAmount { get; set; }

    public decimal PendingAmount { get; set; }

    public int? HandledByStaffId { get; set; }

    [ForeignKey(nameof(HandledByStaffId))]
    public User? HandledByStaff { get; set; }

    public int? SaleId { get; set; }

    [ForeignKey(nameof(SaleId))]
    public Sale? Sale { get; set; }

    public string? InvoiceNumber { get; set; }

    public string? StaffNotes { get; set; }

    public DateTime CreatedAt { get; set; }

    public DateTime? ApprovedAt { get; set; }

    public DateTime? PaymentSubmittedAt { get; set; }

    public DateTime? VerifiedAt { get; set; }

    public DateTime? CompletedAt { get; set; }

    public ICollection<PartOrderPaymentLog> PaymentLogs { get; set; } = new List<PartOrderPaymentLog>();
}
