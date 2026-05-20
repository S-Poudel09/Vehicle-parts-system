import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import StaffSidebar from "../components/staff/StaffSidebar";
import AdminTopNavbar from "../components/admin/AdminTopNavbar";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/staff": {
    title: "Staff Dashboard",
    subtitle: "Overview of daily counter and workshop tasks",
  },
  "/staff/register-customer": {
    title: "Register Customer",
    subtitle: "Add a new customer and vehicle records",
  },
  "/staff/search-customer": {
    title: "Customer Details",
    subtitle: "Search customers and manage profiles",
  },
  "/staff/sell-parts": {
    title: "Sell Parts",
    subtitle: "Create sales invoices and email customers",
  },
  "/staff/pending-credits": {
    title: "Pending Credits",
    subtitle: "Customers with outstanding balances",
  },
  "/staff/appointments": {
    title: "Bookings Queue",
    subtitle: "View and manage service appointments",
  },
  "/staff/reports": {
    title: "Customer Reports",
    subtitle: "Regular customers, high spenders, and pending credits",
  },
};

function resolvePageMeta(pathname: string) {
  if (pageMeta[pathname]) return pageMeta[pathname];

  if (pathname.startsWith("/staff/customers/")) {
    return {
      title: "Customer Profile",
      subtitle: "View purchase history and update customer details",
    };
  }

  const prefix = Object.entries(pageMeta)
    .filter(([path]) => path !== "/staff")
    .find(([path]) => pathname.startsWith(path));

  return prefix?.[1] ?? pageMeta["/staff"];
}

export default function StaffLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const meta = resolvePageMeta(location.pathname);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/80 to-slate-100 font-sans">
      <StaffSidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((c) => !c)}
      />
      <main
        className={`min-h-screen transition-[margin-left] duration-300 ease-out ${
          collapsed ? "ml-[72px]" : "ml-[260px]"
        }`}
      >
        <AdminTopNavbar title={meta.title} subtitle={meta.subtitle} />
        <div className="p-7">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
