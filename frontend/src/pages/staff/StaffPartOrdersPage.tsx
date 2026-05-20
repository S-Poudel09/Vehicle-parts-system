import { useCallback, useEffect, useState } from "react";
import {
  CheckCircleIcon,
  XCircleIcon,
  ArrowPathIcon,
  BanknotesIcon,
} from "@heroicons/react/24/outline";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import FeedbackPopup from "../../components/admin/FeedbackPopup";
import {
  approvePartOrder,
  completePartOrder,
  getStaffPartOrder,
  getStaffPartOrders,
  rejectPartOrder,
  verifyPartOrderPayment,
  type PartOrderDetail,
  type PartOrderListItem,
} from "../../api/partOrders";

const statuses = [
  "",
  "PendingApproval",
  "AwaitingPayment",
  "PaymentVerificationPending",
  "PartiallyPaid",
  "ReadyForPickup",
  "Completed",
  "Rejected",
];

export default function StaffPartOrdersPage() {
  const [orders, setOrders] = useState<PartOrderListItem[]>([]);
  const [filter, setFilter] = useState("PendingApproval");
  const [selected, setSelected] = useState<PartOrderDetail | null>(null);
  const [loading, setLoading] = useState(false);
  const [paidInput, setPaidInput] = useState("");
  const [notes, setNotes] = useState("");
  const [popup, setPopup] = useState<{ type: "success" | "error"; message: string } | null>(
    null
  );
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await getStaffPartOrders(filter || undefined));
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    load();
  }, [load]);

  const selectOrder = async (id: number) => {
    const detail = await getStaffPartOrder(id);
    setSelected(detail);
    setPaidInput(String(detail.paidAmount || detail.customerDeclaredAmount || ""));
    setNotes("");
  };

  const run = async (fn: () => Promise<void>, success: string) => {
    setBusy(true);
    try {
      await fn();
      setPopup({ type: "success", message: success });
      await load();
      if (selected) await selectOrder(selected.id);
    } catch (err: unknown) {
      setPopup({
        type: "error",
        message:
          (err as { response?: { data?: { message?: string } } }).response?.data
            ?.message ?? "Action failed.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Part purchase requests"
        subtitle="Approve customer buy requests, verify Khalti QR payments, and complete pickups."
      />

      <div className="flex flex-wrap gap-2 items-center">
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"
        >
          {statuses.map((s) => (
            <option key={s || "all"} value={s}>
              {s || "All statuses"}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={load}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 px-3 py-2 text-sm font-bold"
        >
          <ArrowPathIcon className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-slate-100 bg-white overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs font-bold text-slate-500 uppercase">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Part</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  onClick={() => selectOrder(o.id)}
                  className={`border-t border-slate-50 cursor-pointer hover:bg-emerald-50/50 ${
                    selected?.id === o.id ? "bg-emerald-50" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-bold">#{o.id}</td>
                  <td className="px-4 py-3">{o.customerName}</td>
                  <td className="px-4 py-3">
                    {o.partName} ×{o.quantity}
                  </td>
                  <td className="px-4 py-3 text-xs font-bold">{o.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {orders.length === 0 && (
            <p className="p-8 text-center text-sm text-slate-500">No orders in this filter.</p>
          )}
        </div>

        {selected && (
          <div className="rounded-2xl border border-slate-100 bg-white p-6 space-y-4">
            <h2 className="text-lg font-black text-slate-900">
              Order #{selected.id} — {selected.customerName}
            </h2>
            <p className="text-sm text-slate-600">
              {selected.partName} ×{selected.quantity} · Rs {selected.finalAmount.toLocaleString()}
            </p>
            <p className="text-xs text-slate-500">
              Paid: Rs {selected.paidAmount.toLocaleString()} · Pending: Rs{" "}
              {selected.pendingAmount.toLocaleString()}
            </p>
            {selected.paymentReferenceId && (
              <p className="text-xs font-mono bg-slate-50 p-2 rounded">
                Ref: {selected.paymentReferenceId}
              </p>
            )}

            {selected.status === "PendingApproval" && (
              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(() => approvePartOrder(selected.id), "Order approved — customer can pay.")
                  }
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-emerald-600 text-white text-sm font-bold"
                >
                  <CheckCircleIcon className="h-4 w-4" />
                  Approve
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(() => rejectPartOrder(selected.id, notes), "Order rejected.")
                  }
                  className="flex-1 flex items-center justify-center gap-1 py-2 rounded-xl bg-red-600 text-white text-sm font-bold"
                >
                  <XCircleIcon className="h-4 w-4" />
                  Reject
                </button>
              </div>
            )}

            {selected.status === "PaymentVerificationPending" && (
              <div className="space-y-3 border-t pt-4">
                <p className="text-xs font-bold text-slate-600 flex items-center gap-1">
                  <BanknotesIcon className="h-4 w-4" />
                  Verify payment (customer declared Rs{" "}
                  {selected.customerDeclaredAmount.toLocaleString()})
                </p>
                <input
                  type="number"
                  value={paidInput}
                  onChange={(e) => setPaidInput(e.target.value)}
                  placeholder="Total verified paid amount"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                />
                <button
                  type="button"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () =>
                        verifyPartOrderPayment(
                          selected.id,
                          Number(paidInput),
                          selected.paymentReferenceId ?? undefined,
                          notes
                        ),
                      "Payment verified; invoice sent."
                    )
                  }
                  className="w-full py-2 rounded-xl bg-indigo-600 text-white text-sm font-black"
                >
                  Verify payment & send invoice
                </button>
              </div>
            )}

            {(selected.status === "ReadyForPickup" ||
              selected.status === "PartiallyPaid") && (
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  run(() => completePartOrder(selected.id), "Order completed.")
                }
                className="w-full py-2 rounded-xl bg-slate-900 text-white text-sm font-black"
              >
                Mark completed / picked up
              </button>
            )}

            {selected.paymentLogs.length > 0 && (
              <div className="border-t pt-3">
                <p className="text-xs font-bold text-slate-500 mb-2">Verification log</p>
                <ul className="text-xs space-y-1 text-slate-600">
                  {selected.paymentLogs.map((l) => (
                    <li key={l.id}>
                      {l.verifiedAt.slice(0, 10)} — {l.staffName}: Rs{" "}
                      {l.amountVerified.toLocaleString()} (total Rs{" "}
                      {l.totalPaidAfter.toLocaleString()})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {popup && (
        <FeedbackPopup
          type={popup.type}
          message={popup.message}
          onClose={() => setPopup(null)}
        />
      )}
    </div>
  );
}
