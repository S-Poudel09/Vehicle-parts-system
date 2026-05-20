import { useEffect, useState, useCallback } from "react";
import {
  CalendarIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
  WrenchIcon,
} from "@heroicons/react/24/outline";
import API from "../../services/api";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import FeedbackPopup from "../../components/admin/FeedbackPopup";

type Appointment = {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone: string;
  vehicleId: number;
  vehicleNumber: string;
  vehicleModel: string;
  vehicleBrand: string;
  appointmentDate: string;
  status: "Pending" | "Confirmed" | "Completed" | "Cancelled";
  description?: string;
};

export default function BookingManagement() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("All");

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

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get<Appointment[]>("/admin/appointments");
      setAppointments(res.data);
    } catch {
      setFeedback({
        open: true,
        title: "Load failed",
        message: "Failed to load workshop bookings queue.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await API.patch(`/admin/appointments/${id}/status`, { status: newStatus });
      setFeedback({
        open: true,
        title: "Success",
        message: `Appointment status updated to ${newStatus}.`,
        variant: "success",
      });
      loadAppointments();
    } catch {
      setFeedback({
        open: true,
        title: "Update failed",
        message: "Failed to update appointment status.",
        variant: "error",
      });
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    const matchesSearch =
      app.customerName.toLowerCase().includes(search.toLowerCase()) ||
      app.vehicleNumber.toLowerCase().includes(search.toLowerCase()) ||
      app.vehicleModel.toLowerCase().includes(search.toLowerCase()) ||
      app.vehicleBrand.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-700 ring-amber-600/20";
      case "Confirmed":
        return "bg-blue-50 text-blue-700 ring-blue-600/20";
      case "Completed":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
      case "Cancelled":
        return "bg-rose-50 text-rose-700 ring-rose-600/20";
      default:
        return "bg-slate-50 text-slate-700 ring-slate-600/20";
    }
  };

  const formatDate = (iso: string) => {
    const date = new Date(iso);
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <>
      <AdminPageHeader
        title="Workshop Bookings Queue"
        description="Monitor workshop bay occupancy, check in vehicles, and manage priority service scheduling queues."
        action={
          <button
            type="button"
            onClick={loadAppointments}
            disabled={loading}
            className="inline-flex items-center gap-2 rounded-xl bg-navy-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-navy-500 transition disabled:opacity-50"
          >
            <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </button>
        }
      />

      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-slate-200/75 bg-white p-4 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search by customer name, plate number, brand..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 pl-10 pr-4 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          />
        </div>

        <div className="flex items-center gap-3">
          <FunnelIcon className="h-5 w-5 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm focus:border-navy-500 focus:outline-none focus:ring-1 focus:ring-navy-500"
          >
            <option value="All">All Bookings</option>
            <option value="Pending">Pending</option>
            <option value="Confirmed">Confirmed</option>
            <option value="Completed">Completed</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Booking Date & Time</th>
                <th className="px-6 py-4">Customer Details</th>
                <th className="px-6 py-4">Registered Vehicle</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading bookings...
                  </td>
                </tr>
              ) : filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No service bookings found.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <CalendarIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{formatDate(app.appointmentDate)}</p>
                          <p className="text-xs text-slate-400">Booking ID: #{app.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{app.customerName}</p>
                      <p className="text-xs text-slate-500 font-mono">{app.customerPhone}</p>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <WrenchIcon className="h-4 w-4 text-slate-400" />
                        <div>
                          <p className="font-semibold text-slate-950">
                            {app.vehicleBrand} {app.vehicleModel}
                          </p>
                          <p className="text-xs font-mono bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded inline-block mt-0.5">
                            {app.vehicleNumber}
                          </p>
                          {app.description && (
                            <p className="text-xs text-slate-500 mt-1 italic font-medium">
                              Notes: "{app.description}"
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(
                          app.status
                        )}`}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {app.status === "Pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(app.id, "Confirmed")}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                            >
                              Confirm
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(app.id, "Cancelled")}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {app.status === "Confirmed" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(app.id, "Completed")}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                            >
                              Complete Service
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(app.id, "Cancelled")}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                            >
                              Cancel
                            </button>
                          </>
                        )}
                        {app.status === "Completed" && (
                          <span className="text-xs font-medium text-slate-400">Completed</span>
                        )}
                        {app.status === "Cancelled" && (
                          <span className="text-xs font-medium text-slate-400">Cancelled</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

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
