import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  PlusIcon,
  TrashIcon,
  XMarkIcon,
  PrinterIcon,
  ArrowDownTrayIcon,
} from "@heroicons/react/24/outline";
import API from "../../services/api";
import { downloadPurchaseOrdersCsv } from "../../api/purchases";
import AdminFormModal from "../../components/admin/AdminFormModal";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import FeedbackPopup from "../../components/admin/FeedbackPopup";
import ListPagination from "../../components/common/ListPagination";
import { ADMIN_TABLE_PAGE_SIZE } from "../../constants/adminPagination";
import { useTablePagination } from "../../hooks/useTablePagination";

type VendorOption = { id: number; name: string; phone: string; address: string };
type PartOption = { id: number; name: string; stock: number };

type PurchaseItemRow = {
  id: number;
  partId: number;
  partName: string;
  quantity: number;
  price: number;
  lineTotal: number;
};

type PurchaseRecord = {
  id: number;
  vendorId: number;
  vendorName: string;
  vendorPhone: string;
  vendorAddress: string;
  totalAmount: number;
  purchaseDate: string;
  purchaseItems: PurchaseItemRow[];
};

type DraftLine = {
  key: string;
  partId: string;
  quantity: string;
  unitPrice: string;
};

type ParsedLine = {
  key: string;
  partId: number;
  partName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  valid: boolean;
};

const emptyLine = (): DraftLine => ({
  key: crypto.randomUUID(),
  partId: "",
  quantity: "1",
  unitPrice: "",
});

const formatMoney = (n: number) =>
  `Rs ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });

export default function AdminPurchasesPage() {
  const [vendors, setVendors] = useState<VendorOption[]>([]);
  const [parts, setParts] = useState<PartOption[]>([]);
  const [history, setHistory] = useState<PurchaseRecord[]>([]);
  const [vendorId, setVendorId] = useState("");
  const [lines, setLines] = useState<DraftLine[]>([emptyLine()]);
  const [loading, setLoading] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [invoicePurchase, setInvoicePurchase] = useState<PurchaseRecord | null>(
    null
  );

  // Search & filter states for Purchase History
  const [historySearchQuery, setHistorySearchQuery] = useState("");
  const [filterVendorId, setFilterVendorId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [minAmount, setMinAmount] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [exportingCsv, setExportingCsv] = useState(false);

  const filteredHistory = useMemo(() => {
    return history.filter((p) => {
      // 1. Text Search (Vendor Name or Purchase ID)
      const query = historySearchQuery.trim().toLowerCase();
      let matchesSearch = true;
      if (query !== "") {
        matchesSearch =
          p.vendorName.toLowerCase().includes(query) ||
          p.id.toString().includes(query) ||
          `GP-PUR-2026-${p.id}`.toLowerCase().includes(query);
      }

      // 2. Vendor Filter
      let matchesVendor = true;
      if (filterVendorId !== "") {
        matchesVendor = p.vendorId === Number(filterVendorId);
      }

      // 3. Date Range Filter
      let matchesDate = true;
      const purchaseTime = new Date(p.purchaseDate).getTime();
      if (startDate !== "") {
        const startVal = new Date(startDate).getTime();
        matchesDate = matchesDate && purchaseTime >= startVal;
      }
      if (endDate !== "") {
        const endVal = new Date(endDate);
        endVal.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && purchaseTime <= endVal.getTime();
      }

      // 4. Amount Filter
      let matchesMinAmt = true;
      if (minAmount.trim() !== "") {
        const minVal = parseFloat(minAmount);
        if (!isNaN(minVal)) {
          matchesMinAmt = p.totalAmount >= minVal;
        }
      }

      let matchesMaxAmt = true;
      if (maxAmount.trim() !== "") {
        const maxVal = parseFloat(maxAmount);
        if (!isNaN(maxVal)) {
          matchesMaxAmt = p.totalAmount <= maxVal;
        }
      }

      return matchesSearch && matchesVendor && matchesDate && matchesMinAmt && matchesMaxAmt;
    });
  }, [history, historySearchQuery, filterVendorId, startDate, endDate, minAmount, maxAmount]);
  const [feedback, setFeedback] = useState<{
    open: boolean;
    title: string;
    message: string;
    variant: "success" | "error";
  }>({ open: false, title: "", message: "", variant: "success" });

  const loadData = useCallback(async () => {
    try {
      const [vendorRes, partRes, purchaseRes] = await Promise.all([
        API.get<VendorOption[]>("/vendor"),
        API.get<PartOption[]>("/part"),
        API.get<PurchaseRecord[]>("/purchase"),
      ]);
      setVendors(vendorRes.data);
      setParts(partRes.data);
      setHistory(
        [...purchaseRes.data].sort(
          (a, b) =>
            new Date(b.purchaseDate).getTime() -
            new Date(a.purchaseDate).getTime()
        )
      );
    } catch {
      setFeedback({
        open: true,
        title: "Failed to load",
        message: "Could not load vendors, parts, or purchase history.",
        variant: "error",
      });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const selectedVendor = vendors.find((v) => v.id === Number(vendorId));

  const parsedLines: ParsedLine[] = useMemo(() => {
    return lines.map((line) => {
      const part = parts.find((p) => p.id === Number(line.partId));
      const qty = Number(line.quantity);
      const price = Number(line.unitPrice);
      const valid =
        part !== undefined &&
        Number.isFinite(qty) &&
        qty > 0 &&
        Number.isFinite(price) &&
        price > 0;

      return {
        key: line.key,
        partId: Number(line.partId),
        partName: part?.name ?? "",
        quantity: qty,
        unitPrice: price,
        lineTotal: valid ? qty * price : 0,
        valid,
      };
    });
  }, [lines, parts]);

  const validLines = parsedLines.filter((l) => l.valid && l.partId > 0);
  const previewGrandTotal = validLines.reduce((sum, l) => sum + l.lineTotal, 0);
  const hasDuplicateParts =
    new Set(validLines.map((l) => l.partId)).size !== validLines.length;
  const canReview =
    selectedVendor !== undefined && validLines.length > 0 && !hasDuplicateParts;

  const isCreateDirty =
    vendorId !== "" ||
    lines.some(
      (l) =>
        l.partId !== "" ||
        l.unitPrice !== "" ||
        l.quantity !== "1"
    );

  const addLine = () => setLines((prev) => [...prev, emptyLine()]);

  const removeLine = (key: string) =>
    setLines((prev) =>
      prev.length === 1 ? prev : prev.filter((l) => l.key !== key)
    );

  const updateLine = (key: string, patch: Partial<DraftLine>) =>
    setLines((prev) =>
      prev.map((l) => (l.key === key ? { ...l, ...patch } : l))
    );

  const resetForm = () => {
    setVendorId("");
    setLines([emptyLine()]);
  };

  const closeCreateModal = () => {
    setCreateOpen(false);
    resetForm();
  };

  const openReview = () => {
    if (!canReview) return;
    setCreateOpen(false);
    setPreviewOpen(true);
  };

  const backToCreate = () => {
    setPreviewOpen(false);
    setCreateOpen(true);
  };

  const usedPartIds = (excludeKey: string) =>
    new Set(
      lines
        .filter((l) => l.key !== excludeKey && l.partId)
        .map((l) => l.partId)
    );

  const openInvoice = async (purchaseId: number) => {
    try {
      const res = await API.get<PurchaseRecord>(`/purchase/${purchaseId}`);
      setInvoicePurchase(res.data);
    } catch {
      setFeedback({
        open: true,
        title: "Load failed",
        message: "Could not load purchase details.",
        variant: "error",
      });
    }
  };

  const handleExportCsv = async () => {
    if (!startDate && !endDate) {
      setFeedback({
        open: true,
        title: "Date range required",
        message: "Select a start date, end date, or both before exporting CSV.",
        variant: "error",
      });
      return;
    }

    setExportingCsv(true);
    try {
      const minVal = minAmount.trim() !== "" ? parseFloat(minAmount) : undefined;
      const maxVal = maxAmount.trim() !== "" ? parseFloat(maxAmount) : undefined;

      await downloadPurchaseOrdersCsv({
        from: startDate || undefined,
        to: endDate || undefined,
        vendorId: filterVendorId ? Number(filterVendorId) : undefined,
        search: historySearchQuery.trim() || undefined,
        minAmount: minVal != null && !isNaN(minVal) ? minVal : undefined,
        maxAmount: maxVal != null && !isNaN(maxVal) ? maxVal : undefined,
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } | Blob } };
      let message = "Could not export purchase orders.";
      const data = ax.response?.data;
      if (data instanceof Blob) {
        try {
          const text = await data.text();
          const parsed = JSON.parse(text) as { message?: string };
          message = parsed.message ?? message;
        } catch {
          /* keep default */
        }
      } else if (data && typeof data === "object" && "message" in data) {
        message = data.message ?? message;
      }
      setFeedback({
        open: true,
        title: "Export failed",
        message,
        variant: "error",
      });
    } finally {
      setExportingCsv(false);
    }
  };

  const handleConfirmPurchase = async () => {
    if (!selectedVendor || !canReview) return;

    const items = validLines.map((l) => ({
      partId: l.partId,
      quantity: l.quantity,
      price: l.unitPrice,
    }));

    setLoading(true);
    try {
      const res = await API.post<PurchaseRecord>("/purchase", {
        vendorId: selectedVendor.id,
        purchaseItems: items,
      });
      setPreviewOpen(false);
      closeCreateModal();
      setInvoicePurchase(res.data);
      await loadData();
      setFeedback({
        open: true,
        title: "Purchase confirmed",
        message: `Purchase #${res.data.id} saved. Stock updated for ${items.length} part(s).`,
        variant: "success",
      });
    } catch (err: unknown) {
      const ax = err as { response?: { data?: { message?: string } | string } };
      const message =
        typeof ax.response?.data === "string"
          ? ax.response.data
          : ax.response?.data?.message ?? "Could not confirm purchase.";
      setFeedback({
        open: true,
        title: "Purchase failed",
        message,
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Purchases"
        description="Buy stock from vendors. After confirmation, stock updates and purchase details are saved for your records."
        action={
          <button
            type="button"
            className="btn-primary"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon className="h-4 w-4" />
            New Purchase
          </button>
        }
      />

      {/* Search & Filter Bar for Purchase History */}
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-12">
          {/* Text Search */}
          <div className="sm:col-span-3">
            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Search Invoice / Vendor
            </label>
            <input
              type="text"
              placeholder="Search ID or supplier..."
              className="input-field w-full"
              value={historySearchQuery}
              onChange={(e) => setHistorySearchQuery(e.target.value)}
            />
          </div>

          {/* Supplier Dropdown */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Supplier
            </label>
            <select
              className="input-field w-full"
              value={filterVendorId}
              onChange={(e) => setFilterVendorId(e.target.value)}
            >
              <option value="">All Suppliers</option>
              {vendors.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name}
                </option>
              ))}
            </select>
          </div>

          {/* Start Date */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Start Date
            </label>
            <input
              type="date"
              className="input-field w-full"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          {/* End Date */}
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
              End Date
            </label>
            <input
              type="date"
              className="input-field w-full"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Amount Boundaries */}
          <div className="sm:col-span-2 flex gap-2">
            <div className="w-1/2">
              <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Min Amt
              </label>
              <input
                type="number"
                placeholder="Min"
                className="input-field w-full"
                value={minAmount}
                onChange={(e) => setMinAmount(e.target.value)}
              />
            </div>
            <div className="w-1/2">
              <label className="mb-1 block text-xs font-semibold text-slate-500 uppercase tracking-wider">
                Max Amt
              </label>
              <input
                type="number"
                placeholder="Max"
                className="input-field w-full"
                value={maxAmount}
                onChange={(e) => setMaxAmount(e.target.value)}
              />
            </div>
          </div>

          {/* Reset Filters + Export */}
          <div className="sm:col-span-1 flex flex-col gap-2">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={exportingCsv}
              className="btn-primary w-full py-2.5 text-center text-xs font-semibold"
            >
              <ArrowDownTrayIcon className="h-4 w-4" />
              {exportingCsv ? "Exporting…" : "Export CSV"}
            </button>
            <button
              type="button"
              onClick={() => {
                setHistorySearchQuery("");
                setFilterVendorId("");
                setStartDate("");
                setEndDate("");
                setMinAmount("");
                setMaxAmount("");
              }}
              className="btn-secondary w-full py-2.5 text-center text-xs font-semibold"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <PurchaseHistoryTable history={filteredHistory} onView={openInvoice} />

      <AdminFormModal
        open={createOpen}
        title="New Purchase"
        subtitle="Stock is not changed until you review and confirm."
        isDirty={isCreateDirty}
        onClose={closeCreateModal}
        maxWidthClass="max-w-3xl"
        footer={({ requestClose }) => (
          <>
            <button
              type="button"
              className="btn-secondary"
              onClick={requestClose}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn-primary"
              disabled={!canReview}
              onClick={openReview}
            >
              Review Purchase
            </button>
          </>
        )}
      >
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
            Vendor
          </label>
          <select
            className="input-field w-full"
            value={vendorId}
            onChange={(e) => setVendorId(e.target.value)}
          >
            <option value="">Select vendor…</option>
            {vendors.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-3">
          {lines.map((line, index) => {
            const taken = usedPartIds(line.key);
            const parsed = parsedLines.find((p) => p.key === line.key);
            return (
              <div
                key={line.key}
                className="grid gap-3 rounded-xl border border-slate-100 bg-slate-50/80 p-4 sm:grid-cols-12 sm:items-end"
              >
                <div className="sm:col-span-4">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Part {index + 1}
                  </label>
                  <select
                    className="input-field w-full"
                    value={line.partId}
                    onChange={(e) =>
                      updateLine(line.key, { partId: e.target.value })
                    }
                  >
                    <option value="">Select part…</option>
                    {parts.map((p) => (
                      <option
                        key={p.id}
                        value={p.id}
                        disabled={taken.has(String(p.id))}
                      >
                        {p.name} (stock: {p.stock})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Quantity
                  </label>
                  <input
                    className="input-field w-full"
                    type="number"
                    min="1"
                    step="1"
                    value={line.quantity}
                    onChange={(e) =>
                      updateLine(line.key, { quantity: e.target.value })
                    }
                  />
                </div>
                <div className="sm:col-span-4">
                  <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Purchase unit price
                  </label>
                  <input
                    className="input-field w-full"
                    type="number"
                    min="0.01"
                    step="0.01"
                    placeholder="0.00"
                    value={line.unitPrice}
                    onChange={(e) =>
                      updateLine(line.key, { unitPrice: e.target.value })
                    }
                  />
                  <p className="mt-1 text-xs text-slate-500">
                    Line total:{" "}
                    <span className="font-semibold text-slate-700">
                      {parsed?.valid ? formatMoney(parsed.lineTotal) : "—"}
                    </span>
                  </p>
                </div>
                <div className="sm:col-span-2">
                  <button
                    type="button"
                    onClick={() => removeLine(line.key)}
                    className="btn-secondary w-full"
                    disabled={lines.length === 1}
                  >
                    <TrashIcon className="h-4 w-4" />
                    Remove
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        <button type="button" onClick={addLine} className="btn-secondary">
          <PlusIcon className="h-4 w-4" />
          Add another part
        </button>

        {hasDuplicateParts && (
          <p className="text-sm text-amber-700">
            Each part can only appear once per purchase.
          </p>
        )}

        <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-600">
            Estimated grand total (preview only):
          </p>
          <p className="text-xl font-bold text-slate-900">
            {formatMoney(previewGrandTotal)}
          </p>
        </div>
      </AdminFormModal>

      {previewOpen && selectedVendor && (
        <PreviewModal
          vendor={selectedVendor}
          lines={validLines}
          grandTotal={previewGrandTotal}
          loading={loading}
          onClose={() => !loading && backToCreate()}
          onConfirm={handleConfirmPurchase}
        />
      )}

      {invoicePurchase && (
        <InvoiceModal
          purchase={invoicePurchase}
          onClose={() => setInvoicePurchase(null)}
        />
      )}

      <FeedbackPopup
        open={feedback.open}
        title={feedback.title}
        message={feedback.message}
        variant={feedback.variant}
        onClose={() => setFeedback((p) => ({ ...p, open: false }))}
      />
    </>
  );
}

function PurchaseHistoryTable({
  history,
  onView,
}: {
  history: PurchaseRecord[];
  onView: (id: number) => void;
}) {
  const {
    currentPage,
    setCurrentPage,
    totalPages,
    paginatedItems: paginatedHistory,
  } = useTablePagination(history);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-100 px-6 py-4">
        <h3 className="font-semibold text-slate-900">Purchase History</h3>
        <p className="mt-0.5 text-sm text-slate-500">
          {history.length} purchase(s) · {ADMIN_TABLE_PAGE_SIZE} per page
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50">
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Purchase ID
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Vendor
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Purchase date
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Total cost
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {history.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-slate-400">
                  No confirmed purchases yet.
                </td>
              </tr>
            ) : (
              paginatedHistory.map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-slate-100 transition hover:bg-slate-50/80"
                >
                  <td className="px-4 py-3.5 font-mono text-xs text-slate-600">
                    #{p.id}
                  </td>
                  <td className="px-4 py-3.5 font-medium text-slate-900">
                    {p.vendorName}
                  </td>
                  <td className="px-4 py-3.5 text-slate-600">
                    {formatDate(p.purchaseDate)}
                  </td>
                  <td className="px-4 py-3.5 font-semibold text-slate-800">
                    {formatMoney(p.totalAmount)}
                  </td>
                  <td className="px-4 py-3.5">
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => onView(p.id)}
                    >
                      View details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      <ListPagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

function PreviewModal({
  vendor,
  lines,
  grandTotal,
  loading,
  onClose,
  onConfirm,
}: {
  vendor: VendorOption;
  lines: ParsedLine[];
  grandTotal: number;
  loading: boolean;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <ModalShell title="Review purchase" onClose={onClose}>
      <div className="space-y-4 text-sm">
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Vendor
          </p>
          <p className="mt-1 font-semibold text-slate-900">{vendor.name}</p>
          <p className="text-slate-600">{vendor.phone}</p>
          <p className="text-slate-600">{vendor.address}</p>
        </div>

        <PurchaseItemsTable
          rows={lines.map((l) => ({
            key: String(l.partId),
            partName: l.partName,
            quantity: l.quantity,
            unitPrice: l.unitPrice,
            lineTotal: l.lineTotal,
          }))}
        />

        <p className="text-right text-lg font-bold text-slate-900">
          Grand total: {formatMoney(grandTotal)}
        </p>

        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          Confirming will save this purchase, update stock for each part, and
          create a viewable purchase record.
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className="btn-secondary"
            disabled={loading}
            onClick={onClose}
          >
            Back
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={loading}
            onClick={onConfirm}
          >
            {loading ? "Confirming…" : "Confirm Purchase"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

function numberToWords(num: number): string {
  if (num === 0) return "Zero Rupees Only";
  
  const a = [
    "", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"
  ];
  const b = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];

  const formatTens = (n: number) => {
    if (n < 20) return a[n];
    return b[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + a[n % 10] : "");
  };

  const formatHundreds = (n: number) => {
    if (n > 99) {
      return a[Math.floor(n / 100)] + " Hundred" + (n % 100 !== 0 ? " and " + formatTens(n % 100) : "");
    }
    return formatTens(n);
  };

  const formatThousands = (n: number) => {
    if (n > 999) {
      return formatHundreds(Math.floor(n / 1000)) + " Thousand" + (n % 1000 !== 0 ? " " + formatHundreds(n % 1000) : "");
    }
    return formatHundreds(n);
  };

  const formatLakhs = (n: number) => {
    if (n > 99999) {
      return formatHundreds(Math.floor(n / 100000)) + " Lakh" + (n % 100000 !== 0 ? " " + formatThousands(n % 100000) : "");
    }
    return formatThousands(n);
  };

  const integerPart = Math.floor(num);
  const decimalPart = Math.round((num - integerPart) * 100);

  let result = formatLakhs(integerPart) + " Rupees";
  if (decimalPart > 0) {
    result += " and " + formatTens(decimalPart) + " Paisa";
  }
  return result + " Only";
}

function InvoiceModal({
  purchase,
  onClose,
}: {
  purchase: PurchaseRecord;
  onClose: () => void;
}) {
  const handlePrint = () => {
    window.print();
  };

  // Assume the total amount is inclusive of 13% VAT
  const total = purchase.totalAmount;
  const subtotal = total / 1.13;
  const vatAmount = total - subtotal;

  return (
    <ModalShell
      title="Purchase Invoice"
      subtitle={`Invoice ID: GP-PUR-2026-${purchase.id}`}
      onClose={onClose}
    >
      {/* Print CSS styling wrapper */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          .print-area, .print-area * {
            visibility: visible;
          }
          .print-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            border: none !important;
            box-shadow: none !important;
            padding: 20px !important;
            margin: 0 !important;
            background: white !important;
            color: black !important;
          }
          .print-btn {
            display: none !important;
          }
        }
      `}</style>

      <div className="space-y-6">
        {/* Print Action Header */}
        <div className="flex justify-end print-btn">
          <button
            type="button"
            onClick={handlePrint}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm transition hover:bg-slate-100 hover:text-slate-900"
          >
            <PrinterIcon className="h-4 w-4" />
            Print / Save PDF
          </button>
        </div>

        {/* Invoice Body (Printed Area) */}
        <div className="print-area rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
          {/* Invoice Header Brand */}
          <div className="flex flex-col justify-between border-b border-slate-200 pb-5 sm:flex-row sm:items-center">
            <div>
              <h1 className="text-xl font-bold tracking-tight text-slate-900">
                GADI PARTS SELLING & INVENTORY
              </h1>
              <p className="text-xs text-slate-500">
                Kathmandu, Nepal | Phone: +977-1-4400000 | Email: accounts@gadiparts.com
              </p>
            </div>
            <div className="mt-3 text-left sm:mt-0 sm:text-right">
              <h2 className="text-sm font-extrabold uppercase tracking-widest text-slate-400">
                Purchase Invoice
              </h2>
              <p className="font-mono text-sm text-slate-700">GP-PUR-2026-{purchase.id}</p>
              <p className="text-xs text-slate-500">Date: {formatDate(purchase.purchaseDate)}</p>
            </div>
          </div>

          {/* Supplier and Billing Details */}
          <div className="my-5 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl bg-slate-50/50 p-4 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Supplier (Vendor)
              </p>
              <p className="mt-1 font-bold text-slate-900">{purchase.vendorName}</p>
              <p className="text-xs text-slate-600">Tel: {purchase.vendorPhone}</p>
              <p className="text-xs text-slate-600">Loc: {purchase.vendorAddress}</p>
            </div>
            <div className="rounded-xl bg-slate-50/50 p-4 border border-slate-100">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Bill To
              </p>
              <p className="mt-1 font-bold text-slate-900">GadiParts Central Hub</p>
              <p className="text-xs text-slate-600">Corporate Stock Division</p>
              <p className="text-xs text-slate-600">Kathmandu, Nepal</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">S.N.</th>
                  <th className="px-4 py-2.5 text-left text-xs font-semibold uppercase text-slate-500">Part Description</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-slate-500">Qty</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-slate-500">Rate</th>
                  <th className="px-4 py-2.5 text-right text-xs font-semibold uppercase text-slate-500">Total</th>
                </tr>
              </thead>
              <tbody>
                {purchase.purchaseItems.map((item, idx) => (
                  <tr key={item.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/30">
                    <td className="px-4 py-3 text-xs text-slate-500">{idx + 1}</td>
                    <td className="px-4 py-3 text-sm font-medium text-slate-800">{item.partName}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700">{item.quantity}</td>
                    <td className="px-4 py-3 text-right text-sm text-slate-700">{formatMoney(item.price)}</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold text-slate-950">{formatMoney(item.lineTotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pricing Summary */}
          <div className="mt-6 flex flex-col justify-between gap-4 border-t border-slate-100 pt-5 sm:flex-row">
            <div className="max-w-md">
              <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                Amount in Words
              </p>
              <p className="mt-1 text-xs font-medium italic text-slate-700">
                {numberToWords(total)}
              </p>
            </div>
            <div className="w-full sm:w-64">
              <div className="space-y-1.5 text-sm text-slate-600">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>{formatMoney(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>VAT (13% Incl.):</span>
                  <span>{formatMoney(vatAmount)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-bold text-slate-900">
                  <span>Total Amount:</span>
                  <span>{formatMoney(total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Terms and Sign-off */}
          <div className="mt-12 flex justify-between items-end">
            <div className="text-xs text-slate-400">
              <p>1. Returns allowed only within 7 days of invoice date.</p>
              <p>2. Computer generated receipt. No signature required.</p>
            </div>
            <div className="w-48 border-t border-slate-300 pt-2 text-center text-xs font-semibold text-slate-600">
              Authorized Signature
            </div>
          </div>
        </div>
      </div>
    </ModalShell>
  );
}

function PurchaseItemsTable({
  rows,
}: {
  rows: {
    key: string;
    partName: string;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }[];
}) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 bg-slate-50">
            <th className="px-3 py-2 text-left text-xs font-semibold uppercase text-slate-500">
              Part
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-slate-500">
              Qty
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-slate-500">
              Unit price
            </th>
            <th className="px-3 py-2 text-right text-xs font-semibold uppercase text-slate-500">
              Line total
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key} className="border-b border-slate-100">
              <td className="px-3 py-2.5 text-slate-800">{row.partName}</td>
              <td className="px-3 py-2.5 text-right text-slate-700">
                {row.quantity}
              </td>
              <td className="px-3 py-2.5 text-right text-slate-700">
                {formatMoney(row.unitPrice)}
              </td>
              <td className="px-3 py-2.5 text-right font-medium text-slate-900">
                {formatMoney(row.lineTotal)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ModalShell({
  title,
  subtitle,
  onClose,
  children,
}: {
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-900/45 p-4">
      <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
          </div>
          <button type="button" onClick={onClose} className="btn-secondary !p-2">
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  );
}
