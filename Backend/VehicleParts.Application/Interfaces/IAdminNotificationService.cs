using VehicleParts.Domain.Entities;

namespace VehicleParts.Application.Interfaces;

/// <summary>
/// Creates in-app notifications visible to admins (UserId = null).
/// Caller should SaveChanges on the same DbContext transaction.
/// </summary>
public interface IAdminNotificationService
{
    void AddPartRequestAlert(Customer customer, PartRequest request);

    void AddSaleCompletedAlert(User staff, Customer customer, IReadOnlyList<(string PartName, int Quantity)> items);
}
