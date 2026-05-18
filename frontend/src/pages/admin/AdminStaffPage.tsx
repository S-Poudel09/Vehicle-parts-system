// Abishek Tiwari: staff create / deactivate / delete — uses charcoal .btn-primary from index.css
import { useEffect, useState } from "react";
import {
  UserPlusIcon,
  UserMinusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import API from "../../services/api";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<UserRow[]>([]);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const loadStaff = async () => {
    try {
      const res = await API.get<UserRow[]>("/users");
      setStaff(res.data.filter((u) => u.role === "Staff"));
    } catch {
      setError("Failed to load staff list.");
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    setError("");
    setLoading(true);

    try {
      await API.post("/users/staff", form);
      setMessage("Staff account created successfully.");
      setForm({ name: "", email: "", password: "" });
      await loadStaff();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: string; status?: number } };
      setError(
        ax.response?.data ||
          (ax.response?.status === 400
            ? "Email already exists."
            : "Could not create staff user.")
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    setMessage("");
    setError("");
    try {
      await API.patch(`/users/staff/${id}/deactivate`);
      setMessage("Staff deactivated.");
      await loadStaff();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: string } };
      setError(ax.response?.data || "Deactivation failed.");
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm("Permanently delete this staff user?")) return;
    setMessage("");
    setError("");
    try {
      await API.delete(`/users/staff/${id}`);
      setMessage("Staff deleted.");
      await loadStaff();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: string } };
      setError(
        ax.response?.data ||
          "Delete failed. User may be linked to existing sales."
      );
    }
  };

  return (
    <>
      <div className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Staff Management
        </h1>
        <p className="mt-1.5 text-slate-500">
          Create staff accounts and control access to the system.
        </p>
      </div>

      {message && (
        <div className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="mb-5 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
        <h3 className="mb-5 flex items-center gap-2 text-base font-semibold text-slate-900">
          <UserPlusIcon className="h-5 w-5 text-slate-600" />
          Add New Staff
        </h3>
        <form
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:items-end"
          onSubmit={handleCreate}
        >
          <input
            className="input-field"
            name="name"
            placeholder="Full name"
            value={form.name}
            onChange={handleChange}
            required
          />
          <input
            className="input-field"
            type="email"
            name="email"
            placeholder="Email address"
            value={form.email}
            onChange={handleChange}
            required
          />
          <input
            className="input-field"
            type="password"
            name="password"
            placeholder="Password (min 6 chars)"
            value={form.password}
            onChange={handleChange}
            minLength={6}
            required
          />
          {/* Abishek Tiwari: charcoal primary — was default blue before Tailwind btn-primary */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
          >
            {loading ? "Creating…" : "Create Staff"}
          </button>
        </form>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-900">Staff Directory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50">
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Email
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {staff.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    No staff users yet.
                  </td>
                </tr>
              ) : (
                staff.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3.5 font-semibold text-slate-900">
                      {s.name}
                    </td>
                    <td className="px-4 py-3.5 text-slate-600">{s.email}</td>
                    <td className="px-4 py-3.5">
                      <span
                        className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                          s.isActive
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {s.isActive ? "Active" : "Deactivated"}
                      </span>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={!s.isActive}
                          onClick={() => handleDeactivate(s.id)}
                          className="btn-secondary"
                        >
                          <UserMinusIcon className="h-3.5 w-3.5" />
                          Deactivate
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(s.id)}
                          className="btn-danger"
                        >
                          <TrashIcon className="h-3.5 w-3.5" />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
