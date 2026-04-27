namespace VehicleParts.Application.Interfaces;

// Generic contract for basic CRUD-style repository operations.
public interface IRepositoryBase<T>
{
    Task<List<T>> FindAllAsync();
    Task<T?> GetByIdAsync(int id);
    void Create(T entity);
    void Update(T entity);
    void Delete(T entity);
    Task SaveChangesAsync();
}