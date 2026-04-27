import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// ✅ USE REAL API
import { getCenters, toggleCenter } from "../../axios/center_api";

const SuperAdminCentersPage: React.FC = () => {
  const navigate = useNavigate();
  const [centers, setCenters] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCenters();
  }, []);

  const fetchCenters = async () => {
    try {
      setIsLoading(true);
      const data = await getCenters();
      setCenters(data);
    } catch {
      setError("Unable to load centers from database.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🔥 REAL TOGGLE (Active/Suspended)
  const handleToggle = async (id: string) => {
    await toggleCenter(id);
    fetchCenters(); // refresh list
  };

  return (

    <div className="h-full w-full overflow-auto bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl flex flex-col gap-6">

        {/* HEADER */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Collection Centers
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Manage and monitor all your dairy collection points
            </p>
          </div>

          <button
            onClick={() => navigate("/centers/add")}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-md hover:shadow-lg transition"
          >
            + Add New Center
          </button>
        </div>

        {/* STATES */}
        {isLoading && (
          <div className="text-center py-10 text-slate-500">Loading...</div>
        )}

        {error && (
          <div className="text-red-500 bg-red-50 border border-red-200 p-3 rounded-lg">
            {error}
          </div>
        )}

        {/* LIST */}
        {!isLoading && centers.length > 0 && (
          <div className="grid gap-5 lg:grid-cols-2">
            {centers.map((center) => {

              const location = `${center.village}, ${center.district}, ${center.state}`;

              const badgeClass =
                center.status === "Active"
                  ? "bg-green-100 text-green-700"
                  : "bg-amber-100 text-amber-700";

              return (
                <div
                  key={center._id}
                  className="rounded-2xl bg-white p-5 shadow-sm border border-slate-200 hover:shadow-md transition flex flex-col gap-4"
                >

                  {/* HEADER */}
                  <div className="flex justify-between items-start">
                    <div>
                      <h2 className="font-semibold text-slate-800 text-lg">
                        {center.name}
                      </h2>
                      <p className="text-sm text-slate-500">{location}</p>
                    </div>

                    <span
                      className={`px-3 py-1 text-xs rounded-full font-medium ${badgeClass}`}
                    >
                      {center.status}
                    </span>
                  </div>

                  {/* STATS */}
                  <div className="grid grid-cols-2 gap-4">
                    <StatItem label="Total Milk" value={`${center.totalMilk} L`} />
                    <StatItem label="Avg FAT" value={center.avgFat} />
                    <StatItem label="Avg SNF" value={center.avgSnf} />
                    <StatItem
                      label="Tank vs Farmer"
                      value={`${center.tankFat} / ${center.avgFat}`}
                    />
                  </div>

                  {/* ACTIONS */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t border-slate-100">

                    <button
                      onClick={() => navigate(`/centers/details/${center._id}`)}
                      className="px-3 py-1.5 text-sm rounded-lg bg-slate-100 hover:bg-slate-200 transition"
                    >
                      View Details
                    </button>

                    <button
                      onClick={() => navigate(`/centers/edit/${center._id}`)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-slate-300 hover:bg-slate-100 transition"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleToggle(center._id)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50 transition"
                    >
                      Toggle Status
                    </button>

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

const StatItem = ({ label, value }: any) => (
  <div className="bg-background-muted rounded-lg p-3">
    <p className="text-xs text-text-secondary">{label}</p>
    <p className="text-sm font-semibold text-text-primary">{value}</p>
  </div>
);

export default SuperAdminCentersPage;