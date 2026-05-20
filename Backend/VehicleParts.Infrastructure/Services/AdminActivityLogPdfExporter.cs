using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using VehicleParts.Application.DTOs;

namespace VehicleParts.Infrastructure.Services;

public class AdminActivityLogPdfExporter
{
    public AdminActivityLogPdfExporter()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] Generate(IReadOnlyList<AdminActivityLogDto> logs, DateTime? from, DateTime? to)
    {
        var rangeLabel = from.HasValue || to.HasValue
            ? $"Period: {(from?.ToString("yyyy-MM-dd") ?? "start")} — {(to?.ToString("yyyy-MM-dd") ?? "now")}"
            : "Period: All records";

        return Document.Create(container =>
        {
            container.Page(page =>
            {
                page.Size(PageSizes.A4.Landscape());
                page.Margin(28);
                page.DefaultTextStyle(x => x.FontSize(9));

                page.Header().Column(col =>
                {
                    col.Item().Text("GadiParts — Admin Activity Log Report").Bold().FontSize(16);
                    col.Item().Text(rangeLabel).FontSize(10).FontColor(Colors.Grey.Darken1);
                    col.Item().Text($"Generated: {DateTime.UtcNow:yyyy-MM-dd HH:mm} UTC").FontSize(9);
                    col.Item().PaddingBottom(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                });

                page.Content().Table(table =>
                {
                    table.ColumnsDefinition(columns =>
                    {
                        columns.ConstantColumn(70);
                        columns.RelativeColumn(2);
                        columns.ConstantColumn(72);
                        columns.ConstantColumn(72);
                        columns.RelativeColumn(3);
                        columns.RelativeColumn(2);
                        columns.RelativeColumn(2);
                    });

                    table.Header(header =>
                    {
                        foreach (var h in new[] { "Time", "Admin", "Action", "Module", "Description", "Old", "New" })
                        {
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(4)
                                .Text(h).Bold().FontSize(8);
                        }
                    });

                    foreach (var log in logs)
                    {
                        table.Cell().Padding(3).Text(log.CreatedAt.ToString("yyyy-MM-dd HH:mm"));
                        table.Cell().Padding(3).Text($"{log.ActorName} ({log.ActorUserId})");
                        table.Cell().Padding(3).Text(log.ActionType);
                        table.Cell().Padding(3).Text(log.Module);
                        table.Cell().Padding(3).Text(log.Description);
                        table.Cell().Padding(3).Text(log.OldValue ?? "—");
                        table.Cell().Padding(3).Text(log.NewValue ?? "—");
                    }
                });

                page.Footer().AlignCenter().Text(text =>
                {
                    text.Span("Page ");
                    text.CurrentPageNumber();
                    text.Span(" of ");
                    text.TotalPages();
                });
            });
        }).GeneratePdf();
    }
}
