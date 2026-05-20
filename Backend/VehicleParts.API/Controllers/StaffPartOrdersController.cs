using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleParts.Application.DTOs;
using VehicleParts.Application.Interfaces;
using VehicleParts.Domain.Entities;
using VehicleParts.Domain.Enums;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/staff/part-orders")]
[Authorize(Roles = "Admin,Staff")]
public class StaffPartOrdersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IInvoicePdfGenerator _invoicePdfGenerator;
    private readonly IEmailService _emailService;

    public StaffPartOrdersController(
        AppDbContext context,
        IInvoicePdfGenerator invoicePdfGenerator,
        IEmailService emailService)
    {
        _context = context;
        _invoicePdfGenerator = invoicePdfGenerator;
        _emailService = emailService;
    }

    [HttpGet]
    public async Task<IActionResult> GetOrders([FromQuery] string? status)
    {
        var query = _context.CustomerPartOrders
            .Include(o => o.Part)
            .Include(o => o.Customer).ThenInclude(c => c.User)
            .Include(o => o.HandledByStaff)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(status) &&
            Enum.TryParse<PartOrderStatus>(status, true, out var parsed))
        {
            query = query.Where(o => o.Status == parsed);
        }

        var orders = await query
            .OrderByDescending(o => o.CreatedAt)
            .Select(o => new PartOrderListItemDto
            {
                Id = o.Id,
                PartId = o.PartId,
                PartName = o.Part.Name,
                Quantity = o.Quantity,
                UnitPrice = o.UnitPrice,
                FinalAmount = o.FinalAmount,
                PaidAmount = o.PaidAmount,
                PendingAmount = o.PendingAmount,
                Status = o.Status.ToString(),
                PaymentReferenceId = o.PaymentReferenceId,
                InvoiceNumber = o.InvoiceNumber,
                SaleId = o.SaleId,
                CreatedAt = o.CreatedAt,
                CustomerName = o.Customer.User.Name,
                CustomerEmail = o.Customer.User.Email,
                CustomerPhone = o.Customer.Phone,
                StaffName = o.HandledByStaff != null ? o.HandledByStaff.Name : null
            })
            .ToListAsync();

        return Ok(orders);
    }

    [HttpGet("reports")]
    public async Task<IActionResult> GetReports([FromQuery] DateTime? from, [FromQuery] DateTime? to)
    {
        var query = _context.CustomerPartOrders
            .Include(o => o.Customer).ThenInclude(c => c.User)
            .Include(o => o.Part)
            .AsQueryable();

        if (from.HasValue)
            query = query.Where(o => o.CreatedAt >= from.Value.ToUniversalTime());
        if (to.HasValue)
            query = query.Where(o => o.CreatedAt <= to.Value.ToUniversalTime());

        var orders = await query.OrderByDescending(o => o.CreatedAt).ToListAsync();

        return Ok(new
        {
            totalOrders = orders.Count,
            pendingApproval = orders.Count(o => o.Status == PartOrderStatus.PendingApproval),
            awaitingPayment = orders.Count(o =>
                o.Status is PartOrderStatus.AwaitingPayment or PartOrderStatus.PartiallyPaid),
            paymentVerificationPending = orders.Count(o =>
                o.Status == PartOrderStatus.PaymentVerificationPending),
            pendingCreditTotal = orders.Sum(o => o.PendingAmount),
            paidTotal = orders.Sum(o => o.PaidAmount),
            orders = orders.Select(o => new PartOrderListItemDto
            {
                Id = o.Id,
                PartName = o.Part.Name,
                Quantity = o.Quantity,
                FinalAmount = o.FinalAmount,
                PaidAmount = o.PaidAmount,
                PendingAmount = o.PendingAmount,
                Status = o.Status.ToString(),
                CustomerName = o.Customer.User.Name,
                CreatedAt = o.CreatedAt,
                InvoiceNumber = o.InvoiceNumber
            })
        });
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOrder(int id)
    {
        var order = await LoadOrderAsync(id);
        if (order == null)
            return NotFound(new { message = "Order not found." });

        return Ok(MapDetail(order));
    }

    [HttpPatch("{id:int}/approve")]
    public async Task<IActionResult> Approve(int id, [FromBody] UpdatePartOrderStatusDto? dto)
    {
        var order = await LoadOrderForUpdateAsync(id);
        if (order == null)
            return NotFound(new { message = "Order not found." });

        if (order.Status != PartOrderStatus.PendingApproval)
            return BadRequest(new { message = "Only pending orders can be approved." });

        var part = await _context.Parts.FindAsync(order.PartId);
        if (part == null)
            return NotFound(new { message = "Part not found." });

        if (part.Stock < order.Quantity)
            return BadRequest(new { message = $"Insufficient stock. Only {part.Stock} available." });

        var staffId = GetStaffId();
        part.Stock -= order.Quantity;
        order.HandledByStaffId = staffId;
        order.ApprovedAt = DateTime.UtcNow;
        order.Status = PartOrderStatus.AwaitingPayment;
        order.StaffNotes = dto?.StaffNotes ?? order.StaffNotes;

        NotifyCustomer(order,
            $"Your purchase request for '{part.Name}' was approved. Total due: Rs {order.FinalAmount:N2}. Please complete payment.");

        await _context.SaveChangesAsync();
        return Ok(new { message = "Order approved. Customer can now pay.", status = order.Status.ToString() });
    }

    [HttpPatch("{id:int}/reject")]
    public async Task<IActionResult> Reject(int id, [FromBody] UpdatePartOrderStatusDto? dto)
    {
        var order = await LoadOrderForUpdateAsync(id);
        if (order == null)
            return NotFound(new { message = "Order not found." });

        if (order.Status != PartOrderStatus.PendingApproval)
            return BadRequest(new { message = "Only pending orders can be rejected." });

        order.Status = PartOrderStatus.Rejected;
        order.HandledByStaffId = GetStaffId();
        order.StaffNotes = dto?.StaffNotes ?? order.StaffNotes;

        NotifyCustomer(order,
            $"Your purchase request for order #{order.Id} was rejected. Contact the workshop for details.");

        await _context.SaveChangesAsync();
        return Ok(new { message = "Order rejected.", status = order.Status.ToString() });
    }

    [HttpPatch("{id:int}/verify-payment")]
    public async Task<IActionResult> VerifyPayment(int id, [FromBody] VerifyPartOrderPaymentDto dto)
    {
        if (dto.PaidAmount < 0)
            return BadRequest(new { message = "Paid amount cannot be negative." });

        var order = await LoadOrderForUpdateAsync(id);
        if (order == null)
            return NotFound(new { message = "Order not found." });

        if (order.Status != PartOrderStatus.PaymentVerificationPending)
            return BadRequest(new { message = "No payment is awaiting verification for this order." });

        var staffId = GetStaffId();
        var previousPaid = order.PaidAmount;
        order.PaidAmount = dto.PaidAmount;
        order.PendingAmount = Math.Max(0, order.FinalAmount - order.PaidAmount);
        order.PaymentReferenceId = dto.PaymentReferenceId?.Trim() ?? order.PaymentReferenceId;
        order.VerifiedAt = DateTime.UtcNow;
        order.HandledByStaffId = staffId;

        var amountThisVerification = order.PaidAmount - previousPaid;
        _context.PartOrderPaymentLogs.Add(new PartOrderPaymentLog
        {
            PartOrderId = order.Id,
            StaffId = staffId,
            AmountVerified = amountThisVerification,
            TotalPaidAfter = order.PaidAmount,
            PendingAfter = order.PendingAmount,
            PaymentReferenceId = order.PaymentReferenceId,
            Notes = dto.Notes,
            VerifiedAt = DateTime.UtcNow
        });

        if (order.PaidAmount >= order.FinalAmount)
        {
            order.Status = PartOrderStatus.Paid;
            order.PendingAmount = 0;
        }
        else if (order.PaidAmount > 0)
        {
            order.Status = PartOrderStatus.PartiallyPaid;
        }
        else
        {
            order.Status = PartOrderStatus.AwaitingPayment;
        }

        await EnsureSaleAndInvoiceAsync(order, staffId, amountThisVerification);

        if (order.Status == PartOrderStatus.Paid)
            order.Status = PartOrderStatus.ReadyForPickup;

        NotifyCustomer(order,
            order.PendingAmount > 0
                ? $"Payment verified for order #{order.Id}. Paid Rs {order.PaidAmount:N2}, pending Rs {order.PendingAmount:N2}. Invoice emailed."
                : $"Payment verified for order #{order.Id}. Paid in full. Your part is ready for pickup. Invoice emailed.");

        await _context.SaveChangesAsync();

        var refreshed = await LoadOrderAsync(id);
        return Ok(new
        {
            message = "Payment verified.",
            order = MapDetail(refreshed!)
        });
    }

    [HttpPatch("{id:int}/complete")]
    public async Task<IActionResult> Complete(int id)
    {
        var order = await LoadOrderForUpdateAsync(id);
        if (order == null)
            return NotFound(new { message = "Order not found." });

        if (order.Status is not PartOrderStatus.ReadyForPickup
            and not PartOrderStatus.Paid
            and not PartOrderStatus.PartiallyPaid)
        {
            return BadRequest(new { message = "Order cannot be marked completed in its current status." });
        }

        order.Status = PartOrderStatus.Completed;
        order.CompletedAt = DateTime.UtcNow;

        NotifyCustomer(order, $"Order #{order.Id} is completed. Thank you for shopping with GadiParts.");

        await _context.SaveChangesAsync();
        return Ok(new { message = "Order marked as completed." });
    }

    [HttpPost("{id:int}/send-invoice")]
    public async Task<IActionResult> ResendInvoice(int id)
    {
        var order = await LoadOrderAsync(id);
        if (order?.Sale == null)
            return BadRequest(new { message = "Invoice not generated yet." });

        await SendInvoiceEmailAsync(order);
        return Ok(new { message = "Invoice emailed to customer." });
    }

    private async Task EnsureSaleAndInvoiceAsync(
        CustomerPartOrder order,
        int staffId,
        decimal paymentDelta)
    {
        Sale? sale = order.Sale;

        if (sale == null)
        {
            sale = new Sale
            {
                CustomerId = order.CustomerId,
                StaffId = staffId,
                TotalAmount = order.TotalAmount,
                Discount = order.Discount,
                FinalAmount = order.FinalAmount,
                SaleDate = DateTime.UtcNow,
                PaymentStatus = order.PaidAmount >= order.FinalAmount
                    ? PaymentStatus.Paid
                    : PaymentStatus.Pending,
                SaleItems = new List<SaleItem>
                {
                    new()
                    {
                        PartId = order.PartId,
                        Quantity = order.Quantity,
                        Price = order.UnitPrice
                    }
                }
            };
            _context.Sales.Add(sale);
            await _context.SaveChangesAsync();

            order.SaleId = sale.Id;
            order.InvoiceNumber = $"GP-SAL-2026-{sale.Id}";
        }
        else
        {
            sale.PaymentStatus = order.PaidAmount >= order.FinalAmount
                ? PaymentStatus.Paid
                : PaymentStatus.Pending;
            sale.StaffId = staffId;
        }

        if (paymentDelta > 0)
        {
            _context.Payments.Add(new Payment
            {
                SaleId = sale.Id,
                Amount = paymentDelta,
                PaymentDate = DateTime.UtcNow,
                Method = "Khalti QR"
            });
        }

        await _context.SaveChangesAsync();

        sale = await _context.Sales
            .Include(s => s.Customer).ThenInclude(c => c.User)
            .Include(s => s.SaleItems).ThenInclude(si => si.Part)
            .Include(s => s.Staff)
            .FirstAsync(s => s.Id == sale.Id);

        order.Sale = sale;
        await SendInvoiceEmailAsync(order);
    }

    private async Task SendInvoiceEmailAsync(CustomerPartOrder order)
    {
        if (order.Sale?.Customer?.User?.Email == null)
            return;

        var sale = order.Sale;
        var invoiceNumber = order.InvoiceNumber ?? $"GP-SAL-2026-{sale.Id}";
        var pdf = _invoicePdfGenerator.GenerateSaleInvoicePdf(
            sale, order.PaidAmount, order.PaymentReferenceId);

        await _emailService.SendEmailAsync(
            sale.Customer.User.Email,
            $"GadiParts Sales Invoice {invoiceNumber}",
            $"""
                <p>Dear {System.Net.WebUtility.HtmlEncode(sale.Customer.User.Name)},</p>
                <p>Thank you for your purchase. Invoice <strong>{invoiceNumber}</strong> is attached.</p>
                <p>Paid: Rs {order.PaidAmount:N2} | Pending: Rs {order.PendingAmount:N2}</p>
                <p>Regards,<br/>GadiParts</p>
                """,
            new List<EmailAttachmentDto>
            {
                new()
                {
                    FileName = $"{invoiceNumber}.pdf",
                    Content = pdf,
                    ContentType = "application/pdf"
                }
            });
    }

    private int GetStaffId()
    {
        var claim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        return int.Parse(claim!);
    }

    private void NotifyCustomer(CustomerPartOrder order, string message)
    {
        if (order.Customer?.User == null)
            return;

        _context.Notifications.Add(new Notification
        {
            Type = NotificationType.Info,
            Message = message,
            CreatedAt = DateTime.UtcNow,
            UserId = order.Customer.UserId
        });
    }

    private async Task<CustomerPartOrder?> LoadOrderAsync(int id) =>
        await _context.CustomerPartOrders
            .Include(o => o.Part)
            .Include(o => o.Customer).ThenInclude(c => c.User)
            .Include(o => o.HandledByStaff)
            .Include(o => o.Sale!).ThenInclude(s => s.Customer).ThenInclude(c => c.User)
            .Include(o => o.Sale!).ThenInclude(s => s.SaleItems).ThenInclude(si => si.Part)
            .Include(o => o.Sale!).ThenInclude(s => s.Staff)
            .Include(o => o.PaymentLogs).ThenInclude(l => l.Staff)
            .FirstOrDefaultAsync(o => o.Id == id);

    private async Task<CustomerPartOrder?> LoadOrderForUpdateAsync(int id) =>
        await _context.CustomerPartOrders
            .Include(o => o.Part)
            .Include(o => o.Customer).ThenInclude(c => c.User)
            .Include(o => o.Sale)
            .FirstOrDefaultAsync(o => o.Id == id);

    private static PartOrderDetailDto MapDetail(CustomerPartOrder o) =>
        new()
        {
            Id = o.Id,
            PartId = o.PartId,
            PartName = o.Part.Name,
            PartImageUrl = o.Part.ImageUrl,
            Quantity = o.Quantity,
            UnitPrice = o.UnitPrice,
            TotalAmount = o.TotalAmount,
            Discount = o.Discount,
            FinalAmount = o.FinalAmount,
            PaidAmount = o.PaidAmount,
            PendingAmount = o.PendingAmount,
            CustomerDeclaredAmount = o.CustomerDeclaredAmount,
            Status = o.Status.ToString(),
            PaymentReferenceId = o.PaymentReferenceId,
            InvoiceNumber = o.InvoiceNumber,
            SaleId = o.SaleId,
            StaffNotes = o.StaffNotes,
            StaffName = o.HandledByStaff?.Name,
            CustomerName = o.Customer.User.Name,
            CustomerEmail = o.Customer.User.Email,
            CustomerPhone = o.Customer.Phone,
            CreatedAt = o.CreatedAt,
            ApprovedAt = o.ApprovedAt,
            PaymentSubmittedAt = o.PaymentSubmittedAt,
            VerifiedAt = o.VerifiedAt,
            CompletedAt = o.CompletedAt,
            PaymentLogs = o.PaymentLogs
                .OrderByDescending(l => l.VerifiedAt)
                .Select(l => new PartOrderPaymentLogDto
                {
                    Id = l.Id,
                    StaffName = l.Staff.Name,
                    AmountVerified = l.AmountVerified,
                    TotalPaidAfter = l.TotalPaidAfter,
                    PendingAfter = l.PendingAfter,
                    PaymentReferenceId = l.PaymentReferenceId,
                    Notes = l.Notes,
                    VerifiedAt = l.VerifiedAt
                })
                .ToList()
        };
}
