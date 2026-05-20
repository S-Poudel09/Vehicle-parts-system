import { useCallback, useEffect, useState } from "react";
import {
  ArrowDownTrayIcon,
  ClipboardDocumentListIcon,
  ShieldExclamationIcon,
  UserIcon,
  CubeIcon,
} from "@heroicons/react/24/outline";
import AdminPageHeader from "../../components/admin/AdminPageHeader";
import ListPagination from "../../components/common/ListPagination";
import {
  downloadAdminActivityLogsExport,
  fetchAdminActivityLogSummary,
  fetchAdminActivityLogs,
  type AdminActivityLog,
  type AdminActivityLogQuery,
  type AdminActivityLogSummary,
} from "../../api/adminActivityLogs";
import {
  formatNotificationTime,
  notificationBadgeClass,
} from "../../utils/notificationStyles";

const severityOptions = [
  { value: "", label: "All severities" },
  { value: "Info", label: "Info" },
  { value: "Warning", label: "Warning" },
  { value: "Critical", label: "Critical" },
];

export default function AdminActivityLogsPage() {
  const [summary, setSummary] = useState<AdminActivityLogSummary | null>(null);
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState<"csv" | "pdf" | null>(null);

  const [search, setSearch] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [actorUserId, setActorUserId] = useState("");
  const [actionType, setActionType] = useState("");
  const [module, setModule] = useState("");
  const [severity, setSeverity] = useState("");

  const buildQuery = useCallback(
    (): AdminActivityLogQuery => ({
      search: search.trim() || undefined,
      from: from || undefined,
      to: to || undefined,
      actorUserId: actorUserId ? Number(actorUserId) : undefined,
      actionType: actionType || undefined,
      module: module || undefined,
      severity: severity || undefined,
      page,
      pageSize: 25,
    }),
    [search, from, to, actorUserId, actionType, module, severity, page]
  );

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, logsRes] = await Promise.all([
        fetchAdminActivityLogSummary(),
        fetchAdminActivityLogs(buildQuery()),
      ]);
      setSummary(summaryRes);
      setLogs(logsRes.items);
      setTotalPages(logsRes.totalPages);
      setTotalCount(logsRes.totalCount);
    } catch {
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [buildQuery]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    setPage(1);
  }, [search, from, to, actorUserId, actionType, module, severity]);

  const handleExport = async (format: "csv" | "pdf") => {
    setExporting(format);
    try {
      await downloadAdminActivityLogsExport(format, buildQuery());
    } finally {
      setExporting(null);
    }
  };

  return (
    <>
      <AdminPageHeader
        title="Activity Logs & Reports"
        description="Audit trail of admin actions — logins, inventory, approvals, user management, and reports."
      />

      {summary && (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <SummaryCard
            icon={ClipboardDocumentListIcon}
            label="Actions today"
            value={String(summary.actionsToday)}
            sub="All admin activity logged today"
          />
          <SummaryCard
            icon={UserIcon}
            label="Most active admin"
            value={summary.mostActiveAdmin ?? "—"}
            sub={
              summary.mostActiveAdminCount != null
                ? `${summary.mostActiveAdminCount} actions today`
                : "No activity yet"
            }
          />
          <SummaryCard
            icon={CubeIcon}
            label="Most modified module"
            value={summary.mostModifiedModule ?? "—"}
            sub={
              summary.mostModifiedModuleCount != null
                ? `${summary.mostModifiedModuleCount} changes today`
                : "No changes yet"
            }
          />
          <SummaryCard
            icon={ShieldExclamationIcon}
            label="Recent high-priority"
            value={String(summary.recentCritical.length)}
            sub="Latest critical or failed-login events (up to 8)"
          />
        </div>
      )}

      {summary && summary.recentCritical.length > 0 && (
        <div className="mb-6 overflow-hidden rounded-2xl border border-amber-200/80 bg-amber-50/50 shadow-sm">
          <div className="border-b border-amber-100 px-6 py-3">
            <h3 className="text-sm font-semibold text-amber-900">Recent critical actions</h3>
          </div>
          <ul className="divide-y divide-amber-100/80 px-6 py-2">
            {summary.recentCritical.map((log) => (
              <li key={log.id} className="py-2.5 text-sm text-amber-950">
                <span
                  className={`mr-2 inline-block rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase ring-1 ring-inset ${notificationBadgeClass(log.severity)}`}
                >
                  {log.actionType}
                </span>
                {log.description}
                <span className="ml-2 text-xs text-amber-700/80">
                  {formatNotificationTime(log.createdAt)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="border-b border-slate-100 px-6 py-4">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="font-semibold text-slate-900">Activity log history</h3>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="btn-secondary text-xs"
                disabled={!!exporting}
                onClick={() => handleExport("csv")}
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                {exporting === "csv" ? "Exporting…" : "Export CSV"}
              </button>
              <button
                type="button"
                className="btn-secondary text-xs"
                disabled={!!exporting}
                onClick={() => handleExport("pdf")}
              >
                <ArrowDownTrayIcon className="h-4 w-4" />
                {exporting === "pdf" ? "Exporting…" : "Export PDF"}
              </button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <input
              className="input-field w-full"
              placeholder="Search description, admin, module…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <input
              type="date"
              className="input-field w-full"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              title="From date"
            />
            <input
              type="date"
              className="input-field w-full"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              title="To date"
            />
            <select
              className="input-field w-full"
              value={actorUserId}
              onChange={(e) => setActorUserId(e.target.value)}
            >
              <option value="">All admins</option>
              {summary?.adminActors.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name}
                </option>
              ))}
            </select>
            <select
              className="input-field w-full"
              value={actionType}
              onChange={(e) => setActionType(e.target.value)}
            >
              <option value="">All action types</option>
              {summary?.availableActionTypes.map((a) => (
                <option key={a} value={a}>
                  {a}
                </option>
              ))}
            </select>
            <select
              className="input-field w-full"
              value={module}
              onChange={(e) => setModule(e.target.value)}
            >
              <option value="">All modules</option>
              {summary?.availableModules.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              className="input-field w-full"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              {severityOptions.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <p className="mt-3 text-xs text-slate-500">{totalCount} log entries (filtered)</p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px] text-left text-sm">
            <thead className="border-b border-slate-100 bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500">
              <tr>
                <th className="px-4 py-3">Time</th>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Module</th>
                <th className="px-4 py-3">Description</th>
                <th className="px-4 py-3">Changes</th>
                <th className="px-4 py-3">IP</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    Loading activity logs…
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-slate-500">
                    No activity logs match your filters.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/50">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-600">
                      {formatNotificationTime(log.createdAt)}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-medium text-slate-900">{log.actorName}</p>
                      <p className="text-xs text-slate-400">id: {log.actorUserId ?? "—"}</p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ring-1 ring-inset ${notificationBadgeClass(log.severity)}`}
                      >
                        {log.actionType}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-700">{log.module}</td>
                    <td className="max-w-xs px-4 py-3 text-slate-700">{log.description}</td>
                    <td className="max-w-[200px] px-4 py-3 text-xs text-slate-500">
                      {log.oldValue && (
                        <p>
                          <span className="font-semibold text-slate-600">Was:</span> {log.oldValue}
                        </p>
                      )}
                      {log.newValue && (
                        <p className="mt-0.5">
                          <span className="font-semibold text-slate-600">Now:</span> {log.newValue}
                        </p>
                      )}
                      {!log.oldValue && !log.newValue && "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-slate-500">{log.ipAddress ?? "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <ListPagination currentPage={page} totalPages={totalPages} onPageChange={setPage} />
      </div>
    </>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: typeof ClipboardDocumentListIcon;
  label: string;
  value: string;
  sub: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200/75 bg-white p-5 shadow-[0_1px_3px_0_rgb(0,0,0,0.02)]">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <Icon className="h-5 w-5 text-slate-400" />
      </div>
      <p className="truncate text-xl font-bold text-slate-900">{value}</p>
      <p className="mt-1 text-xs text-slate-400">{sub}</p>
    </div>
  );
}
