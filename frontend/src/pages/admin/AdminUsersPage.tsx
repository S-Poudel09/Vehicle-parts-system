// Abishek Tiwari: read-only all-users table (Admin) — GET /api/users
import { useEffect, useState } from "react";
import API from "../../services/api";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    API.get<UserRow[]>("/users")
      .then((res) => {
        setUsers(res.data);
        setError("");
      })
      .catch(() => {
        setUsers([]);
        setError("Unable to load users. Check that you are logged in as Admin.");
      });
  }, []);

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
              </tr>
            </thead>
            <tbody>
              {users.length === 0 && !error ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
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
                        u.isActive !== false
                          ? "bg-emerald-100 text-emerald-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {u.isActive !== false ? "Active" : "Inactive"}
                    </span>
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
