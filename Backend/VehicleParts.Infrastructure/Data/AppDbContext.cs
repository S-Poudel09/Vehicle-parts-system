using Microsoft.EntityFrameworkCore;
using VehicleParts.Domain.Entities;

namespace VehicleParts.Infrastructure.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options)
    : DbContext(options)
{
    // TABLES
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Vehicle> Vehicles => Set<Vehicle>();
    public DbSet<Vendor> Vendors => Set<Vendor>();
    public DbSet<Part> Parts => Set<Part>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleItem> SaleItems => Set<SaleItem>();
    public DbSet<Payment> Payments => Set<Payment>();
    public DbSet<Purchase> Purchases => Set<Purchase>();
    public DbSet<PurchaseItem> PurchaseItems => Set<PurchaseItem>();
    public DbSet<Appointment> Appointments => Set<Appointment>();
    public DbSet<Review> Reviews => Set<Review>();
    public DbSet<PartRequest> PartRequests => Set<PartRequest>();
    public DbSet<CustomerPartOrder> CustomerPartOrders => Set<CustomerPartOrder>();
    public DbSet<PartOrderPaymentLog> PartOrderPaymentLogs => Set<PartOrderPaymentLog>();
    public DbSet<Notification> Notifications => Set<Notification>();
    public DbSet<AdminActivityLog> AdminActivityLogs => Set<AdminActivityLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // User - Role (many users belong to one role)
        modelBuilder.Entity<User>()
            .HasOne(u => u.Role)
            .WithMany(r => r.Users)
            .HasForeignKey(u => u.RoleId);

        // User - Customer (one-to-one)
        modelBuilder.Entity<User>()
            .HasOne(u => u.Customer)
            .WithOne(c => c.User)
            .HasForeignKey<Customer>(c => c.UserId);

        // Customer - Vehicle (one customer owns many vehicles)
        modelBuilder.Entity<Vehicle>()
            .HasOne(v => v.Customer)
            .WithMany(c => c.Vehicles)
            .HasForeignKey(v => v.CustomerId);

        // Customer - Sale (one customer has many sales)
        modelBuilder.Entity<Sale>()
            .HasOne(s => s.Customer)
            .WithMany(c => c.Sales)
            .HasForeignKey(s => s.CustomerId);

        // Sale - Staff (each sale handled by one staff, staff can handle many sales)
        modelBuilder.Entity<Sale>()
            .HasOne(s => s.Staff)
            .WithMany()
            .HasForeignKey(s => s.StaffId);

        // Sale - SaleItem (one sale contains many sale items)
        modelBuilder.Entity<SaleItem>()
            .HasOne(si => si.Sale)
            .WithMany(s => s.SaleItems)
            .HasForeignKey(si => si.SaleId);

        // SaleItem - Part (each sale item refers to one part, part can appear in many sale items)
        modelBuilder.Entity<SaleItem>()
            .HasOne(si => si.Part)
            .WithMany(p => p.SaleItems)
            .HasForeignKey(si => si.PartId);

        // Sale - Payment (one sale can have many payments)
        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Sale)
            .WithMany(s => s.Payments)
            .HasForeignKey(p => p.SaleId);

        // Part - Vendor (each part supplied by one vendor, vendor can supply many parts)
        modelBuilder.Entity<Part>()
            .HasOne(p => p.Vendor)
            .WithMany(v => v.Parts)
            .HasForeignKey(p => p.VendorId);

        // Purchase - Vendor (each purchase from one vendor, vendor can have many purchases)
        modelBuilder.Entity<Purchase>()
            .HasOne(p => p.Vendor)
            .WithMany(v => v.Purchases)
            .HasForeignKey(p => p.VendorId);

        // Purchase - PurchaseItem (one purchase contains many purchase items)
        modelBuilder.Entity<PurchaseItem>()
            .HasOne(pi => pi.Purchase)
            .WithMany(p => p.PurchaseItems)
            .HasForeignKey(pi => pi.PurchaseId);

        // PurchaseItem - Part (each purchase item refers to one part, part can appear in many purchase items)
        modelBuilder.Entity<PurchaseItem>()
            .HasOne(pi => pi.Part)
            .WithMany(p => p.PurchaseItems)
            .HasForeignKey(pi => pi.PartId);

        // Appointment - Customer (one customer can have many appointments)
        modelBuilder.Entity<Appointment>()
            .HasOne(a => a.Customer)
            .WithMany(c => c.Appointments)
            .HasForeignKey(a => a.CustomerId);

        // Appointment - Vehicle (one vehicle can have many appointments)
        modelBuilder.Entity<Appointment>()
            .HasOne(a => a.Vehicle)
            .WithMany(v => v.Appointments)
            .HasForeignKey(a => a.VehicleId);

        // Review - Customer (one customer can write many reviews)
        modelBuilder.Entity<Review>()
            .HasOne(r => r.Customer)
            .WithMany(c => c.Reviews)
            .HasForeignKey(r => r.CustomerId);

        // PartRequest - Customer (one customer can make many part requests)
        modelBuilder.Entity<PartRequest>()
            .HasOne(pr => pr.Customer)
            .WithMany(c => c.PartRequests)
            .HasForeignKey(pr => pr.CustomerId);

        modelBuilder.Entity<CustomerPartOrder>()
            .HasOne(o => o.Customer)
            .WithMany(c => c.PartOrders)
            .HasForeignKey(o => o.CustomerId);

        modelBuilder.Entity<CustomerPartOrder>()
            .HasOne(o => o.Part)
            .WithMany()
            .HasForeignKey(o => o.PartId);

        modelBuilder.Entity<CustomerPartOrder>()
            .HasOne(o => o.HandledByStaff)
            .WithMany()
            .HasForeignKey(o => o.HandledByStaffId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<CustomerPartOrder>()
            .HasOne(o => o.Sale)
            .WithMany()
            .HasForeignKey(o => o.SaleId)
            .OnDelete(DeleteBehavior.SetNull);

        modelBuilder.Entity<PartOrderPaymentLog>()
            .HasOne(l => l.PartOrder)
            .WithMany(o => o.PaymentLogs)
            .HasForeignKey(l => l.PartOrderId);

        modelBuilder.Entity<PartOrderPaymentLog>()
            .HasOne(l => l.Staff)
            .WithMany()
            .HasForeignKey(l => l.StaffId);

        // Notification - User (one user can have many notifications)
        modelBuilder.Entity<Notification>()
            .HasOne(n => n.User)
            .WithMany()
            .HasForeignKey(n => n.UserId);

        //Temp User
        modelBuilder.Entity<Role>().HasData(
    new Role { Id = 1, Name = "Admin" },
    new Role { Id = 2, Name = "Staff" },
    new Role { Id = 3, Name = "Customer" }
);

        modelBuilder.Entity<User>().HasData(
            new User
            {
                Id = 1,
                Name = "Admin",
                Email = "admin@gmail.com",
                Password = "1234",
                RoleId = 1,
                CreatedAt = new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified),
                EmailVerified = true
            }
        );
    }

}