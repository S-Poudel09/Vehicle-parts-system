using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using VehicleParts.Domain.Enums;

namespace VehicleParts.Domain.Entities
{
    public class Sale
    {
        [Key]
        public int Id { get; set; }

        public int CustomerId { get; set; }

        [ForeignKey("CustomerId")]
        public Customer Customer { get; set; }

        public int StaffId { get; set; }

        [ForeignKey("StaffId")]
        public User Staff { get; set; }

        public decimal TotalAmount { get; set; }
        public decimal Discount { get; set; }
        public decimal FinalAmount { get; set; }

        public DateTime SaleDate { get; set; }

        public PaymentStatus PaymentStatus { get; set; }

        public ICollection<SaleItem> SaleItems { get; set; }
        public ICollection<Payment> Payments { get; set; }
    }
}