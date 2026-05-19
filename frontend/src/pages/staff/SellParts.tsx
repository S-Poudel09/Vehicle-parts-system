import { useEffect, useMemo, useState } from "react";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/outline";
import API from "../../services/api";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import FeedbackPopup from "../../components/admin/FeedbackPopup";
import SalesInvoiceModal, {
  type SaleInvoice,
} from "../../components/invoice/SalesInvoiceModal";
import { formatMoney } from "../../utils/invoiceFormat";

type CustomerOption = {
  id: number;
  fullName: string;
  phoneNumber: string;
};

type PartOption = {
  id: number;
  name: string;
  price: number;
  stock: number;
};

type LineRow = {
  key: string;
  partId: string;
  quantity: string;
};

const emptyLine = (): LineRow => ({
  key: crypto.randomUUID(),
  partId: "",
  quantity: "1",
});

export default function SellParts() {
  const [customers, setCustomers] = useState<CustomerOption[]>([]);
  const [parts, setParts] = useState<PartOption[]>([]);
  const [customerId, setCustomerId] = useState("");
  const [paidAmount, setPaidAmount] = useState("");
  const [lines, setLines] = useState<LineRow[]>([emptyLine()]);
  const [loading, setLoading] = useState(false);
  const [invoice, setInvoice] = useState<SaleInvoice | null>(null);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "success" | "error";
  }>({ open: false, title: "", message: "", variant: "success" });

  useEffect(() => {
    Promise.all([
      API.get<CustomerOption[]>("/staff/customers"),
      API.get<PartOption[]>("/Part"),
    ])
      .then(([custRes, partsRes]) => {
        const map = new Map<number, CustomerOption>();
        for (const row of custRes.data) {
          if (!map.has(row.id)) {
            map.set(row.id, {
              id: row.id,
              fullName: row.fullName,
              phoneNumber: row.phoneNumber,
            });
          }
        }
        setCustomers(Array.from(map.values()));
        setParts(partsRes.data);
      })
      .catch(() => {
        setFeedback({
          open: true,
          title: "Load failed",
          message: "Could not load customers or parts.",
          variant: "error",
        });
      });
  }, []);

  const parsedLines = useMemo(() => {
    return lines.map((line) => {
      const part = parts.find((p) => p.id === Number(line.partId));
      const qty = Number(line.quantity);
      const valid =
        part != null && qty > 0 && qty <= part.stock && line.partId !== "";
      const lineTotal = valid ? part!.price * qty : 0;
      return { ...line, part, qty, valid, lineTotal };
    });
  }, [lines, parts]);

  const grandTotal = useMemo(
    () => parsedLines.reduce((sum, row) => sum + (row.valid ? row.lineTotal : 0), 0),
    [parsedLines]
  );

  const discountPreview = grandTotal > 5000 ? grandTotal * 0.1 : 0;
  const finalPreview = grandTotal - discountPreview;

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);

  const removeLine = (key: string) => {
    setLines((prev) => (prev.length === 1 ? prev : prev.filter((l) => l.key !== key)));
  };

  const updateLine = (key: string, field: keyof LineRow, value: string) => {
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, [field]: value } : l))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerId) {
      setFeedback({
        open: true,
        title: "Validation",
        message: "Select a customer.",
        variant: "error",
      });
      return;
    }

    const items = parsedLines
      .filter((row) => row.valid && row.part)
      .map((row) => ({
        partId: row.part!.id,
        quantity: row.qty,
      }));

    if (items.length === 0) {
      setFeedback({
        open: true,
        title: "Validation",
        message: "Add at least one valid part line.",
        variant: "error",
      });
      return;
    }

    const paid = paidAmount.trim() === "" ? finalPreview : Number(paidAmount);

    try {
      setLoading(true);
      const res = await API.post<SaleInvoice>("/staff/sales", {
        customerId: Number(customerId),
        paidAmount: paid,
        items,
      });
      setInvoice(res.data);
      setCustomerId("");
      setPaidAmount("");
      setLines([emptyLine()]);
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } } };
      setFeedback({
        open: true,
        title: "Sale failed",
        message: ax.response?.data?.message || "Could not create sale invoice.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Sell Parts"
        description="Create a sales invoice for customer purchases. Discount 10% applies when total exceeds Rs 5,000."
      />

      <form
        onSubmit={handleSubmit}
        className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
      >
        <div className="space-y-6 border-b border-slate-100 p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Customer
              </label>
              <select
                className="input-field w-full"
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                required
              >
                <option value="">Select customer</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    #{c.id} — {c.fullName} ({c.phoneNumber})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                Paid amount
              </label>
              <input
                className="input-field w-full"
                type="number"
                min={0}
                step="0.01"
                placeholder={`Default: ${finalPreview.toFixed(2)}`}
                value={paidAmount}
                onChange={(e) => setPaidAmount(e.target.value)}
              />
              <p className="mt-1 text-xs text-slate-500">
                Leave empty to mark full payment. Less than final amount creates
                pending credit.
              </p>
            </div>
          </div>

          <div>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-slate-900">Parts</h3>
              <button type="button" className="btn-secondary text-xs" onClick={addLine}>
                <PlusIcon className="h-4 w-4" />
                Add line
              </button>
            </div>

            <div className="space-y-3">
              {parsedLines.map((row) => (
                <div
                  key={row.key}
                  className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/50 p-4 md:grid-cols-[1fr_120px_40px]"
                >
                  <select
                    className="input-field w-full"
                    value={row.partId}
                    onChange={(e) => updateLine(row.key, "partId", e.target.value)}
                    required
                  >
                    <option value="">Select part</option>
                    {parts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — {formatMoney(p.price)} (stock: {p.stock})
                      </option>
                    ))}
                  </select>
                  <input
                    className="input-field w-full"
                    type="number"
                    min={1}
                    value={row.quantity}
                    onChange={(e) => updateLine(row.key, "quantity", e.target.value)}
                    placeholder="Qty"
                    required
                  />
                  <button
                    type="button"
                    className="btn-secondary !p-2"
                    onClick={() => removeLine(row.key)}
                    aria-label="Remove line"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                  {row.partId && !row.valid && (
                    <p className="md:col-span-3 text-xs text-red-600">
                      Check quantity and stock for this part.
                    </p>
                  )}
                  {row.valid && (
                    <p className="md:col-span-3 text-xs text-slate-600">
                      Line total: {formatMoney(row.lineTotal)}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
            <div className="flex justify-between text-slate-600">
              <span>Subtotal</span>
              <span>{formatMoney(grandTotal)}</span>
            </div>
            {discountPreview > 0 && (
              <div className="flex justify-between text-emerald-700">
                <span>Discount (10%)</span>
                <span>-{formatMoney(discountPreview)}</span>
              </div>
            )}
            <div className="mt-2 flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
              <span>Final amount</span>
              <span>{formatMoney(finalPreview)}</span>
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 px-6 py-4">
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? "Creating invoice…" : "Create sales invoice"}
          </button>
        </div>
      </form>

      {invoice && (
        <SalesInvoiceModal sale={invoice} onClose={() => setInvoice(null)} />
      )}

      <FeedbackPopup
        open={feedback.open}
        title={feedback.title}
        message={feedback.message}
        variant={feedback.variant}
        onClose={() => setFeedback((f) => ({ ...f, open: false }))}
      />
    </>
  );
}
