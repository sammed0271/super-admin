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
      <div className="mx-auto flex max-w-6xl flex-col gap-6">

        {/* HEADER (UNCHANGED) */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Collection Centers</h1>
            <p className="text-sm text-slate-500">
              Manage and monitor all your dairy collection points
            </p>
          </div>

          <button
            onClick={() => navigate("/centers/add")}
            className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-green-600 to-emerald-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg"
          >
            Add New Center
          </button>
        </div>

        {/* STATES */}
        {isLoading && <div>Loading...</div>}
        {error && <div className="text-red-500">{error}</div>}

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
                <div key={center._id} className="rounded-2xl bg-white p-5 shadow-sm">

                  {/* HEADER */}
                  <div className="flex justify-between">
                    <h2 className="font-bold">{center.name}</h2>

                    <span className={`px-3 py-1 text-xs rounded-full ${badgeClass}`}>
                      {center.status}
                    </span>
                  </div>

                  <p className="text-sm text-gray-500">{location}</p>

                  {/* DETAILS */}
                  <div className="mt-3 text-sm">
                    <p><b>Owner:</b> {center.ownerName}</p>
                    <p><b>Mobile:</b> {center.mobile}</p>
                    <p><b>Milk:</b> {center.milkType}</p>
                  </div>

                  {/* ACTIONS */}
                  <div className="mt-4 flex gap-2">
                    <button
                      onClick={() => navigate(`/centers/${center._id}`)}
                      className="border px-3 py-1 rounded"
                    >
                      Edit
                    </button>

                    <button
                      onClick={() => handleToggle(center._id)}
                      className="border px-3 py-1 rounded text-red-600"
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

export default SuperAdminCentersPage;