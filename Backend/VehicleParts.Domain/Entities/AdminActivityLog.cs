using System.ComponentModel.DataAnnotations;

namespace VehicleParts.Domain.Entities;

public class AdminActivityLog
{
    [Key]
    public int Id { get; set; }

    public int? ActorUserId { get; set; }

    public string ActorName { get; set; } = string.Empty;

    /// <summary>Admin, Staff, or System</summary>
    public string ActorRole { get; set; } = "Admin";

    public string ActionType { get; set; } = string.Empty;

    public string Module { get; set; } = string.Empty;

    public string? EntityType { get; set; }

    public int? EntityId { get; set; }

    public string Description { get; set; } = string.Empty;

    public string? OldValue { get; set; }

    public string? NewValue { get; set; }

    /// <summary>Info, Warning, or Critical</summary>
    public string Severity { get; set; } = "Info";

    public string? IpAddress { get; set; }

    public string? UserAgent { get; set; }

    public DateTime CreatedAt { get; set; }
}
