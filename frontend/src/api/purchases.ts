import API from "../services/api";

export type PurchaseExportQuery = {
  from?: string;
  to?: string;
  vendorId?: number;
  search?: string;
  minAmount?: number;
  maxAmount?: number;
};

function buildParams(query: PurchaseExportQuery): string {
  const params = new URLSearchParams();
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.vendorId) params.set("vendorId", String(query.vendorId));
  if (query.search) params.set("search", query.search);
  if (query.minAmount != null) params.set("minAmount", String(query.minAmount));
  if (query.maxAmount != null) params.set("maxAmount", String(query.maxAmount));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function downloadPurchaseOrdersCsv(query: PurchaseExportQuery) {
  const res = await API.get(`/purchase/export/csv${buildParams(query)}`, {
    responseType: "blob",
  });
  const blob = new Blob([res.data], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  const label =
    query.from && query.to
      ? `${query.from}_${query.to}`
      : query.from ?? query.to ?? new Date().toISOString().slice(0, 10);
  link.download = `purchase-orders-${label}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}
