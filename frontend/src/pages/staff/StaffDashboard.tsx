import { Link } from "react-router-dom";
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  CreditCardIcon,
  ShoppingCartIcon,
  ClockIcon,
  ChartBarIcon,
  ArrowRightIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";

export default function StaffDashboard() {
  const { user } = useAuth();

  const quickActions = [
    {
      to: "/staff/register-customer",
      icon: UserPlusIcon,
      title: "Register Customer",
      desc: "Add customer with vehicle details",
    },
    {
      to: "/staff/search-customer",
      icon: MagnifyingGlassIcon,
      title: "Customer Details",
      desc: "Search customers and view or edit profiles",
    },
    {
      to: "/staff/sell-parts",
      icon: ShoppingCartIcon,
      title: "Sell Parts",
      desc: "Create sales invoice for customer purchase",
    },
    {
      to: "/staff/reports",
      icon: ChartBarIcon,
      title: "Customer Reports",
      desc: "Regulars, high spenders, and pending credits",
    },
    {
      to: "/staff/customer-history",
      icon: ClockIcon,
      title: "Customer History",
      desc: "View customer vehicles and sales records",
    },
    {
      to: "/staff/pending-credits",
      icon: CreditCardIcon,
      title: "Pending Credits",
      desc: "View customers with pending payments",
    },
  ];

  return (
    <>
      <div className="mb-7">
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">
          Welcome back, {user?.name?.split(" ")[0] ?? "Staff"}
        </h1>
        <p className="mt-1.5 text-slate-500">
          Manage customers, sales invoices, reports, and vehicle records.
        </p>
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
                    <p className="font-semibold text-slate-900">
                      {action.title}
                    </p>
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
            <h3 className="font-semibold text-slate-900">Staff Tasks</h3>
          </div>

          <div className="space-y-0 p-4">
            <ActivityItem text="Register new customers with vehicle details" />
            <ActivityItem text="Search customers and verify records" />
            <ActivityItem text="Create sales invoices for sold parts" />
            <ActivityItem text="Run customer reports (regulars, spenders, credits)" />
            <ActivityItem text="Review pending credit payments" />
          </div>
        </div>
      </div>
    </>
  );
}

function ActivityItem({ text }: { text: string }) {
  return (
    <div className="flex gap-3.5 border-b border-slate-100 py-3.5 last:border-0">
      <div className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-slate-600 shadow-[0_0_0_3px_rgba(100,116,139,0.25)]" />
      <p className="text-sm text-slate-700">{text}</p>
    </div>
  );
}
