namespace VehicleParts.Domain.Enums;

public enum PartOrderStatus
{
    PendingApproval,
    Approved,
    AwaitingPayment,
    PaymentVerificationPending,
    PartiallyPaid,
    Paid,
    ReadyForPickup,
    Completed,
    Rejected
}
