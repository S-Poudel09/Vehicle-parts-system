using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace VehicleParts.Domain.Entities
{
	public class User
	{
		[Key]
		public int Id { get; set; }

		[Required]
		public string Name { get; set; }

		[Required]
		public string Email { get; set; }

		[Required]
		public string Password { get; set; }

		public DateTime CreatedAt { get; set; }

		public bool EmailVerified { get; set; }

		public string? EmailVerificationToken { get; set; }

		public DateTime? EmailVerificationTokenExpiresAt { get; set; }

		public int RoleId { get; set; }

		[ForeignKey("RoleId")]
		public Role Role { get; set; }

		public Customer Customer { get; set; }
	}
}