import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ChartBarIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import API from "../../services/api";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import { formatMoney } from "../../utils/invoiceFormat";

type ReportTab = "regular" | "high" | "pending";

type CustomerReportRow = {
  customerId: number;
  fullName: string;
  email: string;
  phone: string;
  vehicleNumbers?: string[];
  totalPurchases: number;
  totalSpent: number;
};

type PendingCreditRow = {
  saleId: number;
  customerId: number;
  fullName: string;
  email: string;
  phone: string;
  finalAmount: number;
  paymentStatus: string;
  saleDate: string;
  items?: { partName: string; quantity: number }[];
};

const tabs: { id: ReportTab; label: string; icon: typeof UserGroupIcon }[] = [
  { id: "regular", label: "Regular customers", icon: UserGroupIcon },
  { id: "high", label: "High spenders", icon: CurrencyDollarIcon },
  { id: "pending", label: "Pending credits", icon: ChartBarIcon },
];

export default function StaffReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>("regular");
  const [minAmount, setMinAmount] = useState("5000");
  const [customerRows, setCustomerRows] = useState<CustomerReportRow[]>([]);
  const [pendingRows, setPendingRows] = useState<PendingCreditRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchReport = useCallback(async (tab: ReportTab, minSpend?: number) => {
    setLoading(true);
    setError("");
    setCustomerRows([]);
    setPendingRows([]);

    try {
      if (tab === "regular") {
        const res = await API.get<CustomerReportRow[]>(
          "/staff/reports/regular-customers"
        );
        setCustomerRows(res.data);
      } else if (tab === "high") {
        const amount = minSpend ?? 5000;
        const res = await API.get<CustomerReportRow[]>(
          `/staff/reports/high-spenders?minAmount=${amount}`
        );
        setCustomerRows(res.data);
      } else {
        const res = await API.get<PendingCreditRow[]>(
          "/staff/reports/pending-credits"
        );
        setPendingRows(res.data);
      }
    } catch {
      setError("Unable to load report. Check that you are logged in as Staff and the API is running.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchReport("regular");
  }, [fetchReport]);

  const handleTabClick = (tab: ReportTab) => {
    if (tab === activeTab && !error) return;
    setActiveTab(tab);
    const minSpend =
      tab === "high" ? Number(minAmount) || 5000 : undefined;
    fetchReport(tab, minSpend);
  };

  const applyHighSpenderFilter = () => {
    const minSpend = Number(minAmount) || 5000;
    fetchReport("high", minSpend);
  };

  const emptyMessage =
    activeTab === "regular"
      ? "No regular customers yet (needs 2 or more purchases)."
      : activeTab === "high"
        ? "No customers above the minimum spend threshold."
        : "No pending credit sales.";

  return (
    <>
      <AdminPageHeader
        title="Customer Reports"
        description="Regular customers, high spenders, and outstanding credit payments."
      />

      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTabClick(tab.id)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition ${
                active
                  ? "border-slate-800 bg-slate-800 text-white"
                  : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {activeTab === "high" && (
        <div className="mb-4 flex flex-wrap items-end gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
          <div>
            <label className="mb-1 block text-xs font-semibold uppercase tracking-wider text-slate-500">
              Minimum total spent (Rs)
            </label>
            <input
              className="input-field w-40"
              type="number"
              min={0}
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
            />
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={applyHighSpenderFilter}
            disabled={loading}
          >
            Apply filter
          </button>
        </div>
      )}

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-slate-900">
            {tabs.find((t) => t.id === activeTab)?.label}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {loading
              ? "Loading…"
              : activeTab === "pending"
                ? `${pendingRows.length} record(s)`
                : `${customerRows.length} customer(s)`}
          </p>
        </div>

        {loading ? (
          <p className="px-6 py-12 text-center text-slate-500">Loading report…</p>
        ) : activeTab !== "pending" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    ID
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Contact
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Vehicles
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Purchases
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Total spent
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {customerRows.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-10 text-center text-slate-400">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  customerRows.map((row) => (
                    <tr
                      key={row.customerId}
                      className="border-b border-slate-100 hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                        #{row.customerId}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-900">
                        {row.fullName}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">
                        <p>{row.phone}</p>
                        <p className="text-xs">{row.email}</p>
                      </td>
                      <td className="max-w-[160px] px-4 py-3.5 text-xs text-slate-600">
                        {row.vehicleNumbers?.length
                          ? row.vehicleNumbers.join(", ")
                          : "—"}
                      </td>
                      <td className="px-4 py-3.5 text-right text-slate-700">
                        {row.totalPurchases}
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-slate-900">
                        {formatMoney(row.totalSpent)}
                      </td>
                      <td className="px-4 py-3.5">
                        <Link
                          to={`/staff/customers/${row.customerId}`}
                          className="btn-secondary inline-flex text-xs"
                        >
                          View customer
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Sale
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-semibold uppercase text-slate-500">
                    Due
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Date
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-slate-500">
                    Items
                  </th>
                </tr>
              </thead>
              <tbody>
                {pendingRows.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                      {emptyMessage}
                    </td>
                  </tr>
                ) : (
                  pendingRows.map((row) => (
                    <tr
                      key={row.saleId}
                      className="border-b border-slate-100 hover:bg-slate-50/80"
                    >
                      <td className="px-4 py-3.5 font-mono text-xs text-slate-500">
                        #{row.saleId}
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="font-semibold text-slate-900">{row.fullName}</p>
                        <p className="text-xs text-slate-600">{row.phone}</p>
                        <Link
                          to={`/staff/customers/${row.customerId}`}
                          className="text-xs font-medium text-slate-700 underline-offset-2 hover:underline"
                        >
                          View customer
                        </Link>
                      </td>
                      <td className="px-4 py-3.5 text-right font-semibold text-amber-800">
                        {formatMoney(row.finalAmount)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600">{row.paymentStatus}</td>
                      <td className="px-4 py-3.5 text-slate-600">
                        {new Date(row.saleDate).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3.5 text-xs text-slate-600">
                        {row.items?.map((item) => (
                          <div key={`${row.saleId}-${item.partName}`}>
                            {item.partName} × {item.quantity}
                          </div>
                        )) ?? "—"}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
