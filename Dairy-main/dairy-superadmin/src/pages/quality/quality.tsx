import React, { useState, useMemo, useEffect } from "react";
import { api } from "../../services/api";
import type { QualityAlert, Center } from "../../types/models";
import StatCard from "../../components/StatCard";
import DataTable from "../../components/DataTable";
import type { DataTableColumn } from "../../components/DataTable";

const Quality: React.FC = () => {
  const [selectedCenter, setSelectedCenter] = useState("All Centers");
  const [centers, setCenters] = useState<Center[]>([]);
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Derive mock comparison data dynamically based on the fetched centers
  const [comparisonData, setComparisonData] = useState<{ center: string, farmerFat: number, tankFat: number, status: string }[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [loadedCenters, loadedAlerts] = await Promise.all([
          api.getCenters(),
          api.getQualityAlerts()
        ]);
        setCenters(loadedCenters);
        setAlerts(loadedAlerts);

        // Generate mock comparison data based on actual centers
        const comps = loadedCenters.map((c, i) => {
          const farmerFat = 4.0 + (i * 0.1);
          const diff = i % 2 === 0 ? 0.2 : 0.6;
          const tankFat = farmerFat - diff;
          let status = "normal";
          if (diff >= 0.5) status = "critical";
          else if (diff >= 0.3) status = "warning";

          return {
            center: c.dairyName,
            farmerFat,
            tankFat,
            status
          };
        });
        setComparisonData(comps);

      } catch (err) {
        console.error("Failed to fetch quality data", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredComparisons = useMemo(() => {
    if (selectedCenter === "All Centers") return comparisonData;
    // Map selectedCenter IF it's an ID to a dairyName, else it's a dairyName
    const centerName = centers.find(c => c.id === selectedCenter)?.dairyName || selectedCenter;
    return comparisonData.filter(d => d.center === centerName);
  }, [comparisonData, selectedCenter, centers]);

  const filteredAlerts = useMemo(() => {
    if (selectedCenter === "All Centers") return alerts;
    return alerts.filter(a => a.centerId === selectedCenter);
  }, [alerts, selectedCenter]);

  const alertColumns: DataTableColumn<QualityAlert>[] = [
    {
      id: "farmerId",
      header: "Farmer Code",
      accessor: "farmerId",
      cell: (row) => <span className="font-medium text-slate-700">{row.farmerId}</span>,
    },
    {
      id: "center",
      header: "Center",
      cell: (row) => <span className="text-slate-600">{centers.find(c => c.id === row.centerId)?.dairyName || row.centerId}</span>,
    },
    {
      id: "milkType",
      header: "Milk Type",
      accessor: "milkType",
      cell: (row) => <span className="text-slate-600">{row.milkType}</span>,
    },
    {
      id: "actual",
      header: "Avg FAT/SNF",
      cell: (row) => <span className="font-semibold text-red-600">{row.actualFat.toFixed(1)}% / {row.actualSnf.toFixed(1)}%</span>,
    },
    {
      id: "expected",
      header: "Expected",
      cell: (row) => <span className="text-slate-600">{row.expectedFat.toFixed(1)}% / {row.expectedSnf.toFixed(1)}%</span>,
    },
    {
      id: "deviation",
      header: "Deviation",
      cell: (row) => <span className="font-medium text-slate-600">{(row.actualFat - row.expectedFat).toFixed(1)}%</span>,
    },
    {
      id: "riskLevel",
      header: "Risk Level",
      cell: (row) => (
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${row.riskLevel === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
          {row.riskLevel}
        </span>
      ),
    },
    {
      id: "action",
      header: "Action",
      cell: () => (
        <button className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition"> Discuss </button>
      ),
    },
  ];

  return (
    <div className="p-6 overflow-y-auto bg-slate-50 h-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Quality Control &amp; Comparison</h2>
          <p className="text-slate-500 text-sm mt-1">Monitor milk quality and detect potential adulteration</p>
        </div>
        <select
          value={selectedCenter}
          onChange={(e) => setSelectedCenter(e.target.value)}
          className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
          disabled={isLoading}
        >
          <option value="All Centers">All Centers</option>
          {centers.map(c => <option key={c.id} value={c.id}>{c.dairyName}</option>)}
        </select>
      </div>

      <div className={`grid grid-cols-4 gap-5 mb-6 transition-opacity ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        <StatCard
          title="Excellent Quality"
          value="156"
          subtitle="Farmers (78%)"
          variant="green"
        />
        <StatCard
          title="Good Quality"
          value="32"
          subtitle="Farmers (16%)"
          variant="blue"
        />
        <StatCard
          title="Average Quality"
          value="9"
          subtitle="Farmers (4.5%)"
          variant="orange"
        />
        <StatCard
          title="Risk Detected"
          value={filteredAlerts.length}
          subtitle="Farmers"
          variant="red"
        />
      </div>

      <div className={`grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6 transition-opacity ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        <div className="card bg-white p-5 shadow-sm rounded-2xl">
          <h3 className="font-semibold text-slate-800 mb-5">Farmer Avg vs Tank FAT Comparison</h3>
          <div className="space-y-6">
            {filteredComparisons.length === 0 ? (
              <p className="text-sm text-slate-500">No comparison data for this center.</p>
            ) : (
              filteredComparisons.map((c, i) => {
                const diff = (c.tankFat - c.farmerFat).toFixed(1);
                const percFarmer = (c.farmerFat / 6) * 100; // max reasonable fat ~6 for bar length
                const percTank = (c.tankFat / 6) * 100;

                let colorBase = "green";
                let message = `✓ ${diff}% deviation (Normal)`;

                if (c.status === "warning") {
                  colorBase = "amber";
                  message = `⚠ ${diff}% deviation`;
                } else if (c.status === "critical") {
                  colorBase = "red";
                  message = `⚠ ${diff}% deviation - INVESTIGATE`;
                }

                return (
                  <div key={i}>
                    <div className="flex justify-between mb-1">
                      <span className="text-sm text-slate-600 truncate mr-2" title={c.center}>{c.center}</span>
                      <span className="text-sm font-medium text-slate-800 whitespace-nowrap">Farmer: {c.farmerFat.toFixed(1)}% | Tank: {c.tankFat.toFixed(1)}%</span>
                    </div>
                    <div className="h-4 bg-slate-100 rounded-full overflow-hidden flex">
                      <div className={`h-full bg-${colorBase}-500`} style={{ width: `${percFarmer}%` }}></div>
                      <div className={`h-full bg-${colorBase}-300`} style={{ width: `${percTank}%` }}></div>
                    </div>
                    <p className={`text-xs text-${colorBase}-600 mt-1 font-medium`}>{message}</p>
                  </div>
                );
              })
            )}
          </div>
        </div>

        <div className="card rounded-2xl bg-white p-5 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-5">Risk Analysis Overview</h3>
          <div className="flex items-center justify-center h-48">
            <div className="relative w-48 h-48">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#e2e8f0" strokeWidth="12" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#22c55e" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * 0.22} />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#3b82f6" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * 0.84} />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f59e0b" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * 0.955} />
                <circle cx="50" cy="50" r="40" fill="none" stroke="#ef4444" strokeWidth="12" strokeDasharray="251.2" strokeDashoffset={251.2 * 0.985} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <p className="text-3xl font-bold text-slate-800">200+</p>
                  <p className="text-sm text-slate-500">Total Farmers</p>
                </div>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> <span className="text-sm text-slate-600">Excellent (78%)</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> <span className="text-sm text-slate-600">Good (16%)</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-amber-500"></span> <span className="text-sm text-slate-600">Average (4.5%)</span></div>
            <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-500"></span> <span className="text-sm text-slate-600">Risk (1.5%)</span></div>
          </div>
        </div>
      </div>

      <div className={`card rounded-2xl bg-white p-5 shadow-sm transition-opacity ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
        <h3 className="font-semibold text-slate-800 mb-5">High Risk Farmers - Review Required</h3>
        <div className="overflow-x-auto mt-4">
          <DataTable
            columns={alertColumns}
            data={filteredAlerts}
            keyField="farmerId"
            emptyMessage="No high-risk farmers found matching the filter."
          />
        </div>
      </div>
    </div>
  );
};

export default Quality;
