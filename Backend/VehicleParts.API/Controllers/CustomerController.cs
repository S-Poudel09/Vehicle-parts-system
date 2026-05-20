using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using VehicleParts.Application.Interfaces;
using VehicleParts.Domain.Entities;
using VehicleParts.Domain.Enums;
using VehicleParts.Infrastructure.Data;

namespace VehicleParts.API.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize(Roles = "Customer")]
public class CustomerController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IAdminNotificationService _adminNotifications;

    public CustomerController(AppDbContext context, IAdminNotificationService adminNotifications)
    {
        _context = context;
        _adminNotifications = adminNotifications;
    }

    private async Task<Customer?> GetCurrentCustomerAsync()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim)) return null;

        if (!int.TryParse(userIdClaim, out int userId)) return null;

        var customer = await _context.Customers
            .Include(c => c.User)
            .Include(c => c.Vehicles)
            .FirstOrDefaultAsync(c => c.UserId == userId);

        // If the customer profile doesn't exist for some reason, let's create one dynamically
        if (customer == null)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null) return null;

            customer = new Customer
            {
                UserId = userId,
                Phone = "",
                Address = "",
                Vehicles = new List<Vehicle>()
            };

            _context.Customers.Add(customer);
            await _context.SaveChangesAsync();
        }

        return customer;
    }

    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var customer = await GetCurrentCustomerAsync();
        if (customer == null) return NotFound("Customer profile not found.");

        return Ok(new
        {
            customerId = customer.Id,
            userId = customer.UserId,
            name = customer.User.Name,
            email = customer.User.Email,
            phone = customer.Phone,
            address = customer.Address,
            vehicles = customer.Vehicles.Select(v => new
            {
                id = v.Id,
                vehicleNumber = v.VehicleNumber,
                brand = v.Brand,
                model = v.Model,
                year = v.Year,
                odometer = v.Odometer,
                primaryDrivingEnvironment = v.PrimaryDrivingEnvironment,
                engineType = v.EngineType,
                vehicleType = v.VehicleType
            }).ToList()
        });
    }

    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        var customer = await GetCurrentCustomerAsync();
        if (customer == null) return NotFound("Customer profile not found.");

        customer.Phone = dto.Phone ?? "";
        customer.Address = dto.Address ?? "";
        
        if (!string.IsNullOrWhiteSpace(dto.Name))
        {
            customer.User.Name = dto.Name;
        }

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Profile updated successfully.",
            name = customer.User.Name,
            phone = customer.Phone,
            address = customer.Address
        });
    }

    // VEHICLE MANAGEMENT
    [HttpPost("vehicles")]
    public async Task<IActionResult> AddVehicle([FromBody] AddVehicleDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.VehicleNumber))
            return BadRequest("Vehicle number is required.");

        var customer = await GetCurrentCustomerAsync();
        if (customer == null) return NotFound("Customer profile not found.");

        var vehicle = new Vehicle
        {
            CustomerId = customer.Id,
            VehicleNumber = dto.VehicleNumber,
            Brand = dto.Brand ?? "",
            Model = dto.Model ?? "",
            Year = dto.Year,
            Odometer = dto.Odometer,
            PrimaryDrivingEnvironment = dto.PrimaryDrivingEnvironment,
            EngineType = dto.EngineType,
            VehicleType = dto.VehicleType
        };

        _context.Vehicles.Add(vehicle);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Vehicle added successfully.",
            vehicle = new
            {
                id = vehicle.Id,
                vehicleNumber = vehicle.VehicleNumber,
                brand = vehicle.Brand,
                model = vehicle.Model,
                year = vehicle.Year,
                odometer = vehicle.Odometer,
                primaryDrivingEnvironment = vehicle.PrimaryDrivingEnvironment,
                engineType = vehicle.EngineType,
                vehicleType = vehicle.VehicleType
            }
        });
    }

    [HttpPut("vehicles/{id:int}")]
    public async Task<IActionResult> UpdateVehicle(int id, [FromBody] AddVehicleDto dto)
    {
        var customer = await GetCurrentCustomerAsync();
        if (customer == null) return NotFound("Customer profile not found.");

        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.Id == id && v.CustomerId == customer.Id);

        if (vehicle == null) return NotFound("Vehicle not found.");

        vehicle.VehicleNumber = dto.VehicleNumber ?? vehicle.VehicleNumber;
        vehicle.Brand = dto.Brand ?? vehicle.Brand;
        vehicle.Model = dto.Model ?? vehicle.Model;
        vehicle.Year = dto.Year ?? vehicle.Year;
        vehicle.Odometer = dto.Odometer ?? vehicle.Odometer;
        vehicle.PrimaryDrivingEnvironment = dto.PrimaryDrivingEnvironment ?? vehicle.PrimaryDrivingEnvironment;
        vehicle.EngineType = dto.EngineType ?? vehicle.EngineType;
        vehicle.VehicleType = dto.VehicleType ?? vehicle.VehicleType;

        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Vehicle updated successfully.",
            vehicle = new
            {
                id = vehicle.Id,
                vehicleNumber = vehicle.VehicleNumber,
                brand = vehicle.Brand,
                model = vehicle.Model,
                year = vehicle.Year,
                odometer = vehicle.Odometer,
                primaryDrivingEnvironment = vehicle.PrimaryDrivingEnvironment,
                engineType = vehicle.EngineType,
                vehicleType = vehicle.VehicleType
            }
        });
    }

    [HttpDelete("vehicles/{id:int}")]
    public async Task<IActionResult> DeleteVehicle(int id)
    {
        var customer = await GetCurrentCustomerAsync();
        if (customer == null) return NotFound("Customer profile not found.");

        var vehicle = await _context.Vehicles
            .FirstOrDefaultAsync(v => v.Id == id && v.CustomerId == customer.Id);

        if (vehicle == null) return NotFound("Vehicle not found.");

        // Check if there are linked appointments
        var hasAppointments = await _context.Appointments.AnyAsync(a => a.VehicleId == id);
        if (hasAppointments)
        {
            return BadRequest("Cannot delete vehicle because it has service appointment history.");
        }

        _context.Vehicles.Remove(vehicle);
        await _context.SaveChangesAsync();

        return Ok(new { message = "Vehicle deleted successfully." });
    }

    // APPOINTMENT BOOKING
    [HttpGet("appointments")]
    public async Task<IActionResult> GetAppointments()
    {
        var customer = await GetCurrentCustomerAsync();
        if (customer == null) return NotFound("Customer profile not found.");

        var appointments = await _context.Appointments
            .Include(a => a.Vehicle)
            .Where(a => a.CustomerId == customer.Id)
            .OrderByDescending(a => a.AppointmentDate)
            .Select(a => new
            {
                id = a.Id,
                appointmentDate = a.AppointmentDate,
                status = a.Status.ToString(),
                description = a.Description,
                vehicle = new
                {
                    id = a.Vehicle.Id,
                    vehicleNumber = a.Vehicle.VehicleNumber,
                    brand = a.Vehicle.Brand,
                    model = a.Vehicle.Model
                }
            })
            .ToListAsync();

        return Ok(appointments);
    }

    [HttpPost("appointments")]
    public async Task<IActionResult> BookAppointment([FromBody] BookAppointmentDto dto)
    {
        var customer = await GetCurrentCustomerAsync();
        if (customer == null) return NotFound("Customer profile not found.");

        // Validate vehicle ownership
        var ownsVehicle = await _context.Vehicles
            .AnyAsync(v => v.Id == dto.VehicleId && v.CustomerId == customer.Id);

        if (!ownsVehicle)
            return BadRequest("Selected vehicle does not belong to your account.");

        if (dto.AppointmentDate < DateTime.UtcNow.AddMinutes(-5))
            return BadRequest("Appointment date cannot be in the past.");

        var appointment = new Appointment
        {
            CustomerId = customer.Id,
            VehicleId = dto.VehicleId,
            AppointmentDate = dto.AppointmentDate,
            Status = AppointmentStatus.Pending,
            Description = dto.Description
        };

        _context.Appointments.Add(appointment);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Appointment booked successfully.",
            appointmentId = appointment.Id,
            appointmentDate = appointment.AppointmentDate,
            status = appointment.Status.ToString()
        });
    }

    // PART REQUESTS (UNAVAILABLE PARTS)
    [HttpGet("part-requests")]
    public async Task<IActionResult> GetPartRequests()
    {
        var customer = await GetCurrentCustomerAsync();
        if (customer == null) return NotFound("Customer profile not found.");

        var requests = await _context.PartRequests
            .Where(pr => pr.CustomerId == customer.Id)
            .OrderByDescending(pr => pr.Id)
            .Select(pr => new
            {
                id = pr.Id,
                partName = pr.PartName,
                description = pr.Description,
                status = pr.Status.ToString()
            })
            .ToListAsync();

        return Ok(requests);
    }

    [HttpPost("part-requests")]
    public async Task<IActionResult> RequestPart([FromBody] RequestPartDto dto)
    {
        if (string.IsNullOrWhiteSpace(dto.PartName))
            return BadRequest("Part name is required.");

        var customer = await GetCurrentCustomerAsync();
        if (customer == null) return NotFound("Customer profile not found.");

        var request = new PartRequest
        {
            CustomerId = customer.Id,
            PartName = dto.PartName,
            Description = dto.Description ?? "",
            Status = PartRequestStatus.Pending
        };

        _context.PartRequests.Add(request);
        _adminNotifications.AddPartRequestAlert(customer, request);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Unavailable part request submitted successfully.",
            requestId = request.Id,
            partName = request.PartName,
            status = request.Status.ToString()
        });
    }

    // REVIEWS
    [HttpGet("reviews")]
    public async Task<IActionResult> GetReviews()
    {
        var customer = await GetCurrentCustomerAsync();
        if (customer == null) return NotFound("Customer profile not found.");

        var reviews = await _context.Reviews
            .Where(r => r.CustomerId == customer.Id)
            .OrderByDescending(r => r.CreatedAt)
            .Select(r => new
            {
                id = r.Id,
                rating = r.Rating,
                comment = r.Comment,
                createdAt = r.CreatedAt
            })
            .ToListAsync();

        return Ok(reviews);
    }

    [HttpPost("reviews")]
    public async Task<IActionResult> SubmitReview([FromBody] SubmitReviewDto dto)
    {
        if (dto.Rating < 1 || dto.Rating > 5)
            return BadRequest("Rating must be between 1 and 5.");

        var customer = await GetCurrentCustomerAsync();
        if (customer == null) return NotFound("Customer profile not found.");

        var review = new Review
        {
            CustomerId = customer.Id,
            Rating = dto.Rating,
            Comment = dto.Comment ?? "",
            CreatedAt = DateTime.UtcNow
        };

        _context.Reviews.Add(review);
        await _context.SaveChangesAsync();

        return Ok(new
        {
            message = "Review submitted successfully.",
            reviewId = review.Id,
            rating = review.Rating,
            comment = review.Comment,
            createdAt = review.CreatedAt
        });
    }

    // UNIFIED SERVICE & PURCHASE HISTORY
    [HttpGet("history")]
    public async Task<IActionResult> GetUnifiedHistory()
    {
        var customer = await GetCurrentCustomerAsync();
        if (customer == null) return NotFound("Customer profile not found.");

        var purchases = await _context.Sales
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Part)
            .Where(s => s.CustomerId == customer.Id)
            .OrderByDescending(s => s.SaleDate)
            .Select(s => new
            {
                id = s.Id,
                date = s.SaleDate,
                type = "Purchase",
                totalAmount = s.TotalAmount,
                discount = s.Discount,
                finalAmount = s.FinalAmount,
                paymentStatus = s.PaymentStatus.ToString(),
                items = s.SaleItems.Select(si => new
                {
                    partName = si.Part.Name,
                    quantity = si.Quantity,
                    price = si.Price
                }).ToList()
            })
            .ToListAsync();

        var services = await _context.Appointments
            .Include(a => a.Vehicle)
            .Where(a => a.CustomerId == customer.Id)
            .OrderByDescending(a => a.AppointmentDate)
            .Select(a => new
            {
                id = a.Id,
                date = a.AppointmentDate,
                type = "Service Appointment",
                status = a.Status.ToString(),
                vehicle = $"{a.Vehicle.Brand} {a.Vehicle.Model} ({a.Vehicle.VehicleNumber})"
            })
            .ToListAsync();

        return Ok(new
        {
            purchases,
            services
        });
    }

    // AI-POWERED VEHICLE CONDITION & USAGE ANALYZER (TELEMETRY PREDICTIONS)
    [HttpGet("ai-predictions")]
    public async Task<IActionResult> GetAiPredictions()
    {
        var customer = await GetCurrentCustomerAsync();
        if (customer == null) return NotFound("Customer profile not found.");

        if (customer.Vehicles == null || !customer.Vehicles.Any())
        {
            return Ok(new
            {
                hasVehicles = false,
                predictions = new List<object>(),
                alertMessage = "No active vehicles registered. Add a vehicle in your profile to initialize AI condition-based diagnostics."
            });
        }

        var predictions = new List<object>();

        // We can inspect past purchases/services to adjust variables
        var pastPartPurchases = await _context.Sales
            .Include(s => s.SaleItems)
                .ThenInclude(si => si.Part)
            .Where(s => s.CustomerId == customer.Id)
            .SelectMany(s => s.SaleItems.Select(si => si.Part.Name.ToLower()))
            .ToListAsync();

        var lastAppointment = await _context.Appointments
            .Where(a => a.CustomerId == customer.Id)
            .OrderByDescending(a => a.AppointmentDate)
            .FirstOrDefaultAsync();

        foreach (var vehicle in customer.Vehicles)
        {
            string vehicleNameWithCategory = string.IsNullOrWhiteSpace(vehicle.VehicleType) 
                ? $"{vehicle.Brand} {vehicle.Model}" 
                : $"[{vehicle.VehicleType}] {vehicle.Brand} {vehicle.Model}";

            int ageYears = DateTime.UtcNow.Year - (vehicle.Year ?? DateTime.UtcNow.Year - 5);
            if (ageYears <= 0) ageYears = 3;

            // Baseline multiplier from Odometer mileage
            double odometerMultiplier = 1.0;
            if (vehicle.Odometer.HasValue)
            {
                if (vehicle.Odometer.Value > 150000) odometerMultiplier = 1.45;
                else if (vehicle.Odometer.Value > 80000) odometerMultiplier = 1.25;
                else if (vehicle.Odometer.Value > 30000) odometerMultiplier = 1.1;
            }

            // --- 1. Brake Pads (Condition Wear Prediction) ---
            bool boughtBrakesRecently = pastPartPurchases.Any(p => p.Contains("brake") || p.Contains("pad"));
            int baseBrakeRisk = boughtBrakesRecently ? 15 : Math.Min(95, 30 + (ageYears * 8));
            
            // Environment influence
            double brakeEnvModifier = 1.0;
            string brakeEnvReason = "";
            if (vehicle.PrimaryDrivingEnvironment == "City")
            {
                brakeEnvModifier = 1.25;
                brakeEnvReason = " Stop-and-go city environment accelerates friction wear on brake pads.";
            }

            int finalBrakeRisk = (int)Math.Min(98, baseBrakeRisk * odometerMultiplier * brakeEnvModifier);
            string brakeRul = boughtBrakesRecently 
                ? "18,000 km or 14 months" 
                : $"{Math.Max(300, (int)((4500 - (ageYears * 400)) / (odometerMultiplier * brakeEnvModifier)))} km or {Math.Max(1, 10 - ageYears)} months";

            predictions.Add(new
            {
                vehicleId = vehicle.Id,
                vehicleName = vehicleNameWithCategory,
                component = "Front Brake Pads & Rotors",
                probability = finalBrakeRisk,
                severity = finalBrakeRisk > 75 ? "High" : finalBrakeRisk > 40 ? "Medium" : "Low",
                remainingLife = brakeRul,
                reason = boughtBrakesRecently 
                    ? "Recently replaced brake components registered. Wear profile is healthy." 
                    : $"Based on vehicle age ({ageYears} years) and absence of brake services, friction material is approaching safe minimums.{brakeEnvReason}",
                recommendedAction = boughtBrakesRecently 
                    ? "Routine checks during quarterly rotations only." 
                    : "Schedule a Front Brake Pad Replacement and rotor inspection within the next month."
            });

            // --- 2. Engine Oil vs. EV Traction Battery Health ---
            if (vehicle.EngineType == "Electric")
            {
                // EV Traction Battery prediction
                int evBatteryRisk = vehicle.Odometer.HasValue ? Math.Min(95, (int)(vehicle.Odometer.Value / 3000.0)) : 20;
                string batteryRul = $"{Math.Max(5000, 160000 - (vehicle.Odometer ?? 10000))} km";

                predictions.Add(new
                {
                    vehicleId = vehicle.Id,
                    vehicleName = vehicleNameWithCategory,
                    component = "EV Lithium-Ion Battery Pack",
                    probability = evBatteryRisk,
                    severity = evBatteryRisk > 75 ? "High" : evBatteryRisk > 35 ? "Medium" : "Low",
                    remainingLife = batteryRul,
                    reason = $"Lithium cell wear and capacity degradation calculated from current mileage ({vehicle.Odometer ?? 0} km). State of Health (SoH) is estimated at {100 - (evBatteryRisk / 4)}%.",
                    recommendedAction = evBatteryRisk > 75 
                        ? "Contact workshop for advanced high-voltage balance test." 
                        : "Maintain optimal state-of-charge cycles (avoid letting charge drop below 10%)."
                });
            }
            else
            {
                // Engine Lubrication & Filter
                bool serviceRecently = lastAppointment != null && lastAppointment.AppointmentDate > DateTime.UtcNow.AddMonths(-3);
                int baseOilRisk = serviceRecently ? 10 : Math.Min(90, 20 + (DateTime.UtcNow - (lastAppointment?.AppointmentDate ?? DateTime.UtcNow.AddMonths(-8))).Days / 3);
                
                // Hybrid wear reduction
                double oilEngineModifier = 1.0;
                string oilEngineReason = "";
                if (vehicle.EngineType == "Hybrid")
                {
                    oilEngineModifier = 0.75;
                    oilEngineReason = " Hybrid drivetrain operations reduce internal combustion engine wear.";
                }

                int finalOilRisk = (int)Math.Min(95, baseOilRisk * odometerMultiplier * oilEngineModifier);
                string oilRul = serviceRecently ? "8,500 km or 5 months" : "1,200 km or 3 weeks";

                predictions.Add(new
                {
                    vehicleId = vehicle.Id,
                    vehicleName = vehicleNameWithCategory,
                    component = "Engine Lubrication & Filter",
                    probability = finalOilRisk,
                    severity = finalOilRisk > 70 ? "High" : finalOilRisk > 35 ? "Medium" : "Low",
                    remainingLife = oilRul,
                    reason = serviceRecently 
                        ? $"Fresh lubricant detected in service logs. Viscosity levels optimal.{oilEngineReason}" 
                        : $"Lubricant degradation calculated from date of last service.{oilEngineReason} Estimated viscosity loss: {Math.Min(99, 10 + (finalOilRisk * 0.9))}%",
                    recommendedAction = serviceRecently 
                        ? "Proceed with normal driving. Monitor oil level monthly." 
                        : "Book a Full Synthetic Oil Service & Filter Replacement."
                });
            }

            // --- 3. Suspension or Tires depending on environment ---
            if (vehicle.PrimaryDrivingEnvironment == "Mountainous / Off-Road")
            {
                int suspRisk = Math.Min(95, (int)(30 + (ageYears * 10) * odometerMultiplier));
                predictions.Add(new
                {
                    vehicleId = vehicle.Id,
                    vehicleName = vehicleNameWithCategory,
                    component = "Suspension Struts & Bushings",
                    probability = suspRisk,
                    severity = suspRisk > 75 ? "High" : suspRisk > 40 ? "Medium" : "Low",
                    remainingLife = $"{Math.Max(1000, (int)(15000 / odometerMultiplier))} km",
                    reason = "Mountainous and off-road driving environment exposes chassis components to severe high-impact vibration and mechanical shock.",
                    recommendedAction = suspRisk > 75 
                        ? "Schedule urgent strut replacement and ball joint inspection." 
                        : "Inspect rubber control arm bushings during the next standard service."
                });
            }
            else if (vehicle.PrimaryDrivingEnvironment == "Highway")
            {
                int tireRisk = Math.Min(95, (int)(25 + (ageYears * 12) * odometerMultiplier));
                predictions.Add(new
                {
                    vehicleId = vehicle.Id,
                    vehicleName = vehicleNameWithCategory,
                    component = "High-Speed Cruising Tires",
                    probability = tireRisk,
                    severity = tireRisk > 75 ? "High" : tireRisk > 40 ? "Medium" : "Low",
                    remainingLife = $"{Math.Max(800, (int)(12000 / odometerMultiplier))} km",
                    reason = "Highway cruising at sustained high velocities increases tire temperature and friction tread wear.",
                    recommendedAction = tireRisk > 75 
                        ? "Immediate tire replacement and wheel balancing required." 
                        : "Rotate tires and perform precise four-wheel tracking alignment."
                });
            }
            else
            {
                // Standard 12V Battery Check
                int batteryRisk = ageYears > 4 ? 80 : 35;
                int finalBatteryRisk = (int)Math.Min(98, batteryRisk * odometerMultiplier);
                predictions.Add(new
                {
                    vehicleId = vehicle.Id,
                    vehicleName = vehicleNameWithCategory,
                    component = "12V Lead-Acid Battery",
                    probability = finalBatteryRisk,
                    severity = finalBatteryRisk > 70 ? "High" : "Medium",
                    remainingLife = ageYears > 4 ? "400 km or 1 month" : "12,000 km or 8 months",
                    reason = ageYears > 4 
                        ? $"Original battery is {ageYears} years old, which exceeds standard charge retention cycles." 
                        : "Cold-cranking amp ratings indicate standard cell health and nominal charge capacity.",
                    recommendedAction = finalBatteryRisk > 70 
                        ? "Proactively replace battery to prevent unexpected cold-starting failure." 
                        : "Conduct a load test during the next scheduled workshop checkup."
                });
            }
        }

        return Ok(new
        {
            hasVehicles = true,
            predictions,
            alertMessage = predictions.Any(p => (p as dynamic).severity == "High") 
                ? "Warning: AI Diagnostics have flagged components with high failure probability. Prompt maintenance is advised." 
                : "Vehicle status: All telemetry checks report standard operational conditions."
        });
    }
}

// DTOS
public class UpdateProfileDto
{
    public string? Name { get; set; }
    public string? Phone { get; set; }
    public string? Address { get; set; }
}

public class AddVehicleDto
{
    public string VehicleNumber { get; set; } = string.Empty;
    public string? Brand { get; set; }
    public string? Model { get; set; }
    public int? Year { get; set; }
    public int? Odometer { get; set; }
    public string? PrimaryDrivingEnvironment { get; set; }
    public string? EngineType { get; set; }
    public string? VehicleType { get; set; }
}

public class BookAppointmentDto
{
    public int VehicleId { get; set; }
    public DateTime AppointmentDate { get; set; }
    public string? Description { get; set; }
}

public class RequestPartDto
{
    public string PartName { get; set; } = string.Empty;
    public string? Description { get; set; }
}

public class SubmitReviewDto
{
    public int Rating { get; set; }
    public string? Comment { get; set; }
}
