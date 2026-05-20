import { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  ChevronDoubleLeftIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/outline";
import type { AppSidebarProps } from "./sidebarTypes";

const linkBase =
  "group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium text-white/65 transition-all duration-200 hover:translate-x-0.5 hover:bg-white/10 hover:text-white";
const linkActive =
  "bg-gradient-to-r from-slate-500/25 to-slate-400/10 text-white shadow-[inset_0_0_0_1px_rgba(148,163,184,0.3)] before:absolute before:left-0 before:top-1/2 before:h-[60%] before:w-[3px] before:-translate-y-1/2 before:rounded-r before:bg-gradient-to-b before:from-slate-300 before:to-slate-500 before:shadow-[0_0_10px_rgba(148,163,184,0.5)]";

export default function AppSidebar({
  collapsed,
  onToggle,
  title,
  collapsedTitle,
  logoSrc = "/logo.png",
  collapsedLogoSrc = "/logo-collapsed.png",
  sections,
  footer,
}: AppSidebarProps) {
  const [logoError, setLogoError] = useState(false);
  const [collapsedLogoError, setCollapsedLogoError] = useState(false);

  return (
    <aside
      className={`fixed top-0 left-0 z-50 flex h-screen flex-col border-r border-white/5 bg-gradient-to-b from-navy-950 via-navy-900 to-navy-800 shadow-[4px_0_32px_rgba(10,22,40,0.25)] transition-[width] duration-300 ease-out ${
        collapsed ? "w-[72px]" : "w-[260px]"
      }`}
    >
      <div className="flex min-h-[72px] items-center border-b border-white/10 px-5 py-4">
        {!collapsed ? (
          <div className="flex items-center gap-3 overflow-hidden">
            {!logoError ? (
              <img
                src={logoSrc}
                alt=""
                onError={() => setLogoError(true)}
                className="h-11 max-w-[80px] shrink-0 rounded-lg object-contain"
              />
            ) : (
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-white/10 text-xs font-bold text-white">
                {title.charAt(0)}
              </div>
            )}
            <h1 className="truncate text-xs font-black uppercase tracking-widest text-white">
              {title}
            </h1>
          </div>
        ) : (
          <div className="flex w-full items-center justify-center">
            {!collapsedLogoError ? (
              <img
                src={collapsedLogoSrc}
                alt={collapsedTitle ?? title}
                onError={() => setCollapsedLogoError(true)}
                className="h-10 w-10 rounded-lg object-contain"
              />
            ) : (
              <h1 className="text-sm font-extrabold uppercase tracking-widest text-white">
                {collapsedTitle ?? title.charAt(0)}
              </h1>
            )}
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
        {footer}
        <button
          type="button"
          onClick={onToggle}
          className={`btn-sidebar-ghost !bg-white/5 hover:!bg-white/10 appearance-none !border-0 !shadow-none ${
            footer ? "mt-2" : ""
          }`}
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

