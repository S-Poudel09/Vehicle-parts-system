using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using VehicleParts.Application.Interfaces;
using VehicleParts.Application.Services;
using VehicleParts.Infrastructure.Data;
using VehicleParts.Infrastructure.Repositories;
using VehicleParts.Infrastructure.Repository;
using VehicleParts.Infrastructure.Services; 

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddControllers();

// Swagger services
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddOpenApi(); // added
builder.Services.AddSwaggerGen(options => // updated
{
    options.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "Vehicle Parts API",
        Version = "v1"
    });
});

// JWT — tell ASP.NET how to validate incoming tokens
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!))
        };
    });

builder.Services.AddAuthorization();

// CORS
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
        policy.WithOrigins("http://localhost:5173", "http://localhost:5174")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// Services 
builder.Services.AddScoped<IVendorService, VendorService>();
builder.Services.AddScoped<IPurchaseService, PurchaseService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<IStaffCustomerService, StaffCustomerService>(); // from feature branch
builder.Services.AddScoped<IPartService, PartService>();

// Feature 11: Email invoice service
builder.Services.Configure<EmailSettings>(
    builder.Configuration.GetSection("EmailSettings")
);
builder.Services.AddScoped<IEmailService, EmailService>();

// Repositories
builder.Services.AddScoped<IVendorRepository, VendorRepository>();
builder.Services.AddScoped<IPurchaseRepository, PurchaseRepository>();
builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<IStaffCustomerRepository, StaffCustomerRepository>(); // from feature branch
builder.Services.AddScoped<IPartRepository, PartRepository>();

// Database (local vs cloud connection switch)
var useCloudDatabase = builder.Configuration.GetValue<bool>("Database:UseCloud");
var selectedConnectionName = useCloudDatabase ? "CloudConnection" : "DefaultConnection";
var selectedConnectionString =
    builder.Configuration.GetConnectionString(selectedConnectionName)
    ?? builder.Configuration.GetConnectionString("DefaultConnection")
    ?? throw new InvalidOperationException("Database connection string is not configured.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(selectedConnectionString));

var app = builder.Build();

// Middleware
app.UseMiddleware<VehicleParts.API.Middleware.ExceptionMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi(); // keeps /openapi/v1.json working
    app.UseSwagger();
    app.UseSwaggerUI(options => // updated
    {
        options.SwaggerEndpoint("/swagger/v1/swagger.json", "Vehicle Parts API v1");
    });
}

// app.UseHttpsRedirection();
app.UseCors("AllowFrontend");

app.UseAuthentication();   // must be BEFORE authorization
app.UseAuthorization();

app.MapControllers();
app.Run();