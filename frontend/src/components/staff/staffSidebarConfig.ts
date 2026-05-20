import {
  HomeIcon,
  UserPlusIcon,
  MagnifyingGlassIcon,
  ShoppingCartIcon,
  BanknotesIcon,
  CalendarDaysIcon,
  ChartBarIcon,
} from "@heroicons/react/24/outline";
import type { SidebarSection } from "../layout/sidebarTypes";

export const staffSidebarSections: SidebarSection[] = [
  {
    label: "Dashboard",
    items: [{ to: "/staff", icon: HomeIcon, label: "Overview", end: true }],
  },
  {
    label: "Customers",
    items: [
      {
        to: "/staff/register-customer",
        icon: UserPlusIcon,
        label: "Register Customer",
      },
      {
        to: "/staff/search-customer",
        icon: MagnifyingGlassIcon,
        label: "Customer Details",
      },
    ],
  },
  {
    label: "Sales",
    items: [
      { to: "/staff/sell-parts", icon: ShoppingCartIcon, label: "Sell Parts" },
      {
        to: "/staff/pending-credits",
        icon: BanknotesIcon,
        label: "Pending Credits",
      },
    ],
  },
  {
    label: "Operations",
    items: [
      {
        to: "/staff/appointments",
        icon: CalendarDaysIcon,
        label: "Bookings Queue",
      },
    ],
  },
  {
    label: "Reports",
    items: [
      {
        to: "/staff/reports",
        icon: ChartBarIcon,
        label: "Customer Reports",
      },
    ],
  },
];
