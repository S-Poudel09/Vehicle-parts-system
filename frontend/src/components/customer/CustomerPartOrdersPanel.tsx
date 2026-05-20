import { useCallback, useEffect, useState } from "react";
import {
  ArrowPathIcon,
  BanknotesIcon,
  CheckCircleIcon,
  DocumentArrowDownIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import {
  createPartOrder,
  downloadPartOrderInvoice,
  getMyPartOrder,
  getMyPartOrders,
  submitPartOrderPayment,
  type PartOrderDetail,
  type PartOrderListItem,
} from "../../api/partOrders";

const statusColors: Record<string, string> = {
  PendingApproval: "bg-amber-50 text-amber-800 border-amber-200",
  Approved: "bg-blue-50 text-blue-800 border-blue-200",
  AwaitingPayment: "bg-indigo-50 text-indigo-800 border-indigo-200",
  PaymentVerificationPending: "bg-purple-50 text-purple-800 border-purple-200",
  PartiallyPaid: "bg-orange-50 text-orange-800 border-orange-200",
  Paid: "bg-emerald-50 text-emerald-800 border-emerald-200",
  ReadyForPickup: "bg-teal-50 text-teal-800 border-teal-200",
  Completed: "bg-slate-100 text-slate-700 border-slate-200",
  Rejected: "bg-red-50 text-red-800 border-red-200",
};

export default function CustomerPartOrdersPanel() {
  const [orders, setOrders] = useState<PartOrderListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<PartOrderDetail | null>(null);
  const [paymentRef, setPaymentRef] = useState("");
  const [declaredAmount, setDeclaredAmount] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      setOrders(await getMyPartOrders());
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const openOrder = async (id: number) => {
    setError("");
    setMessage("");
    const detail = await getMyPartOrder(id);
    setSelected(detail);
    setPaymentRef(detail.paymentReferenceId ?? "");
    setDeclaredAmount(
      detail.status === "AwaitingPayment" || detail.status === "PartiallyPaid"
        ? String(detail.pendingAmount || detail.finalAmount)
        : ""
    );
  };

  const handleSubmitPayment = async () => {
    if (!selected) return;
    setBusy(true);
    setError("");
    try {
      const res = await submitPartOrderPayment(
        selected.id,
        paymentRef.trim(),
        Number(declaredAmount)
      );
      setMessage(res.message);
      await load();
      const refreshed = await getMyPartOrder(selected.id);
      setSelected(refreshed);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Could not submit payment.";
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const handleDownloadInvoice = async () => {
    if (!selected?.saleId) return;
    const blob = await downloadPartOrderInvoice(selected.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selected.invoiceNumber ?? "invoice"}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const showPayment =
    selected &&
    (selected.status === "AwaitingPayment" || selected.status === "PartiallyPaid");

  return (
    <div className="space-y-8">
      <div className="border-b border-slate-100 pb-6">
        <span className="text-[11px] font-extrabold tracking-widest text-emerald-600 uppercase">
          Direct Purchase
        </span>
        <h1 className="text-3xl font-black text-slate-800 mt-1">My Part Orders</h1>
        <p className="text-sm text-slate-500">
          Buy parts from the catalog — separate from service appointments.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <ArrowPathIcon className="h-8 w-8 animate-spin text-emerald-600" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-12 text-center">
          <ShoppingBagIcon className="mx-auto h-10 w-10 text-slate-300" />
          <p className="mt-3 text-sm font-bold text-slate-600">No part orders yet</p>
          <p className="text-xs text-slate-400 mt-1">
            Use &quot;Buy Part&quot; in the Parts Catalog tab.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {orders.map((o) => (
              <button
                key={o.id}
                type="button"
                onClick={() => openOrder(o.id)}
                className={`w-full text-left rounded-2xl border p-4 bg-white hover:border-emerald-300 transition-all ${
                  selected?.id === o.id ? "border-emerald-500 ring-2 ring-emerald-100" : "border-slate-100"
                }`}
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <p className="font-black text-slate-800 text-sm">{o.partName}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Qty {o.quantity} · Rs {o.finalAmount.toLocaleString()}
                    </p>
                  </div>
                  <span
                    className={`text-[9px] font-extrabold uppercase px-2 py-0.5 rounded border shrink-0 ${
                      statusColors[o.status] ?? "bg-slate-50 text-slate-600"
                    }`}
                  >
                    {o.status.replace(/([A-Z])/g, " $1").trim()}
                  </span>
                </div>
              </button>
            ))}
          </div>

          {selected && (
            <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm space-y-4 sticky top-4">
              <h2 className="text-lg font-black text-slate-800">Order #{selected.id}</h2>
              <dl className="grid grid-cols-2 gap-2 text-xs">
                <dt className="text-slate-500">Part</dt>
                <dd className="font-bold text-slate-800">{selected.partName}</dd>
                <dt className="text-slate-500">Quantity</dt>
                <dd className="font-bold">{selected.quantity}</dd>
                <dt className="text-slate-500">Total</dt>
                <dd className="font-bold">Rs {selected.finalAmount.toLocaleString()}</dd>
                <dt className="text-slate-500">Paid</dt>
                <dd className="font-bold text-emerald-700">
                  Rs {selected.paidAmount.toLocaleString()}
                </dd>
                <dt className="text-slate-500">Pending</dt>
                <dd className="font-bold text-amber-700">
                  Rs {selected.pendingAmount.toLocaleString()}
                </dd>
                {selected.invoiceNumber && (
                  <>
                    <dt className="text-slate-500">Invoice</dt>
                    <dd className="font-bold">{selected.invoiceNumber}</dd>
                  </>
                )}
              </dl>

              {showPayment && (
                <div className="border-t border-slate-100 pt-4 space-y-4">
                  <p className="text-xs font-bold text-slate-600 flex items-center gap-1">
                    <BanknotesIcon className="h-4 w-4" />
                    Pay via Khalti QR
                  </p>
                  <div className="flex justify-center bg-black rounded-xl p-4">
                    <img
                      src="/khalti-qr.png"
                      alt="Khalti payment QR code"
                      className="max-h-48 w-auto rounded"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600">
                      Total payment amount (Rs)
                    </label>
                    <input
                      type="number"
                      readOnly
                      value={selected.finalAmount}
                      className="mt-1 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-bold"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600">
                      Amount you paid (Rs)
                    </label>
                    <input
                      type="number"
                      min={0}
                      step="0.01"
                      value={declaredAmount}
                      onChange={(e) => setDeclaredAmount(e.target.value)}
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-slate-600">
                      Payment reference ID
                    </label>
                    <input
                      type="text"
                      value={paymentRef}
                      onChange={(e) => setPaymentRef(e.target.value)}
                      placeholder="Khalti transaction reference"
                      className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                    />
                  </div>
                  <button
                    type="button"
                    disabled={busy}
                    onClick={handleSubmitPayment}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 text-white text-sm font-black hover:bg-emerald-500 disabled:opacity-50"
                  >
                    {busy ? "Submitting…" : "Submit payment for verification"}
                  </button>
                </div>
              )}

              {selected.saleId && (
                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-slate-200 text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  <DocumentArrowDownIcon className="h-4 w-4" />
                  Download invoice PDF
                </button>
              )}

              {message && (
                <p className="text-xs text-emerald-700 bg-emerald-50 border border-emerald-100 rounded-lg p-3 flex gap-2">
                  <CheckCircleIcon className="h-4 w-4 shrink-0" />
                  {message}
                </p>
              )}
              {error && (
                <p className="text-xs text-red-700 bg-red-50 border border-red-100 rounded-lg p-3">
                  {error}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export type BuyPartHandler = (partId: number, partName: string, price: number, stock: number) => void;

export function CustomerBuyPartModal({
  open,
  partId,
  partName,
  price,
  maxStock,
  onClose,
  onSuccess,
}: {
  open: boolean;
  partId: number;
  partName: string;
  price: number;
  maxStock: number;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (!open) return null;

  const total = price * qty;
  const discount = total > 5000 ? total * 0.1 : 0;
  const finalTotal = total - discount;

  const submit = async () => {
    setBusy(true);
    setError("");
    try {
      await createPartOrder(partId, qty);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      setError(
        (err as { response?: { data?: { message?: string } } }).response?.data
          ?.message ?? "Could not place order."
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6 space-y-4">
        <h3 className="text-lg font-black text-slate-900">Buy Part</h3>
        <p className="text-sm text-slate-600">{partName}</p>
        <div>
          <label className="text-xs font-bold text-slate-600">Quantity</label>
          <input
            type="number"
            min={1}
            max={maxStock}
            value={qty}
            onChange={(e) => setQty(Math.max(1, Math.min(maxStock, Number(e.target.value))))}
            className="mt-1 w-full rounded-xl border border-slate-200 px-3 py-2"
          />
        </div>
        <p className="text-sm font-bold text-slate-800">
          Estimated total: Rs {finalTotal.toLocaleString()}
          {discount > 0 && (
            <span className="text-emerald-600 text-xs block">10% discount applied</span>
          )}
        </p>
        {error && <p className="text-xs text-red-600">{error}</p>}
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-2 rounded-xl border border-slate-200 font-bold text-sm"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={submit}
            className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-black text-sm disabled:opacity-50"
          >
            {busy ? "Submitting…" : "Request purchase"}
          </button>
        </div>
      </div>
    </div>
  );
}
