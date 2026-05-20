// Abishek Tiwari: admin shell — collapsible sidebar + top navbar + nested route outlet
import { useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import AdminSidebar from "../components/admin/AdminSidebar";
import AdminTopNavbar from "../components/admin/AdminTopNavbar";

const pageMeta: Record<string, { title: string; subtitle: string }> = {
  "/admin": {
    title: "Dashboard",
    subtitle: "Overview of your vehicle parts operations",
  },
  "/admin/parts": {
    title: "Parts",
    subtitle: "Define part master data — stock starts at zero",
  },
  "/admin/purchases": {
    title: "Purchases",
    subtitle: "Buy stock from vendors and view purchase history",
  },
  "/admin/staff": {
    title: "Staff Management",
    subtitle: "Create, deactivate, and manage staff accounts",
  },
  "/admin/users": {
    title: "All Users",
    subtitle: "View every registered account across all roles",
  },
  "/admin/vendors": {
    title: "Vendors",
    subtitle: "Create, edit, and remove supplier records",
  },
  "/admin/reports": {
    title: "Financial Reports",
    subtitle: "Daily, monthly, and yearly business summaries",
  },
  "/admin/part-requests": {
    title: "Part Requests",
    subtitle: "Review, approve, and track custom out-of-stock requests",
  },
  "/admin/appointments": {
    title: "Bookings Queue",
    subtitle: "Monitor workshop occupancy and schedule bay bookings",
  },
  "/admin/reviews": {
    title: "Customer Reviews",
    subtitle: "Evaluate customer feedback and moderate testimonials",
  },
};


export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const meta =
    pageMeta[location.pathname] ??
    Object.entries(pageMeta).find(
      ([path]) => location.pathname.startsWith(path) && path !== "/admin"
    )?.[1] ??
    pageMeta["/admin"];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100/80 to-slate-100 font-sans">
      <AdminSidebar
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
