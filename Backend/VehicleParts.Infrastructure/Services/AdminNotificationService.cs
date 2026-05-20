using VehicleParts.Application.Interfaces;
using VehicleParts.Domain.Entities;
using VehicleParts.Domain.Enums;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.Infrastructure.Services;

public class AdminNotificationService : IAdminNotificationService
{
    private readonly AppDbContext _context;

    public AdminNotificationService(AppDbContext context)
    {
        _context = context;
    }

    public void AddPartRequestAlert(Customer customer, PartRequest request)
    {
        var customerName = customer.User?.Name ?? "Unknown";
        var partLabel = string.IsNullOrWhiteSpace(request.PartName)
            ? "a part"
            : request.PartName.Trim();

        var message = $"Customer {customerName} (id: {customer.Id}) requested {partLabel}.";

        if (!string.IsNullOrWhiteSpace(request.Description))
        {
            message += $" Details: {request.Description.Trim()}.";
        }

        _context.Notifications.Add(new Notification
        {
            Type = NotificationType.Info,
            Message = message,
            CreatedAt = DateTime.UtcNow,
            UserId = null
        });
    }

    public void AddSaleCompletedAlert(
        User staff,
        Customer customer,
        IReadOnlyList<(string PartName, int Quantity)> items)
    {
        var staffName = staff.Name ?? "Staff";
        var customerName = customer.User?.Name ?? "Unknown";

        var itemsSummary = FormatSoldItems(items);
        var message =
            $"Staff {staffName} (id: {staff.Id}) sold {itemsSummary} to Customer {customerName} (id: {customer.Id}).";

        _context.Notifications.Add(new Notification
        {
            Type = NotificationType.Success,
            Message = message,
            CreatedAt = DateTime.UtcNow,
            UserId = null
        });
    }

    private static string FormatSoldItems(IReadOnlyList<(string PartName, int Quantity)> items)
    {
        if (items.Count == 0)
            return "items";

        return string.Join(
            ", ",
            items.Select(i =>
            {
                var name = string.IsNullOrWhiteSpace(i.PartName) ? "Part" : i.PartName.Trim();
                return i.Quantity > 1 ? $"{name} x{i.Quantity}" : name;
            }));
    }
}
