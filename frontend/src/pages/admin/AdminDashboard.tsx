// Abishek Tiwari: admin overview — live stats, notifications/warnings, and action center
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  UsersIcon,
  UserGroupIcon,
  ArrowRightIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  BellIcon,
  WrenchScrewdriverIcon,
  ShoppingBagIcon,
  ExclamationTriangleIcon,
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

type NotificationRow = {
  id: number;
  type: string;
  message: string;
  createdAt: string;
};

const formatMoney = (n: number) =>
  `Rs ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export default function AdminDashboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [notifications, setNotifications] = useState<NotificationRow[]>([]);
  const [financeSummary, setFinanceSummary] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      API.get<UserRow[]>("/users").catch(() => ({ data: [] })),
      API.get<NotificationRow[]>("/notification").catch(() => ({ data: [] })),
      API.get<any>("/reports/finance?period=monthly").catch(() => ({ data: null })),
    ])
      .then(([usersRes, notifRes, financeRes]) => {
        setUsers(usersRes.data);
        setNotifications(notifRes.data);
        if (financeRes.data) {
          setFinanceSummary(financeRes.data.summary);
        }
      })
      .finally(() => setLoading(false));
  }, []);

  const staffCount = users.filter((u) => u.role === "Staff").length;
  const customerCount = users.filter((u) => u.role === "Customer").length;
  const activeStaff = users.filter((u) => u.role === "Staff" && u.isActive).length;

  const totalSales = financeSummary?.totalSalesRevenue ?? 0;
  const totalCost = financeSummary?.totalPurchasesCost ?? 0;
  const netProfit = totalSales - totalCost;

  const stats = [
    {
      label: "Monthly Revenue",
      value: formatMoney(totalSales),
      icon: ArrowTrendingUpIcon,
      subText: `${financeSummary?.totalSalesCount ?? 0} sales invoices`,
      color: "text-emerald-600 bg-emerald-50 ring-emerald-500/20",
    },
    {
      label: "Purchase Expenses",
      value: formatMoney(totalCost),
      icon: ArrowTrendingDownIcon,
      subText: `${financeSummary?.totalPurchasesCount ?? 0} vendor orders`,
      color: "text-rose-600 bg-rose-50 ring-rose-500/20",
    },
    {
      label: "Net Margin",
      value: formatMoney(netProfit),
      icon: BanknotesIcon,
      subText: netProfit >= 0 ? "Operating Surplus" : "Operating Deficit",
      color: netProfit >= 0 ? "text-emerald-600 bg-emerald-50 ring-emerald-500/20" : "text-rose-600 bg-rose-50 ring-rose-500/20",
    },
    {
      label: "System Directory",
      value: `${users.length} Users`,
      icon: UsersIcon,
      subText: `${staffCount} Staff | ${customerCount} Cust.`,
      color: "text-blue-600 bg-blue-50 ring-blue-500/20",
    },
  ];

  const quickActions = [
    {
      to: "/admin/parts",
      icon: WrenchScrewdriverIcon,
      title: "Inventory Catalog",
      desc: "Monitor stock and edit vehicle parts",
    },
    {
      to: "/admin/purchases",
      icon: ShoppingBagIcon,
      title: "Purchase Log",
      desc: "Log historical supplier transactions",
    },
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
          Here&apos;s a quick overview of the GadiParts system status today.
        </p>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm font-medium text-slate-500">Retrieving overview data...</div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Stats Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat) => {
              const Icon = stat.icon;
              return (
                <div
                  key={stat.label}
                  className="group relative overflow-hidden rounded-2xl border border-slate-200/75 bg-white p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.02)] transition-all hover:shadow-md"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{stat.label}</p>
                    <div className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ${stat.color}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                  </div>
                  <p className="text-xl font-bold tracking-tight text-slate-900 truncate">
                    {stat.value}
                  </p>
                  <p className="mt-2 text-xs font-medium text-slate-400">{stat.subText}</p>
                </div>
              );
            })}
          </div>

          <div className="grid gap-6 lg:grid-cols-5">
            {/* Quick Actions & System Notifications */}
            <div className="space-y-6 lg:col-span-3">
              {/* Quick Actions */}
              <div className="rounded-2xl border border-slate-200/75 bg-white shadow-[0_1px_3px_0_rgb(0,0,0,0.02)] overflow-hidden">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h3 className="font-bold text-slate-900 text-sm">Quick Actions</h3>
                </div>
                <div className="grid gap-3 p-4 sm:grid-cols-3">
                  {quickActions.map((action) => {
                    const Icon = action.icon;
                    return (
                      <Link
                        key={action.to}
                        to={action.to}
                        className="group flex flex-col justify-between rounded-xl border border-slate-100 bg-slate-50 p-4 transition-all hover:border-slate-300 hover:bg-white hover:shadow-sm"
                      >
                        <div className="mb-4 flex h-8 w-8 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-100 text-slate-600 transition-colors group-hover:bg-slate-950 group-hover:text-white">
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-950 text-xs flex items-center gap-1">
                            {action.title}
                            <ArrowRightIcon className="h-3 w-3 text-slate-400 transition-transform group-hover:translate-x-0.5 group-hover:text-slate-950" />
                          </p>
                          <p className="text-[10px] text-slate-400 mt-0.5">{action.desc}</p>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>

              {/* Notifications / Alerts warnings */}
              <div className="rounded-2xl border border-slate-200/75 bg-white shadow-[0_1px_3px_0_rgb(0,0,0,0.02)] overflow-hidden">
                <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                    <BellIcon className="h-4 w-4 text-slate-500" />
                    Inventory & Overdue Credit Warnings
                  </h3>
                  {notifications.length > 0 && (
                    <span className="text-[10px] font-bold bg-amber-50 text-amber-700 ring-1 ring-amber-600/20 px-2 py-0.5 rounded-full">
                      {notifications.length} Action Needed
                    </span>
                  )}
                </div>
                <div className="divide-y divide-slate-100 max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-450">
                      All inventory stock levels and accounts are normal.
                    </p>
                  ) : (
                    notifications.map((notif) => (
                      <div key={notif.id} className="flex gap-3 p-4 hover:bg-slate-50/30 transition-colors">
                        <div className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-amber-50 text-amber-600 ring-1 ring-amber-500/20">
                          <ExclamationTriangleIcon className="h-3.5 w-3.5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs text-slate-700 font-medium leading-relaxed">{notif.message}</p>
                          <time className="text-[10px] text-slate-400 mt-1 block">
                            {new Date(notif.createdAt).toLocaleDateString(undefined, {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </time>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>

            {/* Active Staff list & System Directory breakdown */}
            <div className="rounded-2xl border border-slate-200/75 bg-white shadow-[0_1px_3px_0_rgb(0,0,0,0.02)] overflow-hidden lg:col-span-2 flex flex-col justify-between">
              <div>
                <div className="border-b border-slate-100 px-6 py-4">
                  <h3 className="font-bold text-slate-900 text-sm">Active Staff Members</h3>
                </div>
                <div className="divide-y divide-slate-100 max-h-[350px] overflow-y-auto">
                  {users.filter(u => u.role === "Staff").length === 0 ? (
                    <p className="py-8 text-center text-xs text-slate-450">No staff registered in the directory.</p>
                  ) : (
                    users.filter(u => u.role === "Staff").map((staff) => (
                      <div key={staff.id} className="flex items-center justify-between p-4 hover:bg-slate-50/30 transition-colors">
                        <div className="min-w-0">
                          <p className="text-xs font-bold text-slate-900 truncate">{staff.name}</p>
                          <p className="text-[10px] text-slate-450 truncate mt-0.5">{staff.email}</p>
                        </div>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ring-1 ring-inset ${
                            staff.isActive
                              ? "bg-emerald-50 text-emerald-700 ring-emerald-600/20"
                              : "bg-slate-150 text-slate-500 ring-slate-200"
                          }`}
                        >
                          {staff.isActive ? "Active" : "Suspended"}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div className="border-t border-slate-100 p-4 bg-slate-50/50">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-550 font-medium">Customer accounts registered:</span>
                  <span className="font-bold text-slate-900 bg-white ring-1 ring-slate-200/75 px-2.5 py-1 rounded-lg">
                    {customerCount} Accounts
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
