import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import API from "../../services/api";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import ListPagination from "../../components/common/ListPagination";
import { useTablePagination } from "../../hooks/useTablePagination";

type Customer = {
  id: number;
  fullName: string;
  email: string;
  phoneNumber: string;
  address: string;
  vehicleNumber?: string;
  model?: string;
  brand?: string;
  vehicleNumbers?: string[];
};

function uniqueByCustomerId(rows: Customer[]): Customer[] {
  const map = new Map<number, Customer>();
  for (const row of rows) {
    const nums =
      row.vehicleNumbers?.length
        ? row.vehicleNumbers
        : row.vehicleNumber
          ? [row.vehicleNumber]
          : [];

    if (!map.has(row.id)) {
      map.set(row.id, { ...row, vehicleNumbers: [...nums] });
      continue;
    }

    const existing = map.get(row.id)!;
    const merged = new Set([...(existing.vehicleNumbers ?? []), ...nums]);
    existing.vehicleNumbers = Array.from(merged);
  }
  return Array.from(map.values());
}

function formatVehicles(c: Customer) {
  const list = c.vehicleNumbers ?? (c.vehicleNumber ? [c.vehicleNumber] : []);
  if (list.length === 0) return "—";
  if (list.length === 1) return list[0];
  return `${list.length} vehicles (${list.join(", ")})`;
}

export default function SearchCustomer() {
  const [keyword, setKeyword] = useState("");
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [allCustomers, setAllCustomers] = useState<Customer[]>([]);
  const [message, setMessage] = useState("");
  const [listError, setListError] = useState("");
  const [searched, setSearched] = useState(false);

  const { currentPage, setCurrentPage, totalPages, paginatedItems } =
    useTablePagination(allCustomers);

  useEffect(() => {
    API.get<Customer[]>("/staff/customers")
      .then((res) => setAllCustomers(uniqueByCustomerId(res.data)))
      .catch(() => setListError("Unable to load customers."));
  }, []);

  const handleSearch = async () => {
    if (!keyword.trim()) {
      setMessage("Enter customer name, phone, ID, or vehicle number.");
      setSearchResults([]);
      setSearched(false);
      return;
    }

    try {
      const res = await API.get<Customer[]>(
        `/staff/customers/search?query=${encodeURIComponent(keyword.trim())}`
      );
      setSearchResults(res.data);
      setSearched(true);
      setMessage(res.data.length === 0 ? "No customers found." : "");
    } catch {
      setMessage("Unable to search. Check that you are logged in as Staff.");
      setSearchResults([]);
      setSearched(true);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Customer Details"
        description="Search customers or browse the full list below."
      />

      <div className="mb-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-100 p-4 sm:flex-row">
          <input
            className="input-field flex-1"
            type="text"
            placeholder="Name, phone, ID, or vehicle number"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
          <button type="button" className="btn-primary" onClick={handleSearch}>
            <MagnifyingGlassIcon className="h-4 w-4" />
            Search
          </button>
        </div>
        {message && (
          <p className="px-4 pb-4 text-sm text-slate-500">{message}</p>
        )}
      </div>

      {searched && searchResults.length > 0 && (
        <div className="mb-8">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-slate-500">
            Search results
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {searchResults.map((c) => (
              <div
                key={`${c.id}-${c.vehicleNumber ?? "none"}`}
                className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
              >
                <div className="border-b border-slate-100 px-5 py-4">
                  <h3 className="font-semibold text-slate-900">{c.fullName}</h3>
                  <p className="text-xs font-mono text-slate-500">#{c.id}</p>
                </div>
                <div className="space-y-1.5 px-5 py-4 text-sm text-slate-600">
                  <p>
                    <span className="font-medium text-slate-700">Phone:</span>{" "}
                    {c.phoneNumber}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700">Email:</span>{" "}
                    {c.email}
                  </p>
                  <p>
                    <span className="font-medium text-slate-700">Vehicle:</span>{" "}
                    {c.vehicleNumber || "—"}
                    {c.brand || c.model
                      ? ` (${[c.brand, c.model].filter(Boolean).join(" ")})`
                      : ""}
                  </p>
                </div>
                <div className="border-t border-slate-100 px-5 py-3">
                  <Link
                    to={`/staff/customers/${c.id}`}
                    className="btn-primary inline-flex text-xs"
                  >
                    View & edit details
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">All customers</h2>
          <p className="mt-1 text-sm text-slate-500">
            {allCustomers.length} customer{allCustomers.length === 1 ? "" : "s"}
          </p>
        </div>

        {listError && (
          <p className="px-6 py-4 text-sm text-red-600">{listError}</p>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  ID
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Vehicles
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Phone
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {allCustomers.length === 0 && !listError ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No customers yet.
                  </td>
                </tr>
              ) : (
                paginatedItems.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-slate-100 hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                      #{c.id}
                    </td>
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      {c.fullName}
                    </td>
                    <td className="max-w-[200px] px-4 py-3.5 text-xs text-slate-600">
                      {formatVehicles(c)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{c.phoneNumber}</td>
                    <td className="px-4 py-3.5 text-slate-600">{c.email}</td>
                    <td className="px-4 py-3.5">
                      <Link
                        to={`/staff/customers/${c.id}`}
                        className="btn-secondary inline-flex"
                      >
                        View & edit
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <ListPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </>
  );
}
