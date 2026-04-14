import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "../../services/api";
import type { Center } from "../../types/models";

const SuperAdminCentersPage: React.FC = () => {
  const navigate = useNavigate();
  const [centers, setCenters] = useState<Center[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // To show live dynamic stats, in a real app this would be a separate API call per center or batch
  const [activeStats, setActiveStats] = useState<Record<string, {
    todaysCollection: number;
    activeFarmers: number;
  }>>({});

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const rows = await api.getCenters();
        setCenters(rows);

        // Fetch active stats for each center dynamically
        const todayStr = new Date().toISOString().split("T")[0];
        const statsMap: Record<string, { todaysCollection: number, activeFarmers: number }> = {};

        await Promise.all(rows.map(async (c) => {
          const collections = await api.getCollections({ centerId: c.id, startDate: todayStr, endDate: todayStr });
          const todaysCollection = collections.reduce((sum, col) => sum + col.quantity, 0);
          const activeFarmers = new Set(collections.map(col => col.farmerId)).size;
          statsMap[c.id] = { todaysCollection, activeFarmers };
        }));

        setActiveStats(statsMap);

      } catch (err) {
        setError("Unable to load centers from database.");
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (centerId: string, centerName: string) => {
    const shouldDelete = window.confirm(`Delete "${centerName}"?`);
    if (!shouldDelete) return;

    // Simulate delete (normally we would have a deleteCenter API)
    setCenters(prev => prev.filter(c => c.id !== centerId));
  };

  return (
    <div className="h-full w-full overflow-auto bg-slate-50 p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Collection Centers</h1>
            <p className="text-sm text-slate-500">
              Manage and monitor all your dairy collection points
            </p>
          </div>
          <button
            onClick={() => {
              navigate("/centers/add");
            }}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-green-200 transition hover:shadow-green-300"
          >
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth="2"
              fill="none"
            >
              <path d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            Add New Center
          </button>
        </div>

        {isLoading && (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm animate-pulse">
            Loading centers...
          </div>
        )}

        {error && (
          <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        {!isLoading && !error && centers.length === 0 && (
          <div className="rounded-2xl bg-white p-6 text-sm text-slate-600 shadow-sm">
            No centers found. Add your first center to get started.
          </div>
        )}

        {!isLoading && !error && centers.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-2">
            {centers.map((center) => {
              const createdDate = new Date(center.system.createdAt).toLocaleString();
              const updatedDate = new Date(center.system.updatedAt).toLocaleString();
              const location = `${center.location.village}, ${center.location.district}, ${center.location.state}`;
              const badgeStatus = center.auth.status;
              const badgeClass =
                badgeStatus === "Active"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700";

              const liveStats = activeStats[center.id] || { todaysCollection: 0, activeFarmers: 0 };

              return (
                <div key={center.id} className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 text-sm font-bold text-white shadow-sm">
                        {center.dairyCode.substring(0, 3)}
                      </div>
                      <div>
                        <h2 className="font-bold text-slate-800">{center.dairyName}</h2>
                        <p className="text-sm text-slate-500">{location}</p>
                      </div>
                    </div>
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                      {badgeStatus}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 rounded-xl bg-slate-50 p-3 text-sm border border-slate-100">
                    <div>
                      <p className="text-slate-500">Manager</p>
                      <p className="font-semibold text-slate-800">{center.managerName}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Mobile</p>
                      <p className="font-semibold text-slate-800">{center.mobile}</p>
                    </div>
                    <div>
                      <p className="text-slate-500">Milk / Rate</p>
                      <p className="font-semibold text-slate-800">
                        {center.config.milkType} / {center.config.rateType}
                      </p>
                    </div>
                    <div>
                      <p className="text-slate-500">Payment</p>
                      <p className="font-semibold text-slate-800">
                        {center.payment.cycle} ({center.payment.mode.join(", ")})
                      </p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between rounded-xl bg-green-50 p-3 text-sm border border-green-200 shadow-sm">
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold text-green-800">Today's Collection:</span>
                      <span className="text-green-700 font-bold">{liveStats.todaysCollection.toLocaleString()} L</span>
                    </div>
                    <div className="flex gap-2 items-center">
                      <span className="font-semibold text-green-800">Active Farmers:</span>
                      <span className="text-green-700 font-bold">{liveStats.activeFarmers}</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4">
                    <div className="text-xs text-slate-500">
                      <p>Created by {center.system.createdBy} on {createdDate.split(',')[0]}</p>
                      <p>Updated on {updatedDate.split(',')[0]}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => navigate(`/centers/${center.id}`)}
                        className="rounded-lg border border-slate-200 px-3 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition shadow-sm"
                      >
                        Edit Details
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          void handleDelete(center.id, center.dairyName);
                        }}
                        className="rounded-lg border border-red-200 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-50 transition shadow-sm"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default SuperAdminCentersPage;
