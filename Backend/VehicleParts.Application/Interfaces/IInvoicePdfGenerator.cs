using VehicleParts.Domain.Entities;

namespace VehicleParts.Application.Interfaces;

public interface IInvoicePdfGenerator
{
    byte[] GenerateSaleInvoicePdf(
        Sale sale,
        decimal paidAmount = 0,
        string? paymentReferenceId = null);
}
