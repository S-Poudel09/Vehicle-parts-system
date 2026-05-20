import {
  HomeIcon,
  CubeIcon,
  UsersIcon,
  UserGroupIcon,
  BuildingStorefrontIcon,
  ShoppingCartIcon,
  ChartBarIcon,
  CalendarDaysIcon,
  ClipboardDocumentListIcon,
  StarIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import type { SidebarSection } from "../layout/sidebarTypes";

export const adminSidebarSections: SidebarSection[] = [
  {
    label: "Dashboard & Actions",
    items: [
      { to: "/admin", icon: HomeIcon, label: "Overview", end: true },
      { to: "/admin/appointments", icon: CalendarDaysIcon, label: "Bookings Queue" },
      { to: "/admin/part-requests", icon: ClipboardDocumentListIcon, label: "Part Requests" },
      { to: "/admin/reviews", icon: StarIcon, label: "Customer Reviews" },
    ],
  },
  {
    label: "Inventory & Procurement",
    items: [
      { to: "/admin/parts", icon: CubeIcon, label: "Parts Catalog" },
      { to: "/admin/purchases", icon: ShoppingCartIcon, label: "Purchase Orders" },
      { to: "/admin/vendors", icon: BuildingStorefrontIcon, label: "Vendors (Suppliers)" },
    ],
  },
  {
    label: "Users & Security",
    items: [
      { to: "/admin/staff", icon: UserGroupIcon, label: "Staff Directory" },
      { to: "/admin/users", icon: UsersIcon, label: "All User Accounts" },
    ],
  },
  {
    label: "Analytics",
    items: [
      { to: "/admin/reports", icon: ChartBarIcon, label: "Financial Reports" },
      { to: "/admin/activity-logs", icon: DocumentTextIcon, label: "Activity Logs" },
    ],
  },
];
