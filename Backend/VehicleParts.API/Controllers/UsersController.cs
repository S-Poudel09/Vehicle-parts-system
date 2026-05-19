using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using VehicleParts.Application.DTOs.Auth;
using VehicleParts.Application.Interfaces;

namespace VehicleParts.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly IUserService _userService;

        public UsersController(IUserService userService)
        {
            _userService = userService;
        }

        [HttpGet]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> GetUsers()   // async add
        {
            var users = await _userService.GetAllUsersAsync(); // await + correct method
            return Ok(users);
        }

        [HttpPost("staff")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> CreateStaff(CreateStaffDto dto)
        {
            var success = await _userService.CreateStaffAsync(dto);

            if (!success)
                return BadRequest("User with this email already exists.");

            return Ok("Staff user created successfully.");
        }

        [HttpPatch("staff/{id:int}/deactivate")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeactivateStaff(int id)
        {
            var success = await _userService.DeactivateStaffAsync(id);
            if (!success)
                return BadRequest("Staff user not found.");

            return Ok("Staff user deactivated successfully.");
        }

        [HttpDelete("staff/{id:int}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteStaff(int id)
        {
            var success = await _userService.DeleteStaffAsync(id);
            if (!success)
                return BadRequest("Staff user cannot be deleted (not found or linked to sales).");

            return Ok("Staff user deleted successfully.");
        }
    }
}