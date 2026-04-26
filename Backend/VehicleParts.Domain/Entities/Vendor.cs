using System.ComponentModel.DataAnnotations;

namespace VehicleParts.Domain.Entities
{
    public class Vendor
    {
        [Key]
        public int Id { get; set; }

        public string Name { get; set; }
        public string Phone { get; set; }
        public string Address { get; set; }

        public ICollection<Part> Parts { get; set; }
        public ICollection<Purchase> Purchases { get; set; }
    }
}