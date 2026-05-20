using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VehicleParts.Domain.Entities;

public class PartOrderPaymentLog
{
    [Key]
    public int Id { get; set; }

    public int PartOrderId { get; set; }

    [ForeignKey(nameof(PartOrderId))]
    public CustomerPartOrder PartOrder { get; set; } = null!;

    public int StaffId { get; set; }

    [ForeignKey(nameof(StaffId))]
    public User Staff { get; set; } = null!;

    public decimal AmountVerified { get; set; }

    public decimal TotalPaidAfter { get; set; }

    public decimal PendingAfter { get; set; }

    public string? PaymentReferenceId { get; set; }

    public string? Notes { get; set; }

    public DateTime VerifiedAt { get; set; }
}
