using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VehicleParts.Domain.Entities
{
    public class Customer
    {
        [Key]
        public int Id { get; set; }

        public int UserId { get; set; }

        [ForeignKey("UserId")]
        public User User { get; set; }

        public string Phone { get; set; }
        public string Address { get; set; }

        public ICollection<Vehicle> Vehicles { get; set; }
        public ICollection<Sale> Sales { get; set; }
        public ICollection<Appointment> Appointments { get; set; }
        public ICollection<Review> Reviews { get; set; }
        public ICollection<PartRequest> PartRequests { get; set; }
    }
}