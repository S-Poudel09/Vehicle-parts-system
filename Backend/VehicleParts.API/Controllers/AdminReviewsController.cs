using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/admin/reviews")]
[Authorize(Roles = "Admin")]
public class AdminReviewsController : ControllerBase
{
    private readonly AppDbContext _context;

    public AdminReviewsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var reviews = await _context.Reviews
            .Include(r => r.Customer)
                .ThenInclude(c => c.User)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                id = r.Id,
                customerId = r.CustomerId,
                customerName = r.Customer.User.Name,
                customerEmail = r.Customer.User.Email,
                rating = r.Rating,
                comment = r.Comment,
                createdAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(reviews);
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        var review = await _context.Reviews.FindAsync(id);
        if (review == null)
            return NotFound(new { message = "Review not found." });

        _context.Reviews.Remove(review);
        await _context.SaveChangesAsync();

        return NoContent();
    }
}
