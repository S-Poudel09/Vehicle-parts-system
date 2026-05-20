using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using Microsoft.Extensions.Options;
using VehicleParts.Application.DTOs;
using VehicleParts.Application.Interfaces;

namespace VehicleParts.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task SendEmailAsync(
        string toEmail,
        string subject,
        string body,
        IReadOnlyList<EmailAttachmentDto>? attachments = null)
    {
        if (string.IsNullOrWhiteSpace(_settings.SmtpHost))
        {
            throw new InvalidOperationException(
                "Email is not configured. Set EmailSettings in appsettings (SmtpHost, SenderEmail, SenderPassword)."
            );
        }

        if (string.IsNullOrWhiteSpace(_settings.SenderEmail))
        {
            throw new InvalidOperationException(
                "Email sender address is not configured. Set EmailSettings:SenderEmail."
            );
        }

        using var message = new MailMessage();

        message.From = new MailAddress(_settings.SenderEmail, _settings.SenderName);
        message.To.Add(toEmail);
        message.Subject = subject;
        message.Body = body;
        message.IsBodyHtml = true;

        if (attachments != null)
        {
            foreach (var file in attachments)
            {
                var stream = new MemoryStream(file.Content);
                var mailAttachment = new Attachment(stream, file.FileName, file.ContentType);
                mailAttachment.ContentDisposition!.DispositionType =
                    DispositionTypeNames.Attachment;
                message.Attachments.Add(mailAttachment);
            }
        }

        using var client = new SmtpClient(_settings.SmtpHost, _settings.SmtpPort)
        {
            EnableSsl = _settings.EnableSsl
        };

        if (!string.IsNullOrWhiteSpace(_settings.SenderPassword))
        {
            client.Credentials = new NetworkCredential(
                _settings.SenderEmail,
                _settings.SenderPassword
            );
        }

        await client.SendMailAsync(message);
    }
}
