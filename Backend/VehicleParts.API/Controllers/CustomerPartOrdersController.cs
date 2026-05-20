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
[Route("api/customer/part-orders")]
[Authorize(Roles = "Customer")]
public class CustomerPartOrdersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAdminNotificationService _adminNotifications;
    private readonly IInvoicePdfGenerator _invoicePdfGenerator;
    private readonly IEmailService _emailService;

    public CustomerPartOrdersController(
        AppDbContext context,
        IAdminNotificationService adminNotifications,
        IInvoicePdfGenerator invoicePdfGenerator,
        IEmailService emailService)
    {
        _context = context;
        _adminNotifications = adminNotifications;
        _invoicePdfGenerator = invoicePdfGenerator;
        _emailService = emailService;
    }

    [HttpGet]
    public async Task<IActionResult> GetMyOrders()
    {
        var customerId = await GetCustomerIdAsync();
        if (customerId == null)
            return NotFound(new { message = "Customer profile not found." });

        var orders = await _context.CustomerPartOrders
            .Include(o => o.Part)
            .Where(o => o.CustomerId == customerId)
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
                CreatedAt = o.CreatedAt
            })
            .ToListAsync();

        return Ok(orders);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetOrder(int id)
    {
        var customerId = await GetCustomerIdAsync();
        if (customerId == null)
            return NotFound(new { message = "Customer profile not found." });

        var order = await LoadOrderAsync(id, customerId.Value);
        if (order == null)
            return NotFound(new { message = "Order not found." });

        return Ok(MapDetail(order));
    }

    [HttpPost]
    public async Task<IActionResult> CreateOrder([FromBody] CreatePartOrderDto dto)
    {
        if (dto.Quantity <= 0)
            return BadRequest(new { message = "Quantity must be at least 1." });

        var customerId = await GetCustomerIdAsync();
        if (customerId == null)
            return NotFound(new { message = "Customer profile not found." });

        var customer = await _context.Customers
            .Include(c => c.User)
            .FirstOrDefaultAsync(c => c.Id == customerId);

        var part = await _context.Parts.FindAsync(dto.PartId);
        if (part == null)
            return NotFound(new { message = "Part not found." });

        if (part.Stock < dto.Quantity)
            return BadRequest(new { message = $"Only {part.Stock} unit(s) available for {part.Name}." });

        var totalAmount = part.Price * dto.Quantity;
        var discount = totalAmount > 5000 ? totalAmount * 0.10m : 0m;
        var finalAmount = totalAmount - discount;

        var order = new CustomerPartOrder
        {
            CustomerId = customerId.Value,
            PartId = part.Id,
            Quantity = dto.Quantity,
            UnitPrice = part.Price,
            TotalAmount = totalAmount,
            Discount = discount,
            FinalAmount = finalAmount,
            PendingAmount = finalAmount,
            Status = PartOrderStatus.PendingApproval,
            CreatedAt = DateTime.UtcNow
        };

        _context.CustomerPartOrders.Add(order);
        await _context.SaveChangesAsync();

        if (customer != null)
        {
            _context.Notifications.Add(new Notification
            {
                Type = NotificationType.Info,
                Message =
                    $"Your purchase request for '{part.Name}' (qty {dto.Quantity}) was submitted and is pending staff approval.",
                CreatedAt = DateTime.UtcNow,
                UserId = customer.UserId
            });

            _adminNotifications.AddPartOrderAlert(customer, part, dto.Quantity, order.Id);
            await _context.SaveChangesAsync();
        }

        var saved = await LoadOrderAsync(order.Id, customerId.Value);
        return Ok(MapDetail(saved!));
    }

    [HttpPost("{id:int}/submit-payment")]
    public async Task<IActionResult> SubmitPayment(int id, [FromBody] SubmitPartOrderPaymentDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.PaymentReferenceId))
            return BadRequest(new { message = "Payment reference ID is required." });

        if (dto.DeclaredAmount <= 0)
            return BadRequest(new { message = "Declared payment amount must be greater than zero." });

        var customerId = await GetCustomerIdAsync();
        if (customerId == null)
            return NotFound(new { message = "Customer profile not found." });

        var order = await _context.CustomerPartOrders
            .Include(o => o.Customer).ThenInclude(c => c.User)
            .FirstOrDefaultAsync(o => o.Id == id && o.CustomerId == customerId);

        if (order == null)
            return NotFound(new { message = "Order not found." });

        if (order.Status is not PartOrderStatus.AwaitingPayment
            and not PartOrderStatus.PartiallyPaid)
        {
            return BadRequest(new { message = "This order is not awaiting payment submission." });
        }

        order.PaymentReferenceId = dto.PaymentReferenceId.Trim();
        order.CustomerDeclaredAmount = dto.DeclaredAmount;
        order.PaymentSubmittedAt = DateTime.UtcNow;
        order.Status = PartOrderStatus.PaymentVerificationPending;

        _context.Notifications.Add(new Notification
        {
            Type = NotificationType.Info,
            Message =
                $"Payment submitted for order #{order.Id}. Reference: {order.PaymentReferenceId}. Awaiting staff verification.",
            CreatedAt = DateTime.UtcNow,
            UserId = order.Customer.UserId
        });

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Payment details submitted. Staff will verify your payment shortly.",
            orderId = order.Id,
            status = order.Status.ToString()
        });
    }

    [HttpGet("{id:int}/invoice-pdf")]
    public async Task<IActionResult> DownloadInvoice(int id)
    {
        var customerId = await GetCustomerIdAsync();
        if (customerId == null)
            return NotFound(new { message = "Customer profile not found." });

        var order = await _context.CustomerPartOrders
            .Include(o => o.Sale!)
                .ThenInclude(s => s.Customer).ThenInclude(c => c.User)
            .Include(o => o.Sale!).ThenInclude(s => s.SaleItems).ThenInclude(si => si.Part)
            .Include(o => o.Sale!).ThenInclude(s => s.Staff)
            .FirstOrDefaultAsync(o => o.Id == id && o.CustomerId == customerId);

        if (order?.Sale == null)
            return BadRequest(new { message = "Invoice is not available until payment is verified." });

        var pdf = _invoicePdfGenerator.GenerateSaleInvoicePdf(order.Sale, order.PaidAmount, order.PaymentReferenceId);
        var fileName = $"{order.InvoiceNumber ?? $"GP-SAL-2026-{order.SaleId}"}.pdf";
        return File(pdf, "application/pdf", fileName);
    }

    private async Task<int?> GetCustomerIdAsync()
    {
        var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userId))
            return null;

        var customer = await _context.Customers
            .FirstOrDefaultAsync(c => c.UserId == int.Parse(userId));

        return customer?.Id;
    }

    private async Task<CustomerPartOrder?> LoadOrderAsync(int id, int customerId) =>
        await _context.CustomerPartOrders
            .Include(o => o.Part)
            .Include(o => o.HandledByStaff)
            .Include(o => o.PaymentLogs).ThenInclude(l => l.Staff)
            .FirstOrDefaultAsync(o => o.Id == id && o.CustomerId == customerId);

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
