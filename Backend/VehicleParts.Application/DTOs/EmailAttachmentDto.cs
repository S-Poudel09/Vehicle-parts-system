namespace VehicleParts.Application.DTOs;

public class EmailAttachmentDto
{
    public string FileName { get; set; } = string.Empty;
    public byte[] Content { get; set; } = Array.Empty<byte>();
    public string ContentType { get; set; } = "application/pdf";
}
