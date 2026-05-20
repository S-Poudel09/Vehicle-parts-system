using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace VehicleParts.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddCustomerPartOrders : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "CustomerPartOrders",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    CustomerId = table.Column<int>(type: "integer", nullable: false),
                    PartId = table.Column<int>(type: "integer", nullable: false),
                    Quantity = table.Column<int>(type: "integer", nullable: false),
                    UnitPrice = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    Discount = table.Column<decimal>(type: "numeric", nullable: false),
                    FinalAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    Status = table.Column<int>(type: "integer", nullable: false),
                    PaymentReferenceId = table.Column<string>(type: "text", nullable: true),
                    CustomerDeclaredAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    PaidAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    PendingAmount = table.Column<decimal>(type: "numeric", nullable: false),
                    HandledByStaffId = table.Column<int>(type: "integer", nullable: true),
                    SaleId = table.Column<int>(type: "integer", nullable: true),
                    InvoiceNumber = table.Column<string>(type: "text", nullable: true),
                    StaffNotes = table.Column<string>(type: "text", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    ApprovedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PaymentSubmittedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    VerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CustomerPartOrders", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CustomerPartOrders_Customers_CustomerId",
                        column: x => x.CustomerId,
                        principalTable: "Customers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CustomerPartOrders_Parts_PartId",
                        column: x => x.PartId,
                        principalTable: "Parts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CustomerPartOrders_Sales_SaleId",
                        column: x => x.SaleId,
                        principalTable: "Sales",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_CustomerPartOrders_Users_HandledByStaffId",
                        column: x => x.HandledByStaffId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "PartOrderPaymentLogs",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PartOrderId = table.Column<int>(type: "integer", nullable: false),
                    StaffId = table.Column<int>(type: "integer", nullable: false),
                    AmountVerified = table.Column<decimal>(type: "numeric", nullable: false),
                    TotalPaidAfter = table.Column<decimal>(type: "numeric", nullable: false),
                    PendingAfter = table.Column<decimal>(type: "numeric", nullable: false),
                    PaymentReferenceId = table.Column<string>(type: "text", nullable: true),
                    Notes = table.Column<string>(type: "text", nullable: true),
                    VerifiedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PartOrderPaymentLogs", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PartOrderPaymentLogs_CustomerPartOrders_PartOrderId",
                        column: x => x.PartOrderId,
                        principalTable: "CustomerPartOrders",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PartOrderPaymentLogs_Users_StaffId",
                        column: x => x.StaffId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CustomerPartOrders_CustomerId",
                table: "CustomerPartOrders",
                column: "CustomerId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerPartOrders_HandledByStaffId",
                table: "CustomerPartOrders",
                column: "HandledByStaffId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerPartOrders_PartId",
                table: "CustomerPartOrders",
                column: "PartId");

            migrationBuilder.CreateIndex(
                name: "IX_CustomerPartOrders_SaleId",
                table: "CustomerPartOrders",
                column: "SaleId");

            migrationBuilder.CreateIndex(
                name: "IX_PartOrderPaymentLogs_PartOrderId",
                table: "PartOrderPaymentLogs",
                column: "PartOrderId");

            migrationBuilder.CreateIndex(
                name: "IX_PartOrderPaymentLogs_StaffId",
                table: "PartOrderPaymentLogs",
                column: "StaffId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PartOrderPaymentLogs");

            migrationBuilder.DropTable(
                name: "CustomerPartOrders");
        }
    }
}
