import { useEffect, useState, useCallback } from "react";
import {
  ClipboardDocumentListIcon,
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  MagnifyingGlassIcon,
  FunnelIcon,
} from "@heroicons/react/24/outline";
import API from "../../services/api";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import FeedbackPopup from "../../components/admin/FeedbackPopup";

type PartRequest = {
  id: number;
  customerId: number;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  partName: string;
  description: string;
  status: "Pending" | "Approved" | "Rejected" | "Fulfilled";
};

export default function PartRequestsManagement() {
  const [requests, setRequests] = useState<PartRequest[]>([]);
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

  const loadRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get<PartRequest[]>("/admin/part-requests");
      setRequests(res.data);
    } catch {
      setFeedback({
        open: true,
        title: "Load failed",
        message: "Failed to load customer part requests.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const handleStatusUpdate = async (id: number, newStatus: string) => {
    try {
      await API.patch(`/admin/part-requests/${id}/status`, { status: newStatus });
      setFeedback({
        open: true,
        title: "Success",
        message: `Part request status updated to ${newStatus}.`,
        variant: "success",
      });
      loadRequests();
    } catch {
      setFeedback({
        open: true,
        title: "Update failed",
        message: "Failed to update request status.",
        variant: "error",
      });
    }
  };

  const filteredRequests = requests.filter((r) => {
    const matchesSearch =
      r.partName.toLowerCase().includes(search.toLowerCase()) ||
      r.customerName.toLowerCase().includes(search.toLowerCase()) ||
      r.description.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === "All" || r.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const getStatusStyle = (status: string) => {
    switch (status) {
      case "Pending":
        return "bg-amber-50 text-amber-700 ring-amber-600/20";
      case "Approved":
        return "bg-blue-50 text-blue-700 ring-blue-600/20";
      case "Rejected":
        return "bg-rose-50 text-rose-700 ring-rose-600/20";
      case "Fulfilled":
        return "bg-emerald-50 text-emerald-700 ring-emerald-600/20";
      default:
        return "bg-slate-50 text-slate-700 ring-slate-600/20";
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Custom Part Requests"
        description="Review, approve, and track custom unavailable part requests submitted by registered customers."
        action={
          <button
            type="button"
            onClick={loadRequests}
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
            placeholder="Search by part, customer name, description..."
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
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
            <option value="Fulfilled">Fulfilled</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                <th className="px-6 py-4">Part Details</th>
                <th className="px-6 py-4">Customer Info</th>
                <th className="px-6 py-4">Description</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Loading requests...
                  </td>
                </tr>
              ) : filteredRequests.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    No custom part requests found.
                  </td>
                </tr>
              ) : (
                filteredRequests.map((req) => (
                  <tr key={req.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                          <ClipboardDocumentListIcon className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-bold text-slate-900">{req.partName}</p>
                          <p className="text-xs text-slate-400">Req ID: #{req.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-slate-900">{req.customerName}</p>
                      <p className="text-xs text-slate-400">{req.customerEmail}</p>
                      <p className="text-xs text-slate-500 font-mono">{req.customerPhone}</p>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="truncate text-slate-650" title={req.description}>
                        {req.description || <span className="text-slate-400 italic">No description</span>}
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ring-inset ${getStatusStyle(
                          req.status
                        )}`}
                      >
                        {req.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-2">
                        {req.status === "Pending" && (
                          <>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(req.id, "Approved")}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-50 px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-100 transition"
                            >
                              <CheckCircleIcon className="h-4 w-4" />
                              Approve
                            </button>
                            <button
                              type="button"
                              onClick={() => handleStatusUpdate(req.id, "Rejected")}
                              className="inline-flex items-center gap-1.5 rounded-lg bg-rose-50 px-2.5 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-100 transition"
                            >
                              <XCircleIcon className="h-4 w-4" />
                              Reject
                            </button>
                          </>
                        )}
                        {req.status === "Approved" && (
                          <button
                            type="button"
                            onClick={() => handleStatusUpdate(req.id, "Fulfilled")}
                            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-2.5 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
                          >
                            <CheckCircleIcon className="h-4 w-4" />
                            Fulfill (In Stock)
                          </button>
                        )}
                        {req.status === "Fulfilled" && (
                          <span className="text-xs font-medium text-slate-400">Order Completed</span>
                        )}
                        {req.status === "Rejected" && (
                          <span className="text-xs font-medium text-slate-400">Rejected</span>
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
