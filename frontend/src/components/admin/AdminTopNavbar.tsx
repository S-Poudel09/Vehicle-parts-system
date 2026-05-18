// Abishek Tiwari: admin top bar — page title from AdminLayout, sign-out, notification badge
import { useNavigate } from "react-router-dom";
import { BellIcon, ArrowRightOnRectangleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";

type AdminTopNavbarProps = {
  title: string;
  subtitle?: string;
};

export default function AdminTopNavbar({ title, subtitle }: AdminTopNavbarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "AD";

  const handleSignOut = () => {
    localStorage.removeItem("token");
    signOut();
    navigate("/login");
  };

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/70 px-7 backdrop-blur-xl">
      <div>
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
        {subtitle && (
          <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
          aria-label="Notifications"
        >
          <BellIcon className="h-5 w-5" />
          <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[0.65rem] font-bold text-white shadow-sm">
            3
          </span>
        </button>

        <div className="mx-2 h-7 w-px bg-slate-200" />

        <div className="flex items-center gap-2.5 rounded-full border border-slate-200 bg-white py-1.5 pr-3 pl-1.5 shadow-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-slate-700 to-slate-900 text-xs font-bold text-white">
            {initials}
          </div>
          <div className="hidden text-left sm:block">
            <p className="text-sm font-semibold leading-tight text-slate-900">
              {user?.name ?? "Admin"}
            </p>
            <p className="text-xs text-slate-500">{user?.email ?? "admin@gmail.com"}</p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSignOut}
          className="ml-1 flex items-center gap-1.5 rounded-xl px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-red-50 hover:text-red-600"
          title="Sign out"
        >
          <ArrowRightOnRectangleIcon className="h-4 w-4" />
          <span className="hidden md:inline">Sign out</span>
        </button>
      </div>
    </header>
  );
}
