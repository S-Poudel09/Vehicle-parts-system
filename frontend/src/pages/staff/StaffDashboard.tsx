import { useEffect, useState } from "react";
import type { ComponentType, SVGProps } from "react";
import { Link } from "react-router-dom";
import {
  UserPlusIcon,
  MagnifyingGlassIcon,
  CreditCardIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  ArrowRightIcon,
  UsersIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  UserGroupIcon,
  ArrowPathIcon,
  ExclamationTriangleIcon,
  PresentationChartLineIcon,
  DocumentTextIcon,
  ScaleIcon,
  WrenchScrewdriverIcon,
  BoltIcon,
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  ClockIcon,
  ReceiptPercentIcon,
  CubeIcon,
  HomeIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import { getStaffDashboard, type StaffDashboardData } from "../../api/staffDashboard";
import { formatMoney } from "../../utils/invoiceFormat";
import SimpleBarChart from "../../components/charts/SimpleBarChart";
import SimpleDonutChart from "../../components/charts/SimpleDonutChart";
import HorizontalBarChart from "../../components/charts/HorizontalBarChart";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

const formatShortMoney = (n: number) => {
  if (n >= 1_000_000) return `Rs ${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `Rs ${(n / 1_000).toFixed(1)}k`;
  return `Rs ${Math.round(n)}`;
};

function PanelHeader({
  title,
  icon: Icon,
  iconClassName = "text-slate-600 bg-slate-50 ring-slate-500/20",
}: {
  title: string;
  icon: HeroIcon;
  iconClassName?: string;
}) {
  return (
    <div className="flex items-center gap-2.5 border-b border-slate-100 px-6 py-4">
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ${iconClassName}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <h3 className="font-semibold text-slate-900">{title}</h3>
    </div>
  );
}

function SectionHeading({
  title,
  icon: Icon,
}: {
  title: string;
  icon: HeroIcon;
}) {
  return (
    <h2 className="mb-3 flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-500">
      <Icon className="h-4 w-4 text-slate-400" />
      {title}
    </h2>
  );
}

export default function StaffDashboard() {
  const { user } = useAuth();
  const [data, setData] = useState<StaffDashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    setError("");
    getStaffDashboard()
      .then(setData)
      .catch(() => setError("Could not load dashboard stats. Ensure the API is running."))
      .finally(() => setLoading(false));
  }, []);

  const quickActions = [
    {
      to: "/staff/register-customer",
      icon: UserPlusIcon,
      title: "Register Customer",
      desc: "Add customer with vehicle details",
      color: "text-blue-600 bg-blue-50 ring-blue-500/20",
    },
    {
      to: "/staff/search-customer",
      icon: MagnifyingGlassIcon,
      title: "Customer Details",
      desc: "Search customers and view or edit profiles",
      color: "text-indigo-600 bg-indigo-50 ring-indigo-500/20",
    },
    {
      to: "/staff/sell-parts",
      icon: ShoppingCartIcon,
      title: "Sell Parts",
      desc: "Create sales invoice for customer purchase",
      color: "text-emerald-600 bg-emerald-50 ring-emerald-500/20",
    },
    {
      to: "/staff/reports",
      icon: ChartBarIcon,
      title: "Customer Reports",
      desc: "Regulars, high spenders, and pending credits",
      color: "text-violet-600 bg-violet-50 ring-violet-500/20",
    },
    {
      to: "/staff/pending-credits",
      icon: CreditCardIcon,
      title: "Pending Credits",
      desc: "View customers with pending payments",
      color: "text-amber-600 bg-amber-50 ring-amber-500/20",
    },
  ];

  const summary = data?.summary;
  const statCards = summary
    ? [
        {
          label: "Today's Sales",
          value: formatMoney(summary.salesTodayRevenue),
          subText: `${summary.salesTodayCount} invoice${summary.salesTodayCount === 1 ? "" : "s"} today`,
          icon: ArrowTrendingUpIcon,
          color: "text-emerald-600 bg-emerald-50 ring-emerald-500/20",
        },
        {
          label: "Monthly Revenue",
          value: formatMoney(summary.salesMonthRevenue),
          subText: `${summary.salesMonthCount} sales this month`,
          icon: BanknotesIcon,
          color: "text-teal-700 bg-teal-50 ring-teal-500/20",
        },
        {
          label: "Pending Credits",
          value: formatMoney(summary.pendingCreditsAmount),
          subText: `${summary.pendingCreditsCount} unpaid invoice${summary.pendingCreditsCount === 1 ? "" : "s"}`,
          icon: CreditCardIcon,
          color: "text-amber-700 bg-amber-50 ring-amber-500/20",
        },
        {
          label: "Customers",
          value: `${summary.totalCustomers}`,
          subText: `${summary.regularCustomersCount} regular (2+ purchases)`,
          icon: UsersIcon,
          color: "text-blue-600 bg-blue-50 ring-blue-500/20",
        },
        {
          label: "Bookings Queue",
          value: `${summary.pendingAppointments} pending`,
          subText: `${summary.confirmedAppointments} confirmed`,
          icon: CalendarDaysIcon,
          color: "text-indigo-700 bg-indigo-50 ring-indigo-500/20",
        },
        {
          label: "Regular Customers",
          value: `${summary.regularCustomersCount}`,
          subText: "Customers with 2 or more purchases",
          icon: UserGroupIcon,
          color: "text-violet-700 bg-violet-50 ring-violet-500/20",
        },
      ]
    : [];

  const salesLabels = data?.salesLast7Days.map((d) => d.label) ?? [];
  const salesRevenue = data?.salesLast7Days.map((d) => d.revenue) ?? [];
  const salesCounts = data?.salesLast7Days.map((d) => d.count) ?? [];

  const payment = data?.paymentBreakdown;
  const topParts = data?.topPartsThisMonth ?? [];

  return (
    <>
      <div className="mb-7 flex items-start gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-slate-900 text-white shadow-md">
          <HomeIcon className="h-6 w-6" />
        </div>
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">
            Welcome back, {user?.name?.split(" ")[0] ?? "Staff"}
          </h1>
          <p className="mt-1.5 text-slate-500">
            Sales performance, credits, bookings, and quick actions for the counter.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 flex-col items-center justify-center gap-3">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-teal-600" />
          <p className="text-sm font-medium text-slate-500">Loading dashboard…</p>
        </div>
      ) : error ? (
        <div className="flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-5 py-4 text-sm text-rose-800">
          <ExclamationTriangleIcon className="mt-0.5 h-5 w-5 shrink-0 text-rose-600" />
          <p>{error}</p>
        </div>
      ) : (
        <div className="space-y-6">
          <div>
            <SectionHeading title="Today & Month" icon={PresentationChartLineIcon} />
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {statCards.map((stat) => {
                const Icon = stat.icon;
                return (
                  <div
                    key={stat.label}
                    className="overflow-hidden rounded-2xl border border-slate-200/75 bg-white p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.02)] transition-all hover:shadow-md"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                        {stat.label}
                      </p>
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ring-1 ring-inset ${stat.color}`}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                    </div>
                    <p className="truncate text-xl font-bold tracking-tight text-slate-900">
                      {stat.value}
                    </p>
                    <p className="mt-2 text-xs font-medium text-slate-400">{stat.subText}</p>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <SectionHeading title="Charts & Trends" icon={ChartBarIcon} />
            <div className="grid gap-6 lg:grid-cols-2">
              <SimpleBarChart
                title="Sales revenue (last 7 days)"
                subtitle="Daily invoice totals in Rs"
                labels={salesLabels}
                values={salesRevenue}
                valueFormatter={formatShortMoney}
                barColor="#0d9488"
                icon={BanknotesIcon}
                iconClassName="text-teal-700 bg-teal-50 ring-teal-500/20"
              />
              <SimpleBarChart
                title="Invoice count (last 7 days)"
                subtitle="Number of sales per day"
                labels={salesLabels}
                values={salesCounts}
                valueFormatter={(n) => `${Math.round(n)}`}
                barColor="#4f46e5"
                icon={DocumentTextIcon}
                iconClassName="text-indigo-700 bg-indigo-50 ring-indigo-500/20"
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {payment && (
              <SimpleDonutChart
                title="Payment status (this month)"
                subtitle="Paid vs pending invoice amounts"
                centerLabel="Invoices"
                valueFormatter={formatShortMoney}
                icon={ScaleIcon}
                iconClassName="text-slate-700 bg-slate-50 ring-slate-500/20"
                segments={[
                  {
                    label: "Paid",
                    value: payment.paidAmount,
                    color: "#10b981",
                    icon: CheckCircleIcon,
                  },
                  {
                    label: "Pending",
                    value: payment.pendingAmount,
                    color: "#f59e0b",
                    icon: ClockIcon,
                  },
                ]}
              />
            )}
            <HorizontalBarChart
              title="Top parts sold (this month)"
              subtitle="By quantity sold"
              labels={topParts.map((p) => p.partName)}
              values={topParts.map((p) => p.quantitySold)}
              valueFormatter={(n) => `${n} units`}
              icon={WrenchScrewdriverIcon}
              iconClassName="text-amber-700 bg-amber-50 ring-amber-500/20"
            />
          </div>

          <div className="grid gap-5 lg:grid-cols-5">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm lg:col-span-3">
              <PanelHeader
                title="Quick Actions"
                icon={BoltIcon}
                iconClassName="text-amber-700 bg-amber-50 ring-amber-500/20"
              />
              <div className="space-y-2 p-4">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <Link
                      key={action.to}
                      to={action.to}
                      className="group flex items-center gap-4 rounded-xl border border-transparent bg-slate-50 px-4 py-3.5 transition hover:translate-x-1 hover:border-slate-200 hover:bg-white hover:shadow-sm"
                    >
                      <div
                        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ring-inset transition-colors group-hover:scale-105 ${action.color}`}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
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
              <PanelHeader
                title="Payment summary"
                icon={ClipboardDocumentListIcon}
                iconClassName="text-teal-700 bg-teal-50 ring-teal-500/20"
              />
              <div className="space-y-0 p-4">
                {payment && (
                  <>
                    <SummaryRow
                      icon={CheckCircleIcon}
                      iconClassName="text-emerald-600 bg-emerald-50 ring-emerald-500/20"
                      label="Paid this month"
                      value={`${payment.paidCount} invoices · ${formatMoney(payment.paidAmount)}`}
                    />
                    <SummaryRow
                      icon={CreditCardIcon}
                      iconClassName="text-amber-600 bg-amber-50 ring-amber-500/20"
                      label="Pending credits"
                      value={`${payment.pendingCount} invoices · ${formatMoney(payment.pendingAmount)}`}
                    />
                    <SummaryRow
                      icon={ReceiptPercentIcon}
                      iconClassName="text-teal-600 bg-teal-50 ring-teal-500/20"
                      label="7-day sales total"
                      value={formatMoney(salesRevenue.reduce((a, b) => a + b, 0))}
                    />
                    <SummaryRow
                      icon={CubeIcon}
                      iconClassName="text-indigo-600 bg-indigo-50 ring-indigo-500/20"
                      label="7-day invoice count"
                      value={`${salesCounts.reduce((a, b) => a + b, 0)} sales`}
                    />
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function SummaryRow({
  label,
  value,
  icon: Icon,
  iconClassName,
}: {
  label: string;
  value: string;
  icon: HeroIcon;
  iconClassName: string;
}) {
  return (
    <div className="flex gap-3.5 border-b border-slate-100 py-3.5 last:border-0">
      <div
        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ring-1 ring-inset ${iconClassName}`}
      >
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-slate-500">{label}</p>
        <p className="text-sm font-medium text-slate-800">{value}</p>
      </div>
    </div>
  );
}

