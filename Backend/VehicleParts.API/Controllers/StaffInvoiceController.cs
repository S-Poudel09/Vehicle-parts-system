using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleParts.Application.DTOs;
using VehicleParts.Application.Interfaces;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/staff/sales")]
[Authorize(Roles = "Admin,Staff")]
public class StaffInvoiceController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IEmailService _emailService;
    private readonly IInvoicePdfGenerator _invoicePdfGenerator;

    public StaffInvoiceController(
        AppDbContext context,
        IEmailService emailService,
        IInvoicePdfGenerator invoicePdfGenerator)
    {
        _context = context;
        _emailService = emailService;
        _invoicePdfGenerator = invoicePdfGenerator;
    }

    [HttpPost("{saleId:int}/send-invoice")]
    public async Task<IActionResult> SendInvoiceEmail(int saleId)
    {
        var sale = await _context.Sales
            .Include(s => s.Customer)
                .ThenInclude(c => c.User)
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Part)
            .FirstOrDefaultAsync(s => s.Id == saleId);

        if (sale == null)
        {
            return NotFound(new { message = "Sale invoice not found." });
        }

        if (sale.Customer?.User == null || string.IsNullOrWhiteSpace(sale.Customer.User.Email))
        {
            return BadRequest(new { message = "Customer email address is missing." });
        }

        var invoiceNumber = $"GP-SAL-2026-{sale.Id}";
        var subject = $"GadiParts Sales Invoice {invoiceNumber}";
        var body = BuildInvoiceEmailBody(sale.Customer.User.Name, invoiceNumber, sale.SaleDate);

        try
        {
            var pdfBytes = _invoicePdfGenerator.GenerateSaleInvoicePdf(sale);

            await _emailService.SendEmailAsync(
                sale.Customer.User.Email,
                subject,
                body,
                new List<EmailAttachmentDto>
                {
                    new()
                    {
                        FileName = $"{invoiceNumber}.pdf",
                        Content = pdfBytes,
                        ContentType = "application/pdf"
                    }
                }
            );

            return Ok(new
            {
                message = "Invoice PDF emailed successfully.",
                saleId = sale.Id,
                customerName = sale.Customer.User.Name,
                customerEmail = sale.Customer.User.Email
            });
        }
        catch (InvalidOperationException ex)
        {
            return StatusCode(500, new { message = ex.Message });
        }
        catch
        {
            return StatusCode(500, new
            {
                message = "Invoice email could not be sent. Please check email settings."
            });
        }
    }

    private static string BuildInvoiceEmailBody(
        string customerName,
        string invoiceNumber,
        DateTime saleDate)
    {
        return $@"
            <html>
            <body style='font-family: Arial, sans-serif; color: #222; line-height: 1.5;'>
                <p>Dear {System.Net.WebUtility.HtmlEncode(customerName)},</p>
                <p>Thank you for your purchase at GadiParts.</p>
                <p>Your sales invoice <strong>{System.Net.WebUtility.HtmlEncode(invoiceNumber)}</strong>
                   dated <strong>{saleDate:dd MMM yyyy}</strong> is attached as a PDF.</p>
                <p>Please open the attachment to view the full invoice with item details and totals.</p>
                <p>Regards,<br/>GadiParts Vehicle Services</p>
            </body>
            </html>";
    }
}
