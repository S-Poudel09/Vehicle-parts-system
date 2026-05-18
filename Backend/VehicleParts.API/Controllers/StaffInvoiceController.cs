using System.Text;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleParts.Application.Interfaces;
using VehicleParts.Domain.Entities;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/staff/sales")]
[Authorize(Roles = "Admin,Staff")]
public class StaffInvoiceController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IEmailService _emailService;

    public StaffInvoiceController(AppDbContext context, IEmailService emailService)
    {
        _context = context;
        _emailService = emailService;
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

        var subject = $"Vehicle Parts Invoice #{sale.Id}";
        var body = BuildInvoiceEmailBody(sale);

        try
        {
            await _emailService.SendEmailAsync(
                sale.Customer.User.Email,
                subject,
                body
            );

            return Ok(new
            {
                message = "Invoice email sent successfully.",
                saleId = sale.Id,
                customerName = sale.Customer.User.Name,
                customerEmail = sale.Customer.User.Email
            });
        }
        catch (Exception ex)
        {
            return StatusCode(500, new
            {
                message = "Invoice email could not be sent.",
                error = ex.Message
            });
        }
    }

    private static string BuildInvoiceEmailBody(Sale sale)
    {
        var itemRows = new StringBuilder();

        foreach (var item in sale.SaleItems)
        {
            var unitPrice = item.Price > 0 ? item.Price : item.Part.Price;
            var lineTotal = unitPrice * item.Quantity;

            itemRows.Append($@"
                <tr>
                    <td>{item.Part.Name}</td>
                    <td>{item.Quantity}</td>
                    <td>Rs. {unitPrice}</td>
                    <td>Rs. {lineTotal}</td>
                </tr>");
        }

        return $@"
            <html>
            <body style='font-family: Arial, sans-serif; color: #222;'>
                <h2>Vehicle Parts System</h2>
                <h3>Sales Invoice #{sale.Id}</h3>

                <p>Dear {sale.Customer.User.Name},</p>
                <p>Thank you for your purchase. Please find your invoice details below.</p>

                <p><strong>Sale Date:</strong> {sale.SaleDate:yyyy-MM-dd}</p>
                <p><strong>Payment Status:</strong> {sale.PaymentStatus}</p>

                <table border='1' cellpadding='8' cellspacing='0' style='border-collapse: collapse; width: 100%;'>
                    <thead>
                        <tr style='background-color: #1f2937; color: white;'>
                            <th>Part Name</th>
                            <th>Quantity</th>
                            <th>Price</th>
                            <th>Line Total</th>
                        </tr>
                    </thead>
                    <tbody>
                        {itemRows}
                    </tbody>
                </table>

                <br />

                <p><strong>Total Amount:</strong> Rs. {sale.TotalAmount}</p>
                <p><strong>Discount:</strong> Rs. {sale.Discount}</p>
                <p><strong>Final Amount:</strong> Rs. {sale.FinalAmount}</p>

                <p>Regards,<br/>Vehicle Parts System</p>
            </body>
            </html>";
    }
}