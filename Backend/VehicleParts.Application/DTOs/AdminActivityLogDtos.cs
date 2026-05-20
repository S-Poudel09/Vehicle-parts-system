using VehicleParts.Application.Constants;

namespace VehicleParts.Application.DTOs;

public class AdminActivityLogDto
{
    public int Id { get; set; }
    public int? ActorUserId { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string ActorRole { get; set; } = string.Empty;
    public string ActionType { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public int? EntityId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string Severity { get; set; } = string.Empty;
    public string? IpAddress { get; set; }
    public string? UserAgent { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class AdminActivityLogQueryDto
{
    public string? Search { get; set; }
    public DateTime? From { get; set; }
    public DateTime? To { get; set; }
    public int? ActorUserId { get; set; }
    public string? ActionType { get; set; }
    public string? Module { get; set; }
    public string? Severity { get; set; }
    public string? ActorRole { get; set; }
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 25;
}

public class AdminActivityLogPagedResultDto
{
    public List<AdminActivityLogDto> Items { get; set; } = new();
    public int TotalCount { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalPages { get; set; }
}

public class AdminActivityLogSummaryDto
{
    public int ActionsToday { get; set; }
    public string? MostActiveAdmin { get; set; }
    public int? MostActiveAdminCount { get; set; }
    public string? MostModifiedModule { get; set; }
    public int? MostModifiedModuleCount { get; set; }
    public List<AdminActivityLogDto> RecentCritical { get; set; } = new();
    public List<string> AvailableActionTypes { get; set; } = new();
    public List<string> AvailableModules { get; set; } = new();
    public List<AdminActorOptionDto> AdminActors { get; set; } = new();
}

public class AdminActorOptionDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

public class AdminActivityLogEntryDto
{
    public int? ActorUserId { get; set; }
    public string ActorName { get; set; } = string.Empty;
    public string ActorRole { get; set; } = "Admin";
    public string ActionType { get; set; } = string.Empty;
    public string Module { get; set; } = string.Empty;
    public string? EntityType { get; set; }
    public int? EntityId { get; set; }
    public string Description { get; set; } = string.Empty;
    public string? OldValue { get; set; }
    public string? NewValue { get; set; }
    public string Severity { get; set; } = AdminActivitySeverity.Info;
}
