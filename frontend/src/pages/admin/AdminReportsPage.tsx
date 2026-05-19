import { useEffect, useState, useCallback, useMemo } from "react";
import {
  ChartBarIcon,
  CalendarDaysIcon,
  ArrowTrendingUpIcon,
  ArrowTrendingDownIcon,
  BanknotesIcon,
  ShoppingBagIcon,
} from "@heroicons/react/24/outline";
import API from "../../services/api";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import FeedbackPopup from "../../components/admin/FeedbackPopup";

type ReportSummary = {
  totalSalesCount: number;
  totalSalesRaw: number;
  totalSalesRevenue: number;
  totalDiscount: number;
  totalPurchasesCount: number;
  totalPurchasesCost: number;
  netProfit: number;
};

type TopPart = {
  partId: number;
  partName: string;
  quantitySold: number;
  totalRevenue: number;
};

type SaleDetail = {
  id: number;
  date: string;
  total: number;
  discount: number;
  final: number;
  status: string;
};

type PurchaseDetail = {
  id: number;
  date: string;
  total: number;
};

type ReportData = {
  period: string;
  startDate: string;
  endDate: string;
  summary: ReportSummary;
  topParts: TopPart[];
  sales: SaleDetail[];
  purchases: PurchaseDetail[];
};

const formatMoney = (n: number) =>
  `Rs ${n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

export default function AdminReportsPage() {
  const [period, setPeriod] = useState<"daily" | "monthly" | "yearly">("monthly");
  const [year, setYear] = useState(new Date().getFullYear());
  const [month, setMonth] = useState(new Date().getMonth() + 1);
  const [day, setDay] = useState(new Date().getDate());
  
  const [data, setData] = useState<ReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [showSales, setShowSales] = useState(true);
  const [showPurchases, setShowPurchases] = useState(true);

  const activeProfit = useMemo(() => {
    if (!data) return 0;
    const s = showSales ? data.summary.totalSalesRevenue : 0;
    const p = showPurchases ? data.summary.totalPurchasesCost : 0;
    return s - p;
  }, [data, showSales, showPurchases]);
  const [feedback, setFeedback] = useState<{ open: boolean; title: string; message: string; variant: "success" | "error" }>({
    open: false,
    title: "",
    message: "",
    variant: "success",
  });

  const loadReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await API.get<ReportData>("/reports/finance", {
        params: {
          period,
          year,
          month: period !== "yearly" ? month : undefined,
          day: period === "daily" ? day : undefined,
        },
      });
      setData(res.data);
    } catch {
      setFeedback({
        open: true,
        title: "Load failed",
        message: "Failed to load financial report.",
        variant: "error",
      });
    } finally {
      setLoading(false);
    }
  }, [period, year, month, day]);

  useEffect(() => {
    loadReport();
  }, [loadReport]);

  const chartData = useMemo(() => {
    if (!data) return { labels: [], sales: [], purchases: [] };

    const salesMap = new Map<string, number>();
    const purchasesMap = new Map<string, number>();

    if (period === "daily") {
      for (let h = 0; h < 24; h++) {
        const key = `${h.toString().padStart(2, "0")}:00`;
        salesMap.set(key, 0);
        purchasesMap.set(key, 0);
      }
      data.sales.forEach((s) => {
        const hour = new Date(s.date).getHours();
        const key = `${hour.toString().padStart(2, "0")}:00`;
        salesMap.set(key, (salesMap.get(key) ?? 0) + s.final);
      });
      data.purchases.forEach((p) => {
        const hour = new Date(p.date).getHours();
        const key = `${hour.toString().padStart(2, "0")}:00`;
        purchasesMap.set(key, (purchasesMap.get(key) ?? 0) + p.total);
      });
    } else if (period === "monthly") {
      const daysInMonth = new Date(year, month, 0).getDate();
      for (let d = 1; d <= daysInMonth; d++) {
        const key = `${d}`;
        salesMap.set(key, 0);
        purchasesMap.set(key, 0);
      }
      data.sales.forEach((s) => {
        const dayNum = new Date(s.date).getDate();
        const key = `${dayNum}`;
        salesMap.set(key, (salesMap.get(key) ?? 0) + s.final);
      });
      data.purchases.forEach((p) => {
        const dayNum = new Date(p.date).getDate();
        const key = `${dayNum}`;
        purchasesMap.set(key, (purchasesMap.get(key) ?? 0) + p.total);
      });
    } else {
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      monthNames.forEach((m) => {
        salesMap.set(m, 0);
        purchasesMap.set(m, 0);
      });
      data.sales.forEach((s) => {
        const mIdx = new Date(s.date).getMonth();
        const key = monthNames[mIdx];
        salesMap.set(key, (salesMap.get(key) ?? 0) + s.final);
      });
      data.purchases.forEach((p) => {
        const mIdx = new Date(p.date).getMonth();
        const key = monthNames[mIdx];
        purchasesMap.set(key, (purchasesMap.get(key) ?? 0) + p.total);
      });
    }

    const labels = Array.from(salesMap.keys());
    const salesVals = Array.from(salesMap.values());
    const purchasesVals = Array.from(purchasesMap.values());

    return { labels, sales: salesVals, purchases: purchasesVals };
  }, [data, period, year, month]);

  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);
  const months = Array.from({ length: 12 }, (_, i) => i + 1);
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  return (
    <>
      <AdminPageHeader
        title="Financial Reports"
        description="Monitor system revenues, vendor purchase costs, discounts, and item metrics."
      />

      {/* Filter Toolbar */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/75 bg-white p-4 shadow-[0_1px_3px_0_rgb(0,0,0,0.02)]">
        <div className="flex items-center gap-1 rounded-xl bg-slate-100 p-1">
          {(["daily", "monthly", "yearly"] as const).map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`rounded-lg px-4 py-1.5 text-xs font-semibold capitalize transition-all ${
                period === p
                  ? "bg-white text-slate-900 shadow-sm ring-1 ring-black/5"
                  : "text-slate-500 hover:bg-slate-200/50 hover:text-slate-900"
              }`}
            >
              {p}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1.5 text-slate-500">
            <CalendarDaysIcon className="h-4 w-4" />
            <span className="text-xs font-medium">Period:</span>
          </div>

          <select
            className="rounded-lg border-0 bg-slate-50 py-1.5 pl-3 pr-8 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200/75 focus:ring-2 focus:ring-inset focus:ring-slate-900"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>

          {period !== "yearly" && (
            <select
              className="rounded-lg border-0 bg-slate-50 py-1.5 pl-3 pr-8 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200/75 focus:ring-2 focus:ring-inset focus:ring-slate-900"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
            >
              {months.map((m) => (
                <option key={m} value={m}>
                  {new Date(2000, m - 1).toLocaleString(undefined, { month: "long" })}
                </option>
              ))}
            </select>
          )}

          {period === "daily" && (
            <select
              className="rounded-lg border-0 bg-slate-50 py-1.5 pl-3 pr-8 text-sm font-medium text-slate-700 ring-1 ring-inset ring-slate-200/75 focus:ring-2 focus:ring-inset focus:ring-slate-900"
              value={day}
              onChange={(e) => setDay(Number(e.target.value))}
            >
              {days.map((d) => (
                <option key={d} value={d}>
                  Day {d}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="text-sm font-medium text-slate-500">Generating report details…</div>
        </div>
      ) : data ? (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Sales Card */}
            <div className={`group relative overflow-hidden rounded-2xl border border-slate-200/75 bg-white p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.02)] transition-all hover:shadow-md ${!showSales ? "opacity-50 grayscale-[50%]" : ""}`}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Gross Revenue</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-50 text-emerald-600 ring-1 ring-inset ring-emerald-500/20">
                  <ArrowTrendingUpIcon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {formatMoney(data.summary.totalSalesRevenue)}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{data.summary.totalSalesCount} invoices</span>
                {data.summary.totalDiscount > 0 && (
                  <span className="text-slate-400">Includes {formatMoney(data.summary.totalDiscount)} desc.</span>
                )}
              </div>
            </div>

            {/* Purchases Card */}
            <div className={`group relative overflow-hidden rounded-2xl border border-slate-200/75 bg-white p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.02)] transition-all hover:shadow-md ${!showPurchases ? "opacity-50 grayscale-[50%]" : ""}`}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Purchase Costs</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-rose-50 text-rose-600 ring-1 ring-inset ring-rose-500/20">
                  <ArrowTrendingDownIcon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {formatMoney(data.summary.totalPurchasesCost)}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="font-medium text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full">{data.summary.totalPurchasesCount} orders</span>
              </div>
            </div>

            {/* Net Profit Card */}
            <div className={`group relative overflow-hidden rounded-2xl border border-slate-200/75 bg-white p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.02)] transition-all hover:shadow-md ${(!showSales && !showPurchases) ? "opacity-50 grayscale-[50%]" : ""}`}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Net Margin</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600 ring-1 ring-inset ring-blue-500/20">
                  <BanknotesIcon className="h-4 w-4" />
                </div>
              </div>
              <p className={`text-2xl font-bold tracking-tight ${activeProfit >= 0 ? "text-slate-900" : "text-rose-600"}`}>
                {formatMoney(activeProfit)}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className={`font-medium px-2 py-0.5 rounded-full ${activeProfit >= 0 ? "bg-emerald-50 text-emerald-700" : "bg-rose-50 text-rose-700"}`}>
                  {activeProfit >= 0 ? "Surplus" : "Deficit"}
                </span>
              </div>
            </div>

            {/* Average Order Value (AOV) Card */}
            <div className={`group relative overflow-hidden rounded-2xl border border-slate-200/75 bg-white p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.02)] transition-all hover:shadow-md ${!showSales ? "opacity-50 grayscale-[50%]" : ""}`}>
              <div className="mb-3 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Avg Ticket Size</p>
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-50 text-violet-600 ring-1 ring-inset ring-violet-500/20">
                  <ChartBarIcon className="h-4 w-4" />
                </div>
              </div>
              <p className="text-2xl font-bold tracking-tight text-slate-900">
                {formatMoney(data.summary.totalSalesCount > 0 ? data.summary.totalSalesRevenue / data.summary.totalSalesCount : 0)}
              </p>
              <div className="mt-3 flex items-center justify-between text-xs">
                <span className="font-medium text-violet-600 bg-violet-50 px-2 py-0.5 rounded-full">Per Invoice</span>
              </div>
            </div>
          </div>

          {/* Charts Row */}
          <div className="grid gap-5 md:grid-cols-3">
            <div className="md:col-span-2">
              <SVGLineChart
                labels={chartData.labels}
                sales={chartData.sales}
                purchases={chartData.purchases}
                showSales={showSales}
                showPurchases={showPurchases}
                onToggleSales={setShowSales}
                onTogglePurchases={setShowPurchases}
              />
            </div>
            <div className="md:col-span-1">
              <SVGMarginDonut
                revenue={data.summary.totalSalesRevenue}
                cost={data.summary.totalPurchasesCost}
                profit={data.summary.netProfit}
                showSales={showSales}
                showPurchases={showPurchases}
              />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            {/* Top Selling Parts */}
            <div className={`rounded-2xl border border-slate-200/75 bg-white shadow-[0_1px_3px_0_rgb(0,0,0,0.02)] lg:col-span-1 transition-all duration-300 flex flex-col ${!showSales ? "opacity-50 pointer-events-none grayscale-[50%]" : ""}`}>
              <div className="border-b border-slate-100 px-6 py-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <ShoppingBagIcon className="h-5 w-5 text-slate-400" />
                  Top Selling Parts
                </h3>
              </div>
              <div className="flex-1 p-6">
                {data.topParts.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-slate-400">No parts sold.</div>
                ) : (
                  <div className="space-y-4">
                    {data.topParts.map((tp, idx) => (
                      <div key={tp.partId} className="flex items-center justify-between border-b border-slate-50 pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="text-sm font-semibold text-slate-900">
                            {idx + 1}. {tp.partName}
                          </p>
                          <p className="text-xs text-slate-400">Qty: {tp.quantitySold} units</p>
                        </div>
                        <p className="text-sm font-bold text-slate-800">{formatMoney(tp.totalRevenue)}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Sales Invoice Logs */}
            <div className={`rounded-2xl border border-slate-200/75 bg-white shadow-[0_1px_3px_0_rgb(0,0,0,0.02)] lg:col-span-2 transition-all duration-300 overflow-hidden flex flex-col ${!showSales ? "opacity-50 pointer-events-none grayscale-[50%]" : ""}`}>
              <div className="border-b border-slate-100 px-6 py-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <ChartBarIcon className="h-5 w-5 text-slate-400" />
                  Sales Invoices Breakdown
                </h3>
              </div>
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10">
                    <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3">Invoice ID</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3">Total Amount</th>
                      <th className="px-6 py-3 text-right">Final Received</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.sales.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-slate-400">
                          No sales recorded in this period.
                        </td>
                      </tr>
                    ) : (
                      data.sales.map((sale) => (
                        <tr key={sale.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5 font-mono text-xs text-slate-600">#{sale.id}</td>
                          <td className="px-6 py-3.5 text-xs text-slate-500">{formatDate(sale.date)}</td>
                          <td className="px-6 py-3.5 text-xs text-slate-600">{formatMoney(sale.total)}</td>
                          <td className="px-6 py-3.5 text-right font-semibold text-slate-900">{formatMoney(sale.final)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Purchase Invoice Logs */}
            <div className={`rounded-2xl border border-slate-200/75 bg-white shadow-[0_1px_3px_0_rgb(0,0,0,0.02)] lg:col-span-3 transition-all duration-300 overflow-hidden flex flex-col ${!showPurchases ? "opacity-50 pointer-events-none grayscale-[50%]" : ""}`}>
              <div className="border-b border-slate-100 px-6 py-5">
                <h3 className="flex items-center gap-2 text-sm font-bold text-slate-900">
                  <ShoppingBagIcon className="h-5 w-5 text-slate-400" />
                  Purchase Invoices Breakdown
                </h3>
              </div>
              <div className="max-h-80 overflow-auto">
                <table className="w-full text-left text-sm">
                  <thead className="sticky top-0 bg-slate-50/80 backdrop-blur-sm z-10">
                    <tr className="border-b border-slate-200 text-xs font-semibold uppercase tracking-wider text-slate-500">
                      <th className="px-6 py-3">Purchase ID</th>
                      <th className="px-6 py-3">Date</th>
                      <th className="px-6 py-3 text-right">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {data.purchases.length === 0 ? (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-slate-400">
                          No purchases recorded in this period.
                        </td>
                      </tr>
                    ) : (
                      data.purchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-slate-50/50 transition-colors">
                          <td className="px-6 py-3.5 font-mono text-xs text-slate-600">#{purchase.id}</td>
                          <td className="px-6 py-3.5 text-xs text-slate-500">{formatDate(purchase.date)}</td>
                          <td className="px-6 py-3.5 text-right font-semibold text-slate-900">{formatMoney(purchase.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-10 text-slate-500">No report generated. Check filter options.</div>
      )}

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

function SVGLineChart({
  labels,
  sales,
  purchases,
  showSales,
  showPurchases,
  onToggleSales,
  onTogglePurchases,
}: {
  labels: string[];
  sales: number[];
  purchases: number[];
  showSales: boolean;
  showPurchases: boolean;
  onToggleSales: (val: boolean) => void;
  onTogglePurchases: (val: boolean) => void;
}) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [curveType, setCurveType] = useState<"curved" | "straight">("curved");

  // Filter values based on active toggles to calculate dynamic height auto-scaling
  const activeValues: number[] = [];
  if (showSales) activeValues.push(...sales);
  if (showPurchases) activeValues.push(...purchases);

  const maxVal = Math.max(1000, ...activeValues) * 1.15;
  const width = 600;
  const height = 240;
  const paddingLeft = 55;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;

  const chartWidth = width - paddingLeft - paddingRight;
  const chartHeight = height - paddingTop - paddingBottom;

  const getCoordinates = (val: number, idx: number) => {
    const x = paddingLeft + (idx / Math.max(1, labels.length - 1)) * chartWidth;
    const y = paddingTop + chartHeight - (val / maxVal) * chartHeight;
    return { x, y };
  };

  const salesPoints = sales.map((val, idx) => getCoordinates(val, idx));
  const purchasePoints = purchases.map((val, idx) => getCoordinates(val, idx));

  // Straight line path builder
  const buildStraightPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    return `M ${points[0].x} ${points[0].y} ` + points.slice(1).map((p) => `L ${p.x} ${p.y}`).join(" ");
  };

  // Smooth bezier curve path builder
  const buildSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const activePathBuilder = curveType === "curved" ? buildSmoothPath : buildStraightPath;

  const buildAreaPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return "";
    const startX = points[0].x;
    const endX = points[points.length - 1].x;
    const baseY = paddingTop + chartHeight;
    return `${activePathBuilder(points)} L ${endX} ${baseY} L ${startX} ${baseY} Z`;
  };

  const yTicks = [0, 0.25, 0.5, 0.75, 1].map((pct) => pct * maxVal);

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-slate-200/75 bg-white p-6 shadow-[0_1px_3px_0_rgb(0,0,0,0.02)]">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h4 className="text-sm font-bold text-slate-900">Sales & Purchases Trend</h4>
          <p className="text-xs text-slate-400">Interactive financial performance logs</p>
        </div>
        
        {/* Adjustment Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Curve Type Selector */}
          <button
            type="button"
            onClick={() => setCurveType(prev => prev === "curved" ? "straight" : "curved")}
            className="rounded-lg border border-slate-100 bg-slate-50 px-2.5 py-1 text-[10px] font-semibold text-slate-600 transition hover:bg-slate-100"
          >
            {curveType === "curved" ? "Curved Path" : "Straight Path"}
          </button>

          {/* Toggle Sales */}
          <button
            type="button"
            onClick={() => onToggleSales(!showSales)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold transition ${
              showSales
                ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${showSales ? "bg-emerald-500" : "bg-slate-350"}`} />
            Sales
          </button>

          {/* Toggle Purchases */}
          <button
            type="button"
            onClick={() => onTogglePurchases(!showPurchases)}
            className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold transition ${
              showPurchases
                ? "bg-rose-50 text-rose-700 hover:bg-rose-100"
                : "bg-slate-100 text-slate-400 hover:bg-slate-200"
            }`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${showPurchases ? "bg-rose-500" : "bg-slate-350"}`} />
            Purchases
          </button>
        </div>
      </div>

      <div className="relative h-[220px]">
        <svg viewBox={`0 0 ${width} ${height}`} className="h-full w-full" preserveAspectRatio="xMidYMid meet">
          <defs>
            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10B981" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#10B981" stopOpacity="0.00" />
            </linearGradient>
            <linearGradient id="purchasesGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#F43F5E" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#F43F5E" stopOpacity="0.00" />
            </linearGradient>

            {/* Glowing filter for lines */}
            <filter id="glowSales" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#10B981" floodOpacity="0.12" />
            </filter>
            <filter id="glowPurchases" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#F43F5E" floodOpacity="0.10" />
            </filter>
          </defs>

          {/* Dotted Grid Lines */}
          {yTicks.map((tick, i) => {
            const y = paddingTop + chartHeight - (tick / maxVal) * chartHeight;
            return (
              <g key={i}>
                <line
                  x1={paddingLeft}
                  y1={y}
                  x2={width - paddingRight}
                  y2={y}
                  stroke="#F1F5F9"
                  strokeWidth="1.25"
                  strokeDasharray="4 4"
                />
                <text
                  x={paddingLeft - 8}
                  y={y + 3.5}
                  textAnchor="end"
                  className="fill-slate-400 font-sans text-[9px] font-medium"
                >
                  {tick >= 1000 ? `${(tick / 1000).toFixed(0)}k` : tick.toFixed(0)}
                </text>
              </g>
            );
          })}

          {/* X Axis Labels */}
          {labels.map((label, idx) => {
            if (labels.length > 12 && idx % 3 !== 0 && idx !== labels.length - 1) return null;
            const x = paddingLeft + (idx / Math.max(1, labels.length - 1)) * chartWidth;
            return (
              <text
                key={idx}
                x={x}
                y={height - 10}
                textAnchor="middle"
                className="fill-slate-400 font-sans text-[9px] font-medium"
              >
                {label}
              </text>
            );
          })}

          {/* Area Fills under curves */}
          {showSales && salesPoints.length > 0 && <path d={buildAreaPath(salesPoints)} fill="url(#salesGrad)" />}
          {showPurchases && purchasePoints.length > 0 && <path d={buildAreaPath(purchasePoints)} fill="url(#purchasesGrad)" />}

          {/* Line Strokes with subtle drop shadow filter */}
          {showSales && salesPoints.length > 0 && (
            <path
              d={activePathBuilder(salesPoints)}
              fill="none"
              stroke="#10B981"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glowSales)"
            />
          )}
          {showPurchases && purchasePoints.length > 0 && (
            <path
              d={activePathBuilder(purchasePoints)}
              fill="none"
              stroke="#F43F5E"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#glowPurchases)"
            />
          )}

          {/* Interactive Mouse Hover Slices */}
          {labels.map((_, idx) => {
            const sp = salesPoints[idx];
            const pp = purchasePoints[idx];
            const isHovered = hoveredIdx === idx;
            const triggerWidth = chartWidth / Math.max(1, labels.length - 1);

            return (
              <g key={idx}>
                <rect
                  x={sp.x - triggerWidth / 2}
                  y={paddingTop}
                  width={triggerWidth}
                  height={chartHeight}
                  fill="transparent"
                  className="cursor-pointer"
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                />

                {isHovered && (
                  <>
                    <line
                      x1={sp.x}
                      y1={paddingTop}
                      x2={sp.x}
                      y2={paddingTop + chartHeight}
                      stroke="#CBD5E1"
                      strokeWidth="1.25"
                      strokeDasharray="3 3"
                    />
                    {showSales && (
                      <g>
                        <circle cx={sp.x} cy={sp.y} r="8" className="fill-emerald-500/20" />
                        <circle cx={sp.x} cy={sp.y} r="4" className="fill-emerald-500 stroke-white stroke-[1.5]" />
                      </g>
                    )}
                    {showPurchases && pp && (
                      <g>
                        <circle cx={pp.x} cy={pp.y} r="8" className="fill-rose-500/20" />
                        <circle cx={pp.x} cy={pp.y} r="4" className="fill-rose-500 stroke-white stroke-[1.5]" />
                      </g>
                    )}
                  </>
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Tooltip positioned relative to active points */}
        {hoveredIdx !== null && (showSales || showPurchases) && (
          <div
            className="absolute rounded-xl border border-slate-800 bg-slate-950/90 backdrop-blur-md p-3 text-[10px] text-white shadow-xl pointer-events-none z-10 transition-all duration-100"
            style={{
              left: `${Math.min(
                width - 150,
                Math.max(10, paddingLeft + (hoveredIdx / Math.max(1, labels.length - 1)) * chartWidth - 65)
              )}px`,
              top: `${Math.max(
                5,
                Math.min(
                  showSales ? salesPoints[hoveredIdx]?.y : 9999,
                  showPurchases ? purchasePoints[hoveredIdx]?.y : 9999
                ) - 75
              )}px`,
            }}
          >
            <div className="absolute left-1/2 -bottom-1 h-2 w-2 -translate-x-1/2 rotate-45 border-b border-r border-slate-850 bg-slate-950" />
            <p className="font-bold text-slate-400 mb-1">Period: {labels[hoveredIdx]}</p>
            {showSales && (
              <p className="font-bold text-emerald-400 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Sales: {formatMoney(sales[hoveredIdx])}
              </p>
            )}
            {showPurchases && (
              <p className="font-bold text-rose-450 flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-400" />
                Purchases: {formatMoney(purchases[hoveredIdx])}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function SVGMarginDonut({
  revenue,
  cost,
  profit: _profit,
  showSales,
  showPurchases,
}: {
  revenue: number;
  cost: number;
  profit: number;
  showSales: boolean;
  showPurchases: boolean;
}) {
  // If either sales or purchases is disabled, we adjust the values
  const activeRev = showSales ? revenue : 0;
  const activeCost = showPurchases ? cost : 0;
  const activeProfit = activeRev - activeCost;

  const total = activeRev || 1;
  const costPct = activeRev > 0 ? (activeCost / total) * 100 : 100;
  const profitPct = activeRev > 0 ? (Math.max(0, activeProfit) / total) * 100 : 0;

  // Stroke math
  const costStroke = 314.16 * (costPct / 100);
  const profitStroke = 314.16 * (profitPct / 100);

  return (
    <div className={`w-full rounded-2xl border border-slate-200/75 bg-white p-6 shadow-[0_1px_3px_0_rgb(0,0,0,0.02)] flex flex-col justify-between h-full transition-all duration-300 ${(!showSales && !showPurchases) ? "opacity-50 grayscale-[50%]" : ""}`}>
      <div>
        <h4 className="text-sm font-bold text-slate-900">Margin Composition</h4>
        <p className="text-xs text-slate-400">Profit vs cost breakdown</p>
      </div>
      
      <div className="flex flex-1 items-center justify-center gap-6 py-4">
        <div className="relative h-[110px] w-[110px] shrink-0">
          <svg className="h-full w-full transform -rotate-90" viewBox="0 0 120 120">
            <circle
              cx="60"
              cy="60"
              r="50"
              fill="transparent"
              stroke="#F1F5F9"
              strokeWidth="9"
            />
            {/* Cost segment - render only if Purchases are enabled */}
            {showPurchases && (
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="transparent"
                stroke="#F43F5E"
                strokeWidth="9"
                strokeDasharray="314.16"
                strokeDashoffset={314.16 - costStroke}
                strokeLinecap="round"
              />
            )}
            {/* Profit segment - render only if Sales are enabled */}
            {showSales && (
              <circle
                cx="60"
                cy="60"
                r="50"
                fill="transparent"
                stroke="#10B981"
                strokeWidth="9"
                strokeDasharray="314.16"
                strokeDashoffset={314.16 - profitStroke}
                strokeLinecap="round"
                style={{
                  transformOrigin: "60px 60px",
                  transform: `rotate(${(showPurchases ? costPct / 100 : 0) * 360}deg)`
                }}
              />
            )}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-[9px] font-bold text-slate-450 uppercase tracking-widest">Margin</span>
            <span className="text-sm font-black text-slate-900">
              {showSales && activeRev > 0 ? `${((activeProfit / activeRev) * 100).toFixed(1)}%` : "0%"}
            </span>
          </div>
        </div>

        <div className="space-y-3">
          <div className={`transition-opacity duration-300 ${!showSales ? "opacity-30" : ""}`}>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span>Net Profit ({showSales && activeRev > 0 ? profitPct.toFixed(0) : 0}%)</span>
            </div>
            <p className="font-mono text-slate-500 mt-0.5 text-xs">{formatMoney(activeProfit >= 0 && showSales ? activeProfit : 0)}</p>
          </div>
          <div className={`transition-opacity duration-300 ${!showPurchases ? "opacity-30" : ""}`}>
            <div className="flex items-center gap-2 text-[10px] font-bold text-slate-700 uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
              <span>Purchase Cost ({showPurchases ? (showSales ? costPct.toFixed(0) : 100) : 0}%)</span>
            </div>
            <p className="font-mono text-slate-500 mt-0.5 text-xs">{formatMoney(showPurchases ? cost : 0)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
