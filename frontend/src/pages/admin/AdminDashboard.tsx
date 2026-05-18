// Abishek Tiwari: admin overview — user stats from GET /users, quick links to staff
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  UsersIcon,
  UserGroupIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";

type UserRow = {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);

  useEffect(() => {
    API.get<UserRow[]>("/users")
      .then((res) => setUsers(res.data))
      .catch(() => setUsers([]));
  }, []);

  const staffCount = users.filter((u) => u.role === "Staff").length;
  const customerCount = users.filter((u) => u.role === "Customer").length;
  const activeStaff = users.filter(
    (u) => u.role === "Staff" && u.isActive
  ).length;

  const stats = [
    {
      label: "Total Users",
      value: users.length,
      icon: UsersIcon,
      trend: "All roles",
    },
    {
      label: "Staff Members",
      value: staffCount,
      icon: UserGroupIcon,
      trend: `${activeStaff} active`,
    },
    {
      label: "Customers",
      value: customerCount,
      icon: UsersIcon,
      trend: "Registered accounts",
    },
  ];

  const quickActions = [
    {
      to: "/admin/staff",
      icon: UserGroupIcon,
      title: "Manage Staff",
      desc: "Add or deactivate staff accounts",
    },
  ];

  return (
    <>
      <div className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Welcome back, {user?.name?.split(" ")[0] ?? "Admin"}
        </h1>
        <p className="mt-1.5 text-slate-500">
          Here&apos;s what&apos;s happening across GadiParts today.
        </p>
      </div>

      <div className="mb-7 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.label}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <div className="absolute inset-x-0 top-0 h-0.5 bg-gradient-to-r from-slate-700 to-slate-500 opacity-0 transition group-hover:opacity-100" />
              <div className="mb-4 flex items-start justify-between">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
                  <Icon className="h-6 w-6" />
                </div>
                <ArrowTrendingUpIcon className="h-4 w-4 text-emerald-500/60" />
              </div>
              <p className="text-3xl font-bold tracking-tight text-slate-900">
                {stat.value}
              </p>
              <p className="mt-1 text-sm font-medium text-slate-500">{stat.label}</p>
              <p className="mt-2 text-xs font-semibold text-emerald-600">{stat.trend}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-5">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-semibold text-slate-900">Quick Actions</h3>
          </div>
          <div className="space-y-2 p-4">
            {quickActions.map((action) => {
              const Icon = action.icon;
              return (
                <Link
                  key={action.to}
                  to={action.to}
                  className="group flex items-center gap-4 rounded-xl border border-transparent bg-slate-50 px-4 py-3.5 transition hover:translate-x-1 hover:border-slate-200 hover:bg-white hover:shadow-sm"
                >
                  <Icon className="h-5 w-5 text-slate-600" />
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-900">{action.title}</p>
                    <p className="text-sm text-slate-500">{action.desc}</p>
                  </div>
                  <ArrowRightIcon className="h-5 w-5 text-slate-300 transition group-hover:text-slate-700" />
                </Link>
              );
            })}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-2">
          <div className="border-b border-slate-100 px-6 py-4">
            <h3 className="font-semibold text-slate-900">Recent Activity</h3>
          </div>
          <div className="space-y-0 p-4">
            {staffCount === 0 && customerCount === 0 ? (
              <p className="py-6 text-center text-sm text-slate-500">
                No activity yet. Add staff or register customers to see updates here.
              </p>
            ) : (
              <>
                {staffCount > 0 && (
                  <ActivityItem
                    text={`${staffCount} staff account(s) in the system`}
                    time="Current"
                  />
                )}
                {customerCount > 0 && (
                  <ActivityItem
                    text={`${customerCount} customer account(s) registered`}
                    time="Current"
                  />
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

function ActivityItem({ text, time }: { text: string; time: string }) {
  return (
    <div className="flex gap-3.5 border-b border-slate-100 py-3.5 last:border-0">
      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-600 shadow-[0_0_0_3px_rgba(100,116,139,0.25)]" />
      <div>
        <p className="text-sm text-slate-700">{text}</p>
        <time className="text-xs text-slate-400">{time}</time>
      </div>
    </div>
  );
}
