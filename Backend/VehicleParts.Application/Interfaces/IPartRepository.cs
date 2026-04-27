using VehicleParts.Domain.Entities;

namespace VehicleParts.Application.Interfaces;

// Part-specific data operations used by purchase/sale flows.
public interface IPartRepository : IRepositoryBase<Part>
{
    // Increases stock for a part after purchase intake.
    void IncreaseStock(int partId, int quantity);
}