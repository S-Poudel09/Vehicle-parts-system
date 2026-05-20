using System.Globalization;
using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using VehicleParts.Application.Interfaces;
using VehicleParts.Domain.Entities;
using VehicleParts.Domain.Enums;

namespace VehicleParts.Infrastructure.Services;

public class SaleInvoicePdfGenerator : IInvoicePdfGenerator
{
    static SaleInvoicePdfGenerator()
    {
        QuestPDF.Settings.License = LicenseType.Community;
    }

    public byte[] GenerateSaleInvoicePdf(
        Sale sale,
        decimal paidAmount = 0,
        string? paymentReferenceId = null)
    {
        var invoiceNumber = $"GP-SAL-2026-{sale.Id}";
        var subtotal = sale.FinalAmount / 1.13m;
        var vatAmount = sale.FinalAmount - subtotal;
        if (paidAmount <= 0 && sale.PaymentStatus == PaymentStatus.Paid)
            paidAmount = sale.FinalAmount;
        var pendingAmount = Math.Max(0, sale.FinalAmount - paidAmount);
        var staffName = sale.Staff?.Name ?? "GadiParts Staff";

        return Document.Create(document =>
        {
            document.Page(page =>
            {
                page.Size(PageSizes.A4);
                page.Margin(40);
                page.DefaultTextStyle(style => style.FontSize(10));

                page.Header().Column(column =>
                {
                    column.Item().Text("GADI PARTS SELLING & INVENTORY")
                        .FontSize(16).Bold();
                    column.Item().Text("Kathmandu, Nepal | Phone: +977-1-4400000")
                        .FontSize(9).FontColor(Colors.Grey.Darken2);
                    column.Item().Text("accounts@gadiparts.com")
                        .FontSize(9).FontColor(Colors.Grey.Darken2);
                    column.Item().PaddingTop(12).Row(row =>
                    {
                        row.RelativeItem().Text("SALES INVOICE").FontSize(12).Bold();
                        row.ConstantItem(180).AlignRight().Column(right =>
                        {
                            right.Item().Text(invoiceNumber).FontSize(10).SemiBold();
                            right.Item().Text($"Date: {sale.SaleDate:dd MMM yyyy}");
                            right.Item().Text($"Payment: {sale.PaymentStatus}");
                        });
                    });
                    column.Item().PaddingVertical(8).LineHorizontal(1).LineColor(Colors.Grey.Lighten2);
                });

                page.Content().Column(column =>
                {
                    column.Spacing(12);

                    column.Item().Row(row =>
                    {
                        row.RelativeItem().Column(left =>
                        {
                            left.Item().Text("BILL TO").FontSize(8).FontColor(Colors.Grey.Darken1);
                            left.Item().Text(sale.Customer.User.Name).Bold();
                            left.Item().Text($"Tel: {sale.Customer.Phone}");
                            left.Item().Text(sale.Customer.User.Email);
                            left.Item().Text(sale.Customer.Address);
                        });
                        row.RelativeItem().Column(right =>
                        {
                            right.Item().Text("SOLD BY").FontSize(8).FontColor(Colors.Grey.Darken1);
                            right.Item().Text(staffName).Bold();
                            right.Item().Text("Vehicle Parts Counter");
                            right.Item().Text("Kathmandu, Nepal");
                        });
                    });

                    column.Item().Table(table =>
                    {
                        table.ColumnsDefinition(columns =>
                        {
                            columns.ConstantColumn(28);
                            columns.RelativeColumn(3);
                            columns.ConstantColumn(50);
                            columns.ConstantColumn(70);
                            columns.ConstantColumn(80);
                        });

                        table.Header(header =>
                        {
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(6)
                                .Text("S.N.").SemiBold();
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(6)
                                .Text("Part").SemiBold();
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(6)
                                .AlignRight().Text("Qty").SemiBold();
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(6)
                                .AlignRight().Text("Rate").SemiBold();
                            header.Cell().Background(Colors.Grey.Lighten3).Padding(6)
                                .AlignRight().Text("Total").SemiBold();
                        });

                        var index = 1;
                        foreach (var item in sale.SaleItems)
                        {
                            var unitPrice = item.Price > 0 ? item.Price : item.Part.Price;
                            var lineTotal = unitPrice * item.Quantity;

                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2)
                                .Padding(6).Text(index.ToString());
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2)
                                .Padding(6).Text(item.Part.Name);
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2)
                                .Padding(6).AlignRight().Text(item.Quantity.ToString());
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2)
                                .Padding(6).AlignRight().Text(FormatMoney(unitPrice));
                            table.Cell().BorderBottom(1).BorderColor(Colors.Grey.Lighten2)
                                .Padding(6).AlignRight().Text(FormatMoney(lineTotal));
                            index++;
                        }
                    });

                    column.Item().AlignRight().Width(220).Column(totals =>
                    {
                        totals.Item().Row(r =>
                        {
                            r.RelativeItem().Text("Subtotal (excl. VAT):");
                            r.ConstantItem(90).AlignRight().Text(FormatMoney(subtotal));
                        });
                        totals.Item().Row(r =>
                        {
                            r.RelativeItem().Text("VAT (13% incl.):");
                            r.ConstantItem(90).AlignRight().Text(FormatMoney(vatAmount));
                        });
                        totals.Item().Row(r =>
                        {
                            r.RelativeItem().Text("Gross total:");
                            r.ConstantItem(90).AlignRight().Text(FormatMoney(sale.TotalAmount));
                        });
                        if (sale.Discount > 0)
                        {
                            totals.Item().Row(r =>
                            {
                                r.RelativeItem().Text("Discount (10%):").FontColor(Colors.Green.Darken2);
                                r.ConstantItem(90).AlignRight()
                                    .Text($"-{FormatMoney(sale.Discount)}")
                                    .FontColor(Colors.Green.Darken2);
                            });
                        }
                        totals.Item().Row(r =>
                        {
                            r.RelativeItem().Text("Paid amount:");
                            r.ConstantItem(90).AlignRight().Text(FormatMoney(paidAmount));
                        });
                        totals.Item().Row(r =>
                        {
                            r.RelativeItem().Text("Pending credit:");
                            r.ConstantItem(90).AlignRight().Text(FormatMoney(pendingAmount));
                        });
                        totals.Item().PaddingTop(4).Row(r =>
                        {
                            r.RelativeItem().Text("Final amount:").Bold();
                            r.ConstantItem(90).AlignRight().Text(FormatMoney(sale.FinalAmount)).Bold();
                        });
                        if (!string.IsNullOrWhiteSpace(paymentReferenceId))
                        {
                            totals.Item().PaddingTop(8).Text($"Payment ref: {paymentReferenceId}")
                                .FontSize(9).FontColor(Colors.Grey.Darken2);
                        }
                    });

                    column.Item().PaddingTop(16).Text(
                        "Returns allowed within 7 days of invoice date. Computer generated receipt."
                    ).FontSize(8).FontColor(Colors.Grey.Darken1);
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

    private static string FormatMoney(decimal amount) =>
        $"Rs {amount.ToString("N2", CultureInfo.InvariantCulture)}";
}
