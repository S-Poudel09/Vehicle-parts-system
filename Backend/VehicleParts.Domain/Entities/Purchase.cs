using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VehicleParts.Domain.Entities
{
    public class Purchase
    {
        [Key]
        public int Id { get; set; }

        public int VendorId { get; set; }

        [ForeignKey("VendorId")]
        public Vendor Vendor { get; set; }

        public decimal TotalAmount { get; set; }

        public DateTime PurchaseDate { get; set; }

        public ICollection<PurchaseItem> PurchaseItems { get; set; }
    }
}