// Abishek Tiwari: staff create / deactivate / delete — uses charcoal .btn-primary from index.css
import { useEffect, useMemo, useState } from "react";
import {
  PlusIcon,
  UserMinusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import API from "../../services/api";
import AdminFormModal from "../../components/admin/AdminFormModal";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import ConfirmPopup from "../../components/admin/ConfirmPopup";
import FeedbackPopup from "../../components/admin/FeedbackPopup";
import AdminListControls from "../../components/admin/AdminListControls";
import ListPagination from "../../components/common/ListPagination";
import { useTablePagination } from "../../hooks/useTablePagination";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

export default function AdminStaffPage() {
  const [staff, setStaff] = useState<UserRow[]>([]);
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
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

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems: paginatedStaff,
  } = useTablePagination(filteredStaff);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter, setCurrentPage]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const isCreateDirty =
    form.name.trim() !== "" ||
    form.email.trim() !== "" ||
    form.password.trim() !== "";

  const closeCreateModal = () => {
    setCreateOpen(false);
    setForm({ name: "", email: "", password: "" });
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
      closeCreateModal();
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
      <AdminPageHeader
        title="Staff Management"
        description="Create staff accounts and control access to the system."
        action={
          <button
            type="button"
            className="btn-primary"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
            Add Staff
          </button>
        }
      />

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

      <AdminFormModal
        open={createOpen}
        title="Add Staff"
        subtitle="Create a new staff login for the system."
        isDirty={isCreateDirty}
        onClose={closeCreateModal}
        onSubmit={handleCreate}
        submitLabel="Create Staff"
        loading={loading}
      >
        <input
          className="input-field w-full"
          name="name"
          placeholder="Full name"
          value={form.name}
          onChange={handleChange}
          required
        />
        <input
          className="input-field w-full"
          type="email"
          name="email"
          placeholder="Email address"
          value={form.email}
          onChange={handleChange}
          required
        />
        <input
          className="input-field w-full"
          type="password"
          name="password"
          placeholder="Password (min 6 chars)"
          value={form.password}
          onChange={handleChange}
          minLength={6}
          required
        />
      </AdminFormModal>

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
