import API from "../services/api";

export type AdminActivityLog = {
  id: number;
  actorUserId: number | null;
  actorName: string;
  actorRole: string;
  actionType: string;
  module: string;
  entityType: string | null;
  entityId: number | null;
  description: string;
  oldValue: string | null;
  newValue: string | null;
  severity: string;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: string;
};

export type AdminActivityLogQuery = {
  search?: string;
  from?: string;
  to?: string;
  actorUserId?: number;
  actionType?: string;
  module?: string;
  severity?: string;
  page?: number;
  pageSize?: number;
};

export type AdminActivityLogPagedResult = {
  items: AdminActivityLog[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export type AdminActivityLogSummary = {
  actionsToday: number;
  mostActiveAdmin: string | null;
  mostActiveAdminCount: number | null;
  mostModifiedModule: string | null;
  mostModifiedModuleCount: number | null;
  recentCritical: AdminActivityLog[];
  availableActionTypes: string[];
  availableModules: string[];
  adminActors: { id: number; name: string }[];
};

function buildParams(query: AdminActivityLogQuery): string {
  const params = new URLSearchParams();
  if (query.search) params.set("search", query.search);
  if (query.from) params.set("from", query.from);
  if (query.to) params.set("to", query.to);
  if (query.actorUserId) params.set("actorUserId", String(query.actorUserId));
  if (query.actionType) params.set("actionType", query.actionType);
  if (query.module) params.set("module", query.module);
  if (query.severity) params.set("severity", query.severity);
  if (query.page) params.set("page", String(query.page));
  if (query.pageSize) params.set("pageSize", String(query.pageSize));
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export async function fetchAdminActivityLogs(query: AdminActivityLogQuery) {
  const res = await API.get<AdminActivityLogPagedResult>(
    `/admin/activity-logs${buildParams(query)}`
  );
  return res.data;
}

export async function fetchAdminActivityLogSummary() {
  const res = await API.get<AdminActivityLogSummary>("/admin/activity-logs/summary");
  return res.data;
}

export async function logAdminLogout() {
  await API.post("/admin/activity-logs/logout");
}

export async function downloadAdminActivityLogsExport(
  format: "csv" | "pdf",
  query: AdminActivityLogQuery
) {
  const res = await API.get(`/admin/activity-logs/export/${format}${buildParams(query)}`, {
    responseType: "blob",
  });
  const blob = new Blob([res.data], {
    type: format === "pdf" ? "application/pdf" : "text/csv",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `admin-activity-logs-${new Date().toISOString().slice(0, 10)}.${format}`;
  link.click();
  URL.revokeObjectURL(url);
}
