using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using VehicleParts.Application.Constants;
using VehicleParts.Application.DTOs;
using VehicleParts.Application.Interfaces;
using VehicleParts.Domain.Entities;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.Infrastructure.Services;

public class AdminActivityLogService : IAdminActivityLogService
{
    private readonly AppDbContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly AdminActivityLogPdfExporter _pdfExporter;

    public AdminActivityLogService(
        AppDbContext context,
        IHttpContextAccessor httpContextAccessor,
        AdminActivityLogPdfExporter pdfExporter)
    {
        _context = context;
        _httpContextAccessor = httpContextAccessor;
        _pdfExporter = pdfExporter;
    }

    public async Task LogAsync(AdminActivityLogEntryDto entry, CancellationToken cancellationToken = default)
    {
        var (ip, userAgent) = GetRequestMetadata();

        _context.AdminActivityLogs.Add(new AdminActivityLog
        {
            ActorUserId = entry.ActorUserId,
            ActorName = entry.ActorName,
            ActorRole = entry.ActorRole,
            ActionType = entry.ActionType,
            Module = entry.Module,
            EntityType = entry.EntityType,
            EntityId = entry.EntityId,
            Description = entry.Description,
            OldValue = Truncate(entry.OldValue, 4000),
            NewValue = Truncate(entry.NewValue, 4000),
            Severity = entry.Severity,
            IpAddress = ip,
            UserAgent = Truncate(userAgent, 512),
            CreatedAt = DateTime.UtcNow
        });

        try
        {
            await _context.SaveChangesAsync(cancellationToken);
        }
        catch (Exception ex)
        {
            // Audit logging must not break primary actions (login, CRUD, etc.).
            _context.ChangeTracker.Clear();
            Console.WriteLine($"[AdminActivityLog] Failed to persist log: {ex.Message}");
        }
    }

    public async Task LogForCurrentUserAsync(
        AdminActivityLogEntryDto entry,
        CancellationToken cancellationToken = default)
    {
        var user = _httpContextAccessor.HttpContext?.User;
        if (user?.Identity?.IsAuthenticated != true)
            return;

        var role = user.FindFirst(ClaimTypes.Role)?.Value ?? "Admin";
        if (!string.Equals(role, "Admin", StringComparison.OrdinalIgnoreCase))
            return;

        entry.ActorUserId ??= ParseInt(user.FindFirst(ClaimTypes.NameIdentifier)?.Value);
        entry.ActorName = string.IsNullOrWhiteSpace(entry.ActorName)
            ? user.FindFirst(ClaimTypes.Name)?.Value ?? "Admin"
            : entry.ActorName;
        entry.ActorRole = role;

        await LogAsync(entry, cancellationToken);
    }

    public async Task<AdminActivityLogPagedResultDto> QueryAsync(
        AdminActivityLogQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var q = BuildFilteredQuery(query);
        var total = await q.CountAsync(cancellationToken);

        var page = Math.Max(1, query.Page);
        var pageSize = Math.Clamp(query.PageSize, 1, 100);

        var rows = await q
            .OrderByDescending(l => l.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(cancellationToken);

        var items = rows.Select(MapProjection).ToList();

        return new AdminActivityLogPagedResultDto
        {
            Items = items,
            TotalCount = total,
            Page = page,
            PageSize = pageSize,
            TotalPages = (int)Math.Ceiling(total / (double)pageSize)
        };
    }

    public async Task<AdminActivityLogSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default)
    {
        var todayStart = DateTime.UtcNow.Date;
        var adminLogs = _context.AdminActivityLogs.Where(l => l.ActorRole == "Admin");

        var actionsToday = await adminLogs.CountAsync(l => l.CreatedAt >= todayStart, cancellationToken);

        var mostActive = await adminLogs
            .Where(l => l.CreatedAt >= todayStart)
            .GroupBy(l => new { l.ActorUserId, l.ActorName })
            .Select(g => new { g.Key.ActorName, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .FirstOrDefaultAsync(cancellationToken);

        var mostModule = await adminLogs
            .Where(l => l.CreatedAt >= todayStart)
            .GroupBy(l => l.Module)
            .Select(g => new { Module = g.Key, Count = g.Count() })
            .OrderByDescending(x => x.Count)
            .FirstOrDefaultAsync(cancellationToken);

        var criticalRows = await _context.AdminActivityLogs
            .Where(l => l.Severity == AdminActivitySeverity.Critical ||
                        l.ActionType == AdminActivityActions.LoginFailed)
            .OrderByDescending(l => l.CreatedAt)
            .Take(8)
            .ToListAsync(cancellationToken);

        var recentCritical = criticalRows.Select(MapProjection).ToList();

        var actionTypes = await _context.AdminActivityLogs
            .Select(l => l.ActionType)
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync(cancellationToken);

        var modules = await _context.AdminActivityLogs
            .Select(l => l.Module)
            .Distinct()
            .OrderBy(x => x)
            .ToListAsync(cancellationToken);

        var adminActors = await _context.Users
            .Include(u => u.Role)
            .Where(u => u.Role.Name == "Admin")
            .Select(u => new AdminActorOptionDto { Id = u.Id, Name = u.Name })
            .ToListAsync(cancellationToken);

        return new AdminActivityLogSummaryDto
        {
            ActionsToday = actionsToday,
            MostActiveAdmin = mostActive?.ActorName,
            MostActiveAdminCount = mostActive?.Count,
            MostModifiedModule = mostModule?.Module,
            MostModifiedModuleCount = mostModule?.Count,
            RecentCritical = recentCritical,
            AvailableActionTypes = actionTypes,
            AvailableModules = modules,
            AdminActors = adminActors
        };
    }

    public async Task<byte[]> ExportCsvAsync(
        AdminActivityLogQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var exportQuery = CloneQuery(query);
        exportQuery.Page = 1;
        exportQuery.PageSize = 10_000;
        var result = await QueryAsync(exportQuery, cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine(
            "Id,Timestamp,Admin,Role,Action,Module,Entity,EntityId,Description,OldValue,NewValue,Severity,IP,UserAgent");

        foreach (var row in result.Items)
        {
            sb.AppendLine(string.Join(",",
                row.Id,
                CsvEscape(row.CreatedAt.ToString("o")),
                CsvEscape(row.ActorName),
                CsvEscape(row.ActorRole),
                CsvEscape(row.ActionType),
                CsvEscape(row.Module),
                CsvEscape(row.EntityType ?? ""),
                row.EntityId?.ToString() ?? "",
                CsvEscape(row.Description),
                CsvEscape(row.OldValue ?? ""),
                CsvEscape(row.NewValue ?? ""),
                CsvEscape(row.Severity),
                CsvEscape(row.IpAddress ?? ""),
                CsvEscape(row.UserAgent ?? "")));
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<byte[]> ExportPdfAsync(
        AdminActivityLogQueryDto query,
        CancellationToken cancellationToken = default)
    {
        var exportQuery = CloneQuery(query);
        exportQuery.Page = 1;
        exportQuery.PageSize = 500;
        var result = await QueryAsync(exportQuery, cancellationToken);
        return _pdfExporter.Generate(result.Items, exportQuery.From, exportQuery.To);
    }

    private static AdminActivityLogQueryDto CloneQuery(AdminActivityLogQueryDto q) =>
        new()
        {
            Search = q.Search,
            From = q.From,
            To = q.To,
            ActorUserId = q.ActorUserId,
            ActionType = q.ActionType,
            Module = q.Module,
            Severity = q.Severity,
            ActorRole = q.ActorRole,
            Page = q.Page,
            PageSize = q.PageSize
        };

    private IQueryable<AdminActivityLog> BuildFilteredQuery(AdminActivityLogQueryDto query)
    {
        var q = _context.AdminActivityLogs.AsQueryable();

        if (!string.IsNullOrWhiteSpace(query.ActorRole))
            q = q.Where(l => l.ActorRole == query.ActorRole);
        else
            q = q.Where(l => l.ActorRole == "Admin");

        if (query.From.HasValue)
            q = q.Where(l => l.CreatedAt >= query.From.Value.ToUniversalTime());

        if (query.To.HasValue)
        {
            var toEnd = query.To.Value.Date.AddDays(1).ToUniversalTime();
            q = q.Where(l => l.CreatedAt < toEnd);
        }

        if (query.ActorUserId.HasValue)
            q = q.Where(l => l.ActorUserId == query.ActorUserId);

        if (!string.IsNullOrWhiteSpace(query.ActionType))
            q = q.Where(l => l.ActionType == query.ActionType);

        if (!string.IsNullOrWhiteSpace(query.Module))
            q = q.Where(l => l.Module == query.Module);

        if (!string.IsNullOrWhiteSpace(query.Severity))
            q = q.Where(l => l.Severity == query.Severity);

        if (!string.IsNullOrWhiteSpace(query.Search))
        {
            var term = query.Search.Trim().ToLower();
            q = q.Where(l =>
                l.Description.ToLower().Contains(term) ||
                l.ActorName.ToLower().Contains(term) ||
                l.Module.ToLower().Contains(term) ||
                l.ActionType.ToLower().Contains(term) ||
                (l.OldValue != null && l.OldValue.ToLower().Contains(term)) ||
                (l.NewValue != null && l.NewValue.ToLower().Contains(term)));
        }

        return q;
    }

    private static AdminActivityLogDto MapProjection(AdminActivityLog l) =>
        new()
        {
            Id = l.Id,
            ActorUserId = l.ActorUserId,
            ActorName = l.ActorName,
            ActorRole = l.ActorRole,
            ActionType = l.ActionType,
            Module = l.Module,
            EntityType = l.EntityType,
            EntityId = l.EntityId,
            Description = l.Description,
            OldValue = l.OldValue,
            NewValue = l.NewValue,
            Severity = l.Severity,
            IpAddress = l.IpAddress,
            UserAgent = l.UserAgent,
            CreatedAt = l.CreatedAt
        };

    private (string? Ip, string? UserAgent) GetRequestMetadata()
    {
        var ctx = _httpContextAccessor.HttpContext;
        if (ctx == null)
            return (null, null);

        var ip = ctx.Connection.RemoteIpAddress?.ToString();
        if (ctx.Request.Headers.TryGetValue("X-Forwarded-For", out var forwarded))
            ip = forwarded.FirstOrDefault() ?? ip;

        var userAgent = ctx.Request.Headers["User-Agent"].ToString();
        return (ip, string.IsNullOrWhiteSpace(userAgent) ? null : userAgent);
    }

    private static int? ParseInt(string? value) =>
        int.TryParse(value, out var id) ? id : null;

    private static string? Truncate(string? value, int max) =>
        value == null ? null : value.Length <= max ? value : value[..max];

    private static string CsvEscape(string value)
    {
        if (value.Contains('"') || value.Contains(',') || value.Contains('\n'))
            return $"\"{value.Replace("\"", "\"\"")}\"";
        return value;
    }
}
