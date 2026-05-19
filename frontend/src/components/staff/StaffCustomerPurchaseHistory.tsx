import { useCallback, useEffect, useState } from "react";
import {
  ChevronDownIcon,
  ChevronRightIcon,
  DocumentTextIcon,
  EnvelopeIcon,
} from "@heroicons/react/24/outline";
import { getSaleInvoice, sendSaleInvoiceEmail } from "../../api/staffSales";
import SalesInvoiceModal, {
  type SaleInvoice,
} from "../invoice/SalesInvoiceModal";
import { formatMoney } from "../../utils/invoiceFormat";
import API from "../../services/api";

type HistoryLineItem = {
  partId: number;
  partName: string;
  quantity: number;
  price: number;
  lineTotal: number;
};

type HistoryItem = {
  saleId: number;
  saleDate: string;
  totalAmount: number;
  discount: number;
  finalAmount: number;
  paymentStatus: string;
  items: HistoryLineItem[];
};

type Props = {
  customerId: number;
  customerEmail: string;
};

export default function StaffCustomerPurchaseHistory({
  customerId,
  customerEmail,
}: Props) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [invoice, setInvoice] = useState<SaleInvoice | null>(null);
  const [loadingSaleId, setLoadingSaleId] = useState<number | null>(null);
  const [sendingSaleId, setSendingSaleId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ text: string; variant: "success" | "error" } | null>(
    null
  );

  const hasEmail = Boolean(customerEmail?.trim());

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const res = await API.get<{ purchaseHistory: HistoryItem[] }>(
        `/staff/customers/${customerId}/history`
      );
      setHistory(res.data.purchaseHistory ?? []);
    } catch {
      setError("Could not load purchase history.");
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, [customerId]);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const openInvoice = async (saleId: number) => {
    setLoadingSaleId(saleId);
    setToast(null);
    try {
      setInvoice(await getSaleInvoice(saleId));
    } catch {
      setToast({
        text: "Could not load invoice for this sale.",
        variant: "error",
      });
    } finally {
      setLoadingSaleId(null);
    }
  };

  const emailInvoice = async (saleId: number) => {
    if (!hasEmail) {
      setToast({
        text: "Customer has no email on file. Update their profile first.",
        variant: "error",
      });
      return;
    }
    setSendingSaleId(saleId);
    setToast(null);
    try {
      const res = await sendSaleInvoiceEmail(saleId);
      setToast({
        text: `${res.message} Sent to ${res.customerEmail}.`,
        variant: "success",
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setToast({
        text:
          ax.response?.data?.message ||
          "Could not send invoice email. Check SMTP settings.",
        variant: "error",
      });
    } finally {
      setSendingSaleId(null);
    }
  };

  return (
    <>
      <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h3 className="font-semibold text-slate-900">Purchase history</h3>
          <p className="mt-0.5 text-sm text-slate-500">
            Past sales for this customer. Expand a row for line items, or open the
            full invoice to print or email.
          </p>
        </div>

        {toast && (
          <p
            className={`mx-6 mt-4 rounded-xl border px-4 py-3 text-sm ${
              toast.variant === "success"
                ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                : "border-red-200 bg-red-50 text-red-800"
            }`}
          >
            {toast.text}
          </p>
        )}

        {!hasEmail && (
          <p className="mx-6 mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            No email on file — invoice email is disabled until you add one above.
          </p>
        )}

        {loading ? (
          <p className="px-6 py-10 text-center text-sm text-slate-500">Loading…</p>
        ) : error ? (
          <p className="px-6 py-10 text-center text-sm text-red-600">{error}</p>
        ) : history.length === 0 ? (
          <p className="px-6 py-10 text-center text-sm text-slate-400">
            No purchases recorded for this customer yet.
          </p>
        ) : (
          <div className="divide-y divide-slate-100">
            {history.map((row) => {
              const expanded = expandedId === row.saleId;
              return (
                <div key={row.saleId}>
                  <div className="flex flex-wrap items-center gap-3 px-6 py-4">
                    <button
                      type="button"
                      className="flex min-w-0 flex-1 items-center gap-2 text-left"
                      onClick={() =>
                        setExpandedId(expanded ? null : row.saleId)
                      }
                    >
                      {expanded ? (
                        <ChevronDownIcon className="h-4 w-4 shrink-0 text-slate-500" />
                      ) : (
                        <ChevronRightIcon className="h-4 w-4 shrink-0 text-slate-500" />
                      )}
                      <div className="min-w-0">
                        <p className="font-mono text-sm font-semibold text-slate-900">
                          GP-SAL-2026-{row.saleId}
                        </p>
                        <p className="text-xs text-slate-500">
                          {new Date(row.saleDate).toLocaleString()}
                        </p>
                      </div>
                    </button>

                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                        row.paymentStatus === "Paid"
                          ? "bg-emerald-50 text-emerald-700"
                          : "bg-amber-50 text-amber-800"
                      }`}
                    >
                      {row.paymentStatus}
                    </span>

                    <p className="font-semibold text-slate-900">
                      {formatMoney(row.finalAmount)}
                    </p>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        disabled={loadingSaleId === row.saleId}
                        onClick={() => openInvoice(row.saleId)}
                      >
                        <DocumentTextIcon className="h-3.5 w-3.5" />
                        {loadingSaleId === row.saleId ? "Loading…" : "Invoice"}
                      </button>
                      <button
                        type="button"
                        className="btn-secondary text-xs"
                        disabled={!hasEmail || sendingSaleId === row.saleId}
                        title={
                          hasEmail
                            ? `Email to ${customerEmail}`
                            : "No customer email"
                        }
                        onClick={() => emailInvoice(row.saleId)}
                      >
                        <EnvelopeIcon className="h-3.5 w-3.5" />
                        {sendingSaleId === row.saleId ? "Sending…" : "Email"}
                      </button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="text-left text-xs font-semibold uppercase text-slate-500">
                            <th className="pb-2">Part</th>
                            <th className="pb-2 text-right">Qty</th>
                            <th className="pb-2 text-right">Rate</th>
                            <th className="pb-2 text-right">Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {row.items.map((item) => (
                            <tr
                              key={`${row.saleId}-${item.partId}-${item.partName}`}
                              className="border-t border-slate-100"
                            >
                              <td className="py-2 text-slate-800">
                                {item.partName}
                              </td>
                              <td className="py-2 text-right text-slate-600">
                                {item.quantity}
                              </td>
                              <td className="py-2 text-right text-slate-600">
                                {formatMoney(item.price)}
                              </td>
                              <td className="py-2 text-right font-medium text-slate-900">
                                {formatMoney(item.lineTotal)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      <div className="mt-3 flex flex-wrap gap-4 text-xs text-slate-600">
                        <span>Gross: {formatMoney(row.totalAmount)}</span>
                        {row.discount > 0 && (
                          <span className="text-emerald-700">
                            Discount: -{formatMoney(row.discount)}
                          </span>
                        )}
                        <span className="font-semibold text-slate-900">
                          Final: {formatMoney(row.finalAmount)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {invoice && (
        <SalesInvoiceModal sale={invoice} onClose={() => setInvoice(null)} />
      )}
    </>
  );
}

