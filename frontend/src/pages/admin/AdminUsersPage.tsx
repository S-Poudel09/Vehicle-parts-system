// Abishek Tiwari: all-users list — activate, deactivate, delete via /api/users
import { useEffect, useMemo, useState } from "react";
import {
  UserMinusIcon,
  UserPlusIcon,
  TrashIcon,
} from "@heroicons/react/24/outline";
import API from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import AdminFormModal from "../../components/admin/AdminFormModal";
import AdminListControls from "../../components/admin/AdminListControls";
import ConfirmPopup from "../../components/admin/ConfirmPopup";
import FeedbackPopup from "../../components/admin/FeedbackPopup";
import ListPagination from "../../components/common/ListPagination";
import { useTablePagination } from "../../hooks/useTablePagination";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

export default function AdminUsersPage() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [activateTarget, setActivateTarget] = useState<UserRow | null>(null);
  const [activatePassword, setActivatePassword] = useState("");
  const [activating, setActivating] = useState(false);
  const [deleteTargetId, setDeleteTargetId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
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

  const loadUsers = async () => {
    try {
      const res = await API.get<UserRow[]>("/users");
      setUsers(res.data);
      setError("");
    } catch {
      setUsers([]);
      setError("Unable to load users. Check that you are logged in as Admin.");
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();
    return users.filter((u) => {
      const matchesQuery =
        normalizedQuery.length === 0 ||
        u.name.toLowerCase().includes(normalizedQuery) ||
        u.email.toLowerCase().includes(normalizedQuery) ||
        String(u.id).includes(normalizedQuery);
      const matchesRole =
        roleFilter === "all" || u.role.toLowerCase() === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [users, searchQuery, roleFilter]);

  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems: paginatedUsers,
  } = useTablePagination(filteredUsers);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, roleFilter, setCurrentPage]);

  const handleDeactivate = async (id: number) => {
    try {
      await API.patch(`/users/${id}/deactivate`);
      setFeedback({
        open: true,
        title: "User deactivated",
        message: `User #${id} was deactivated.`,
        variant: "success",
      });
      await loadUsers();
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

  const closeActivateModal = () => {
    setActivateTarget(null);
    setActivatePassword("");
  };

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activateTarget) return;

    if (activatePassword.trim().length < 6) {
      setFeedback({
        open: true,
        title: "Invalid password",
        message: "Password must be at least 6 characters.",
        variant: "error",
      });
      return;
    }

    setActivating(true);
    try {
      await API.patch(`/users/${activateTarget.id}/activate`, {
        password: activatePassword,
      });
      setFeedback({
        open: true,
        title: "User activated",
        message: `User #${activateTarget.id} was reactivated.`,
        variant: "success",
      });
      closeActivateModal();
      await loadUsers();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: string } };
      setFeedback({
        open: true,
        title: "Activation failed",
        message: ax.response?.data || "Activation failed.",
        variant: "error",
      });
    } finally {
      setActivating(false);
    }
  };

  const confirmDelete = async () => {
    if (deleteTargetId === null) return;
    setDeleting(true);
    try {
      await API.delete(`/users/${deleteTargetId}`);
      setFeedback({
        open: true,
        title: "User deleted",
        message: `User #${deleteTargetId} was deleted.`,
        variant: "success",
      });
      setDeleteTargetId(null);
      await loadUsers();
    } catch (err: unknown) {
      const ax = err as { response?: { data?: string } };
      setFeedback({
        open: true,
        title: "Delete failed",
        message:
          ax.response?.data ||
          "Delete failed. User may be linked to existing records.",
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
          All Users
        </h1>
        <p className="mt-1.5 text-slate-500">
          Complete list of accounts across every role.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <AdminListControls
          searchValue={searchQuery}
          onSearchChange={setSearchQuery}
          searchPlaceholder="Search by ID, name, or email"
          filterLabel="Role"
          filterValue={roleFilter}
          onFilterChange={setRoleFilter}
          filterOptions={[
            { value: "all", label: "All roles" },
            { value: "admin", label: "Admin" },
            { value: "staff", label: "Staff" },
            { value: "customer", label: "Customer" },
          ]}
          totalItems={filteredUsers.length}
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
                  Role
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
              {filteredUsers.length === 0 && !error ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                    No matching users found.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((u) => {
                  const isSelf = currentUser?.id === u.id;
                  const isAdmin = u.role === "Admin";
                  const isActive = u.isActive !== false;
                  const cannotDeactivate = isSelf || isAdmin;
                  return (
                    <tr
                      key={u.id}
                      className="border-b border-slate-100 transition hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                        #{u.id}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        {u.name}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{u.email}</td>
                      <td className="px-4 py-3.5 text-slate-600">{u.role}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            isActive
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex flex-wrap gap-2">
                          {isActive ? (
                            <button
                              type="button"
                              disabled={cannotDeactivate}
                              title={
                                isSelf
                                  ? "You cannot deactivate your own account"
                                  : isAdmin
                                    ? "Admin accounts cannot be deactivated"
                                    : undefined
                              }
                              onClick={() => handleDeactivate(u.id)}
                              className="btn-secondary disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              <UserMinusIcon className="h-3.5 w-3.5" />
                              Deactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => {
                                setActivateTarget(u);
                                setActivatePassword("");
                              }}
                              className="btn-secondary"
                            >
                              <UserPlusIcon className="h-3.5 w-3.5" />
                              Activate
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => setDeleteTargetId(u.id)}
                            disabled={isSelf}
                            title={
                              isSelf
                                ? "You cannot delete your own account"
                                : undefined
                            }
                            className="btn-danger disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <TrashIcon className="h-3.5 w-3.5" />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
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
        open={activateTarget !== null}
        title="Activate user"
        subtitle={
          activateTarget
            ? `Set a new password for ${activateTarget.name}`
            : undefined
        }
        isDirty={activatePassword.trim().length > 0}
        onClose={closeActivateModal}
        onSubmit={handleActivate}
        submitLabel="Activate"
        loading={activating}
      >
        <input
          className="input-field w-full"
          type="password"
          placeholder="New password (min 6 characters)"
          value={activatePassword}
          onChange={(e) => setActivatePassword(e.target.value)}
          minLength={6}
          required
        />
      </AdminFormModal>

      <ConfirmPopup
        open={deleteTargetId !== null}
        title="Delete user?"
        message="This permanently removes the user account. Linked records may block deletion."
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
