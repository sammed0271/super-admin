import React, { useMemo, useState, useEffect } from "react";
import { getAuditLogs } from "../../axios/audit_api";
import type { AuditLog } from "../../types/models";

type AuditRow = {
  id: string;
  action: string;
  timestamp: string;
  oldValue: string;
  newValue: string;
  centerId: string;
  changedBy: string;
  severity: "Critical" | "Warning" | "Medium" | "Low" | "Info";
};

const AuditLogPage: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState("All Changes");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [logs, setLogs] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const res = await getAuditLogs({ page: 1, limit: 50 });
      console.log("Raw audit logs from backend:", res.logs);

      // 🔥 normalize backend → UI
      const formatted: AuditRow[] = res.logs.map((log: any) => ({
        id: log._id,
        action: log.action,
        timestamp: log.createdAt,
        oldValue: log.details?.oldValue || "-",
        newValue: log.details?.newValue || "-",
        centerId: log.entity || "-",
        changedBy: log.userId?.name || "System",
        severity: getSeverity(log.action),
      }));

      setLogs(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  const getSeverity = (action: string): AuditRow["severity"] => {
    const a = action.toLowerCase();

    if (a.includes("delete")) return "Critical";
    if (a.includes("update")) return "Warning";
    if (a.includes("create")) return "Info";

    return "Low";
  };

  useEffect(() => {
    fetchLogs();
  }, []);


  const filteredRows = useMemo(() => {
    return logs.filter((row) => {
      if (typeFilter !== "All Changes") {
        const actionLower = row.action.toLowerCase();
        const map: Record<string, string[]> = {
          "Rate Changes": ["rate"],
          Financial: ["bill", "bonus", "deduction"],
          Collection: ["milk"],
          Farmer: ["farmer"],
          System: ["auth", "user"],
        };

        const keywords = map[typeFilter] || [];
        if (!keywords.some((k) => actionLower.includes(k))) return false;
      }

      if (dateFilter) {
        const parsed = new Date(row.timestamp);
        if (!Number.isNaN(parsed.getTime())) {
          const iso = parsed.toISOString().slice(0, 10);
          if (iso !== dateFilter) return false;
        }
      }

      return true;
    });
  }, [logs, dateFilter, typeFilter]); // ✅ FIXED

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, dateFilter]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;

  const paginatedRows = filteredRows.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const severityBadge = (severity: AuditLog["severity"]) => {
    const styles: Record<AuditLog["severity"], string> = {
      Critical: "bg-red-100 text-red-700",
      Warning: "bg-amber-100 text-amber-700",
      Medium: "bg-amber-100 text-amber-700",
      Low: "bg-blue-100 text-blue-700",
      Info: "bg-slate-100 text-slate-600",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full ${styles[severity] || "bg-slate-100 text-slate-600"}`}
      >
        {severity}
      </span>
    );
  };

  const formatDateStr = (isoString: string) => {
    const d = new Date(isoString);
    if (Number.isNaN(d.getTime())) return isoString;
    return d.toLocaleString("en-US", {
      month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className="h-full w-full overflow-auto bg-slate-50 p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Audit Log & Change Tracking</h2>
          <p className="text-slate-500 text-sm mt-1">Complete history of all center and system changes</p>
        </div>
        <div className="flex items-center gap-3">
          <select
            value={typeFilter}
            onChange={(event) => setTypeFilter(event.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          >
            <option>All Changes</option>
            <option>Rate Changes</option>
            <option>Financial</option>
            <option>Collection</option>
            <option>Farmer</option>
            <option>System</option>
          </select>
          <input
            type="date"
            value={dateFilter}
            onChange={(event) => setDateFilter(event.target.value)}
            className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button className="px-4 py-2 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition">Export Log</button>
        </div>
      </div>

      <div className={`card p-5 bg-white rounded-lg shadow-sm border border-slate-200 transition-opacity ${loading ? 'opacity-50 pointer-events-none' : ''}`}>
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Timestamp</th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Action</th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Old Value</th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase">New Value</th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Center</th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Changed By</th>
              <th className="text-left py-4 px-4 text-xs font-semibold text-slate-500 uppercase">Severity</th>
            </tr>
          </thead>
          <tbody>
            {loading && logs.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500 animate-pulse">
                  Loading audit logs...
                </td>
              </tr>
            ) : paginatedRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-500">
                  No audit logs found for the selected filters.
                </td>
              </tr>
            ) : (
              paginatedRows.map((row) => (
                <tr
                  key={row.id}
                  className={`table-row border-b border-slate-50 transition ${row.severity === "Critical"
                    ? "bg-red-50/50 hover:bg-red-50"
                    : row.severity === "Warning"
                      ? "bg-amber-50/50 hover:bg-amber-50"
                      : "hover:bg-slate-50"
                    }`}
                >
                  <td className="py-4 px-4 text-sm text-slate-700">{formatDateStr(row.timestamp)}</td>
                  <td className="py-4 px-4 text-sm text-slate-700 font-medium">
                    {row.action}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">
                    {row.oldValue}
                  </td>
                  <td className="py-4 px-4 text-sm text-green-600 font-semibold max-w-[200px] truncate" title={row.newValue}>
                    {row.newValue}
                  </td>
                  <td className="py-4 px-4 text-sm text-slate-600">{row.centerId}</td>
                  <td className="py-4 px-4 text-sm text-slate-700">{row.changedBy}</td>
                  <td className="py-4 px-4">{severityBadge(row.severity)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        <div className="flex flex-wrap items-center justify-between mt-5 pt-5 border-t border-slate-100">
          <p className="text-sm text-slate-500">
            Showing <span className="font-semibold text-slate-700">{filteredRows.length > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0}</span> to <span className="font-semibold text-slate-700">{Math.min(currentPage * itemsPerPage, filteredRows.length)}</span> of <span className="font-semibold text-slate-700">{filteredRows.length}</span> entries
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <div className="flex gap-1 overflow-x-auto max-w-[200px] sm:max-w-none">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`px-3 py-2 text-sm font-medium rounded-lg transition flex-shrink-0 ${currentPage === page
                    ? "text-white bg-green-600 shadow-sm"
                    : "text-slate-600 hover:bg-slate-100"
                    }`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditLogPage;
