using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using VehicleParts.Application.Interfaces;

namespace VehicleParts.Infrastructure.Services;

public class EmailService : IEmailService
{
    private readonly EmailSettings _settings;

    public EmailService(IOptions<EmailSettings> settings)
    {
        _settings = settings.Value;
    }

    public async Task SendEmailAsync(string toEmail, string subject, string body)
    {
        using var message = new MailMessage();

        message.From = new MailAddress(_settings.SenderEmail, _settings.SenderName);
        message.To.Add(toEmail);
        message.Subject = subject;
        message.Body = body;
        message.IsBodyHtml = true;

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