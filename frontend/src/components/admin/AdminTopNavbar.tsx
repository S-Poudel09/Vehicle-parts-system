// Abishek Tiwari: admin top bar — page title from AdminLayout, sign-out, notification badge
import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { BellIcon, ArrowRightOnRectangleIcon, CheckIcon, EnvelopeIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../context/AuthContext";
import API from "../../services/api";
import FeedbackPopup from "./FeedbackPopup";

type AdminTopNavbarProps = {
  title: string;
  subtitle?: string;
};

type NotificationItem = {
  id: number;
  type: string;
  message: string;
  createdAt: string;
};

export default function AdminTopNavbar({ title, subtitle }: AdminTopNavbarProps) {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [loadingReminders, setLoadingReminders] = useState(false);
  
  const [feedback, setFeedback] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "success" | "error";
  }>({
    open: false,
    title: "",
    message: "",
    variant: "success",
  });

  const dropdownRef = useRef<HTMLDivElement>(null);

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "AD";

  const loadNotifications = async () => {
    try {
      const res = await API.get<NotificationItem[]>("/notification");
      setNotifications(res.data);
    } catch (err) {
      console.error("Failed to load notifications", err);
    }
  };

  useEffect(() => {
    loadNotifications();
    const interval = setInterval(loadNotifications, 15000); // refresh every 15s
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSignOut = () => {
    localStorage.removeItem("token");
    signOut();
    navigate("/login");
  };

  const handleDismiss = async (id: number) => {
    try {
      await API.delete(`/notification/${id}`);
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    } catch {
      setFeedback({
        open: true,
        title: "Error",
        message: "Failed to dismiss notification.",
        variant: "error",
      });
    }
  };

  const handleSendReminders = async () => {
    setLoadingReminders(true);
    try {
      const res = await API.post<{ message: string }>("/notification/send-reminders");
      setFeedback({
        open: true,
        title: "Reminders Sent",
        message: res.data.message,
        variant: "success",
      });
      setDropdownOpen(false);
    } catch (err: any) {
      setFeedback({
        open: true,
        title: "Failed",
        message: err.response?.data?.message ?? "Failed to send email reminders.",
        variant: "error",
      });
    } finally {
      setLoadingReminders(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200/80 bg-white/70 px-7 backdrop-blur-xl">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">{title}</h2>
          {subtitle && (
            <p className="mt-0.5 text-sm text-slate-500">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Notifications Dropdown Shell */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="relative flex h-10 w-10 items-center justify-center rounded-xl text-slate-600 transition hover:bg-slate-100 hover:text-slate-900"
              aria-label="Notifications"
            >
              <BellIcon className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute top-1.5 right-1.5 flex h-4 min-w-4 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[0.65rem] font-bold text-white shadow-sm">
                  {notifications.length}
                </span>
              )}
            </button>

            {dropdownOpen && (
              <div className="absolute right-0 mt-2.5 w-80 origin-top-right rounded-2xl border border-slate-200 bg-white shadow-xl ring-1 ring-black/5 focus:outline-none">
                <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
                  <span className="text-sm font-bold text-slate-900">Notifications</span>
                  {notifications.length > 0 && (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[0.7rem] font-semibold text-slate-600">
                      {notifications.length} alerts
                    </span>
                  )}
                </div>

                <div className="max-h-64 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <div className="py-8 text-center text-xs text-slate-400">
                      No notifications or low stock alerts.
                    </div>
                  ) : (
                    <div className="divide-y divide-slate-100">
                      {notifications.map((n) => (
                        <div key={n.id} className="flex items-start gap-2.5 p-3.5 hover:bg-slate-50">
                          <div className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-amber-500" />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-slate-700 leading-normal">{n.message}</p>
                            <span className="mt-1 block text-[10px] text-slate-400">
                              {new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDismiss(n.id)}
                            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-emerald-600"
                            title="Dismiss Alert"
                          >
                            <CheckIcon className="h-4 w-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="border-t border-slate-100 bg-slate-50/50 p-2.5">
                  <button
                    type="button"
                    disabled={loadingReminders}
                    onClick={handleSendReminders}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 shadow-sm transition hover:bg-slate-50 hover:text-slate-900"
                  >
                    <EnvelopeIcon className="h-4 w-4 text-slate-500" />
                    {loadingReminders ? "Sending Reminders..." : "Send Credit Reminders (>1mo)"}
                  </button>
                </div>
              </div>
            )}
          </div>

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

      <FeedbackPopup
        open={feedback.open}
        title={feedback.title}
        message={feedback.message}
        variant={feedback.variant}
        onClose={() => setFeedback((prev) => ({ ...prev, open: false }))}
      />
    </>
  );
}
