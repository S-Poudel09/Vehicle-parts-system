using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VehicleParts.Domain.Enums;

namespace VehicleParts.Domain.Entities
{
    public class Notification
    {
        [Key]
        public int Id { get; set; }

        public NotificationType Type { get; set; }

        public string Message { get; set; } = string.Empty;

        public DateTime CreatedAt { get; set; }

        public int? UserId { get; set; }

        [ForeignKey("UserId")]
        public User? User { get; set; }
    }
}