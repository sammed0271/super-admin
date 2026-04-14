import React, { useMemo, useState, useEffect } from "react";
import { api } from "../../services/api";
import type { AuditLog } from "../../types/models";

const AuditLogPage: React.FC = () => {
  const [typeFilter, setTypeFilter] = useState("All Changes");
  const [dateFilter, setDateFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const [auditRows, setAuditRows] = useState<AuditLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchLogs = async () => {
      setIsLoading(true);
      try {
        const logs = await api.getAuditLogs();
        setAuditRows(logs);
      } catch (err) {
        console.error("Failed to load audit logs", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchLogs();
  }, []);

  const filteredRows = useMemo(() => {
    return auditRows.filter((row) => {
      if (typeFilter !== "All Changes") {
        const actionLower = row.action.toLowerCase();
        const map: Record<string, string[]> = {
          "Rate Changes": ["rate"],
          "Financial": ["bill", "bonus", "deduction"],
          "Collection": ["milk"],
          "Farmer": ["farmer"],
          "System": ["authentication", "user", "profile"],
        };
        const keywords = map[typeFilter] || [];
        if (!keywords.some((keyword) => actionLower.includes(keyword))) {
          return false;
        }
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
  }, [auditRows, dateFilter, typeFilter]);

  useEffect(() => {
    setCurrentPage(1);
  }, [typeFilter, dateFilter]);

  const totalPages = Math.ceil(filteredRows.length / itemsPerPage) || 1;
  const paginatedRows = filteredRows.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

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

      <div className={`card p-5 bg-white rounded-lg shadow-sm border border-slate-200 transition-opacity ${isLoading ? 'opacity-50 pointer-events-none' : ''}`}>
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
            {isLoading && auditRows.length === 0 ? (
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
