// Abishek Tiwari: staff create / deactivate / delete — uses charcoal .btn-primary from index.css
import { useEffect, useMemo, useState } from "react";
import {
  UserPlusIcon,
  UserMinusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import API from "../../services/api";
import ConfirmPopup from "../../components/admin/ConfirmPopup";
import FeedbackPopup from "../../components/admin/FeedbackPopup";
import AdminListControls from "../../components/admin/AdminListControls";
import ListPagination from "../../components/common/ListPagination";

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
  const [loading, setLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "success" | "error";
  }>({
    open: false,
    title: "",
    message: "",
    variant: "success",
  });

  const loadStaff = async () => {
    try {
      const res = await API.get<UserRow[]>("/users");
      setStaff(res.data.filter((u) => u.role === "Staff"));
    } catch {
      setFeedback({
        open: true,
        title: "Failed to load",
        message: "Failed to load staff list.",
        variant: "error",
      });
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, pageSize]);

  const filteredStaff = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return staff.filter((s) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        s.name.toLowerCase().includes(normalizedQuery) ||
        s.email.toLowerCase().includes(normalizedQuery) ||
        String(s.id).includes(normalizedQuery);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "active" && s.isActive) ||
        (statusFilter === "deactivated" && !s.isActive);
      return matchesQuery && matchesStatus;
    });
  }, [staff, searchQuery, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / pageSize));
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await API.post<UserRow>("/users/staff", form);
      setFeedback({
        open: true,
        title: "Staff created",
        message: `Staff account created successfully (ID: ${res.data.id}).`,
        variant: "success",
      });
      setForm({ name: "", email: "", password: "" });
      await loadStaff();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: string; status?: number } };
      setFeedback({
        open: true,
        title: "Create failed",
        message:
          ax.response?.data ||
          (ax.response?.status === 400
            ? "Email already exists."
            : "Could not create staff user."),
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await API.patch(`/users/staff/${id}/deactivate`);
      setFeedback({
        open: true,
        title: "Staff deactivated",
        message: `Staff account #${id} was deactivated.`,
        variant: "success",
      });
      await loadStaff();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: string } };
      setFeedback({
        open: true,
        title: "Deactivation failed",
        message: ax.response?.data || "Deactivation failed.",
        variant: "error",
      });
    }
  };

  const confirmDelete = async () => {
    if (deleteTargetId === null) return;
    setDeleting(true);
    try {
      await API.delete(`/users/staff/${deleteTargetId}`);
      setFeedback({
        open: true,
        title: "Staff deleted",
        message: `Staff account #${deleteTargetId} was deleted.`,
        variant: "success",
      });
      setDeleteTargetId(null);
      await loadStaff();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: string } };
      setFeedback({
        open: true,
        title: "Delete failed",
        message:
          ax.response?.data ||
          "Delete failed. User may be linked to existing sales.",
        variant: "error",
      });
    } finally {
      setDeleting(false);
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
        <AdminListControls
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by ID, name, or email"
          filterLabel="Status"
          filterValue={statusFilter}
          onFilterChange={setStatusFilter}
          filterOptions={[
            { value: "all", label: "All statuses" },
            { value: "active", label: "Active" },
            { value: "deactivated", label: "Deactivated" },
          ]}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          totalItems={filteredStaff.length}
        />
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
              {filteredStaff.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="px-4 py-10 text-center text-slate-400"
                  >
                    No matching staff users found.
                  </td>
                </tr>
              ) : (
                paginatedStaff.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 transition hover:bg-slate-50/80"
                  >
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                      #{s.id}
                    </td>
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
                          onClick={() => setDeleteTargetId(s.id)}
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
        <ListPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>

      <ConfirmPopup
        open={deleteTargetId !== null}
        title="Delete staff user?"
        message="This action permanently removes the staff account."
        confirmLabel={deleting ? "Deleting..." : "Delete"}
        onConfirm={confirmDelete}
        onClose={() => {
          if (!deleting) setDeleteTargetId(null);
        }}
        confirmDisabled={deleting}
      />
      <FeedbackPopup
        open={feedback.open}
        title={feedback.title}
        message={feedback.message}
        variant={feedback.variant}
        onClose={() =>
          setFeedback((prev) => ({
            ...prev,
            open: false,
          }))
        }
      />
    </>
  );
}
