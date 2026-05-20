using VehicleParts.Application.DTOs;

namespace VehicleParts.Application.Interfaces;

public interface IAdminActivityLogService
{
    Task LogAsync(AdminActivityLogEntryDto entry, CancellationToken cancellationToken = default);

    Task LogForCurrentUserAsync(AdminActivityLogEntryDto entry, CancellationToken cancellationToken = default);

    Task<AdminActivityLogPagedResultDto> QueryAsync(
        AdminActivityLogQueryDto query,
        CancellationToken cancellationToken = default);

    Task<AdminActivityLogSummaryDto> GetSummaryAsync(CancellationToken cancellationToken = default);

    Task<byte[]> ExportCsvAsync(AdminActivityLogQueryDto query, CancellationToken cancellationToken = default);

    Task<byte[]> ExportPdfAsync(AdminActivityLogQueryDto query, CancellationToken cancellationToken = default);
}
