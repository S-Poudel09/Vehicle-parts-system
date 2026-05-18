// Abishek Tiwari: collapsible navy sidebar — Heroicons nav, Overview + Staff + All Users
import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  UsersIcon,
  UserGroupIcon,
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
  WrenchScrewdriverIcon,
} from "@heroicons/react/24/outline";
import type { ComponentType, SVGProps } from "react";

type AdminSidebarProps = {
  collapsed: boolean;
  onToggle: () => void;
};

type NavItem = {
  to: string;
  icon: ComponentType<SVGProps<SVGSVGElement>>;
  label: string;
  end?: boolean;
};

const sections: { label: string; items: NavItem[] }[] = [
  {
    label: "Dashboard",
    items: [{ to: "/admin", icon: HomeIcon, label: "Overview", end: true }],
  },
  {
    label: "Management",
    /* Abishek Tiwari: staff CRUD + read-only all-users list */
    items: [
      { to: "/admin/staff", icon: UserGroupIcon, label: "Staff" },
      { to: "/admin/users", icon: UsersIcon, label: "All Users" },
    ],
  },
];

const linkBase =
  "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/65 transition-all duration-200 hover:translate-x-0.5 hover:bg-white/10 hover:text-white";
const linkActive =
  "bg-gradient-to-r from-slate-500/25 to-slate-400/10 text-white shadow-[inset_0_0_0_1px_rgba(148,163,184,0.3)] before:absolute before:left-0 before:top-1/2 before:h-[60%] before:w-[3px] before:-translate-y-1/2 before:rounded-r before:bg-gradient-to-b before:from-slate-300 before:to-slate-500 before:shadow-[0_0_10px_rgba(148,163,184,0.5)]";

export default function AdminSidebar({ collapsed, onToggle }: AdminSidebarProps) {
  return (
    <aside
      className={`fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-white/5 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-800 shadow-[4px_0_32px_rgba(10,22,40,0.25)] transition-[width] duration-300 ease-out ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      <div className="flex min-h-[72px] items-center gap-3 border-b border-white/10 px-4 py-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-slate-600 to-slate-800 text-white shadow-lg shadow-slate-900/40">
          <WrenchScrewdriverIcon className="h-5 w-5" />
        </div>
        {!collapsed && (
          <div className="min-w-0 overflow-hidden">
            <h1 className="truncate text-base font-bold tracking-tight text-white">
              GadiParts
            </h1>
            <span className="text-[0.65rem] font-semibold uppercase tracking-widest text-white/45">
              Admin Console
            </span>
          </div>
        )}
      </div>

      <nav className="flex-1 overflow-x-hidden overflow-y-auto px-3 py-4">
        {sections.map((section) => (
          <div key={section.label} className="mb-6">
            {!collapsed && (
              <p className="mb-2 px-3 text-[0.65rem] font-semibold uppercase tracking-widest text-white/35">
                {section.label}
              </p>
            )}
            {section.items.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.end}
                  title={collapsed ? item.label : undefined}
                  className={({ isActive }) =>
                    `${linkBase} ${collapsed ? "justify-center px-3" : ""} ${
                      isActive ? linkActive : ""
                    }`
                  }
                >
                  <Icon className="h-5 w-5 shrink-0 opacity-85 transition-transform group-hover:scale-110" />
                  {!collapsed && <span className="truncate">{item.label}</span>}
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="border-t border-white/10 p-3">
        {/* Abishek Tiwari: !bg-white/5 — keeps subtle ghost style; App.css staff button rule no longer overrides this */}
        <button
          type="button"
          onClick={onToggle}
          className="btn-sidebar-ghost !bg-white/5 hover:!bg-white/10 appearance-none !border-0 !shadow-none"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronDoubleRightIcon className="h-5 w-5" />
          ) : (
            <>
              <ChevronDoubleLeftIcon className="h-5 w-5" />
              <span>Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
