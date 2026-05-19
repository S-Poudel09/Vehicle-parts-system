using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VehicleParts.Domain.Entities
{
    public class Vehicle
    {
        [Key]
        public int Id { get; set; }

        public int CustomerId { get; set; }

        [ForeignKey("CustomerId")]
        public Customer Customer { get; set; }

        public string VehicleNumber { get; set; }
        public string Model { get; set; }
        public string Brand { get; set; }
        public int? Year { get; set; }

        public int? Odometer { get; set; }
        public string? PrimaryDrivingEnvironment { get; set; }
        public string? EngineType { get; set; }
        public string? VehicleType { get; set; }

        public ICollection<Appointment> Appointments { get; set; }
    }
}