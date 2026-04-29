using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
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
    }
}