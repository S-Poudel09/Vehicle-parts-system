using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VehicleParts.Domain.Entities
{
    public class SaleItem
    {
        [Key]
        public int Id { get; set; }

        public int SaleId { get; set; }

        [ForeignKey("SaleId")]
        public Sale Sale { get; set; }

        public int PartId { get; set; }

        [ForeignKey("PartId")]
        public Part Part { get; set; }

        public int Quantity { get; set; }
        public decimal Price { get; set; }
    }
}