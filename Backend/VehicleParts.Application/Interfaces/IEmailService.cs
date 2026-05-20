using VehicleParts.Application.DTOs;

namespace VehicleParts.Application.Interfaces;

public interface IEmailService
{
    Task SendEmailAsync(
        string toEmail,
        string subject,
        string body,
        IReadOnlyList<EmailAttachmentDto>? attachments = null);
}
