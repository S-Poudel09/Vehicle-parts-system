import { ADMIN_TABLE_PAGE_SIZE } from "../../constants/adminPagination";

type FilterOption = {
  value: string;
  label: string;
};

type AdminListControlsProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder: string;
  filterLabel?: string;
  filterValue: string;
  onFilterChange: (value: string) => void;
  filterOptions: FilterOption[];
  totalItems: number;
};

export default function AdminListControls({
  searchValue,
  onSearchChange,
  searchPlaceholder,
  filterLabel = "Filter",
  filterValue,
  onFilterChange,
  filterOptions,
  totalItems,
}: AdminListControlsProps) {
  return (
    <div className="border-b border-slate-100 px-6 py-4">
      <div className="mb-3 grid gap-3 md:grid-cols-2">
        <input
          className="input-field w-full"
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={searchPlaceholder}
        />
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            {filterLabel}
          </label>
          <select
            className="input-field w-full"
            value={filterValue}
            onChange={(e) => onFilterChange(e.target.value)}
          >
            {filterOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="text-sm text-slate-600">
        {totalItems} result(s) · {ADMIN_TABLE_PAGE_SIZE} per page
      </div>
    </div>
  );
}
