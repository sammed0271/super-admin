import React, { useState, useMemo, useEffect } from "react";
import { api } from "../../services/api";
import type { Center, MilkCollection, QualityAlert } from "../../types/models";
import StatCard from "../../components/StatCard";
import DataTable from "../../components/DataTable";
import type { DataTableColumn } from "../../components/DataTable";

const DashboardPage: React.FC = () => {
  const [selectedCenter, setSelectedCenter] = useState("All Centers");
  const [selectedShift, setSelectedShift] = useState("Both Shifts");
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);

  const [centers, setCenters] = useState<Center[]>([]);
  const [collections, setCollections] = useState<MilkCollection[]>([]);
  const [alerts, setAlerts] = useState<QualityAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [cents, colls, alrts] = await Promise.all([
          api.getCenters(),
          api.getCollections({
            centerId: selectedCenter,
            shift: selectedShift,
            startDate: selectedDate, // Start of the month for monthly stats
          }),
          api.getQualityAlerts()
        ]);
        setCenters(cents);
        setCollections(colls);
        setAlerts(alrts);
      } catch (error) {
        console.error("Error fetching dashboard data", error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [selectedCenter, selectedShift, selectedDate]);

  // Aggregated Stats
  const stats = useMemo(() => {
    // Filter specifically for the selected date for "Today's" stats
    const todaysCollections = collections.filter(c => c.date === selectedDate);
    const todaysLiters = todaysCollections.reduce((sum, c) => sum + c.quantity, 0);
    const todaysAmount = todaysCollections.reduce((sum, c) => sum + c.totalAmount, 0);

    // Monthly stats (assuming we fetch 30 days)
    const monthlyLiters = collections.reduce((sum, c) => sum + c.quantity, 0);
    const monthlyAmount = collections.reduce((sum, c) => sum + c.totalAmount, 0);

    // Milk Type Ratio from today
    let cow = 0, buffalo = 0, mix = 0;
    todaysCollections.forEach(c => {
      if (c.milkType === "Cow") cow += c.quantity;
      else if (c.milkType === "Buffalo") buffalo += c.quantity;
      else mix += c.quantity;
    });

    const totalTodayType = cow + buffalo + mix;
    const cowPerc = totalTodayType ? Math.round((cow / totalTodayType) * 100) : 0;
    const buffaloPerc = totalTodayType ? Math.round((buffalo / totalTodayType) * 100) : 0;
    const mixPerc = totalTodayType ? Math.round((mix / totalTodayType) * 100) : 0;

    // Unique farmers today
    const activeFarmersCount = new Set(todaysCollections.map(c => c.farmerId)).size;

    return {
      todaysLiters,
      todaysAmount,
      monthlyLiters,
      monthlyAmount,
      activeFarmersCount,
      milkRatio: `${cowPerc} / ${buffaloPerc} / ${mixPerc}`
    };
  }, [collections, selectedDate]);


  // SVG Icons
  const MilkIcon = () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4-4v16m6-20v16m0-16l4-4m-4 4l-4-4" />
    </svg>
  );

  const CurrencyIcon = () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 8h6m-5 0a3 3 0 110 6H9l3 3m-3-6h6m6 1a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const CalendarIcon = () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const PieChartIcon = () => (
    <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
    </svg>
  );

  const statCards = [
    {
      title: "Today's Collection",
      value: `${stats.todaysLiters.toLocaleString()} L`,
      unit: `${stats.activeFarmersCount} Farmers Today`,
      trend: "Based on active filters",
      accent: "text-teal-600",
      badge: "bg-teal-50 text-teal-600",
      iconBg: "bg-teal-100",
      icon: MilkIcon,
    },
    {
      title: "Today's Amount",
      value: `₹${stats.todaysAmount.toLocaleString()}`,
      unit: "Estimated payout",
      trend: "Based on active filters",
      accent: "text-blue-600",
      badge: "bg-blue-50 text-blue-600",
      iconBg: "bg-blue-100",
      icon: CurrencyIcon,
    },
    {
      title: "Period Collection",
      value: `${stats.monthlyLiters.toLocaleString()} L`,
      unit: `₹${stats.monthlyAmount.toLocaleString()} total`,
      trend: "30-day view",
      accent: "text-orange-600",
      badge: "bg-orange-50 text-orange-600",
      iconBg: "bg-orange-100",
      icon: CalendarIcon,
    },
    {
      title: "Milk Type Ratio",
      value: stats.milkRatio,
      unit: "% Cow / Buffalo / Mix",
      trend: "Today's breakdown",
      accent: "text-green-600",
      badge: "bg-green-50 text-green-600",
      iconBg: "bg-green-100",
      icon: PieChartIcon,
    },
  ];

  const alertColumns: DataTableColumn<QualityAlert>[] = [
    {
      id: "farmerId",
      header: "Farmer ID",
      accessor: "farmerId",
      cell: (row) => <span className="font-medium text-slate-700">{row.farmerId.split("-").pop() || row.farmerId}</span>,
    },
    {
      id: "center",
      header: "Center",
      cell: (row) => <span className="text-slate-600">{centers.find(c => c.id === row.centerId)?.dairyName || row.centerId}</span>,
    },
    {
      id: "milkType",
      header: "Type",
      accessor: "milkType",
      cell: (row) => <span className="text-slate-600">{row.milkType}</span>,
    },
    {
      id: "actual",
      header: "FAT/SNF",
      cell: (row) => <span className="font-semibold text-red-600">{row.actualFat}% / {row.actualSnf}%</span>,
    },
    {
      id: "expected",
      header: "Expected",
      cell: (row) => <span className="font-medium text-slate-500">{row.expectedFat}% / {row.expectedSnf}%</span>,
    },
    {
      id: "issue",
      header: "Issue",
      cell: (row) => (
        <span className={`rounded-full px-2 py-1 text-xs font-medium ${row.riskLevel === "High" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
          {row.issue}
        </span>
      ),
    },
    {
      id: "action",
      header: "Action",
      cell: () => (
        <button
          type="button"
          className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition"
        >
          Review
        </button>
      ),
    },
  ];

  // Group collections by center for the bar chart
  const centerChartData = useMemo(() => {
    return centers.map(center => {
      const centerColls = collections.filter(c => c.centerId === center.id && c.date === selectedDate);
      const morning = centerColls.filter(c => c.shift === "Morning").reduce((sum, c) => sum + c.quantity, 0);
      const evening = centerColls.filter(c => c.shift === "Evening").reduce((sum, c) => sum + c.quantity, 0);
      // Determine max value for relative bar heights (fake max for visualization)
      const maxCol = 500;
      return {
        name: center.dairyName.split(' ')[0], // short name
        morningPerc: Math.min(100, Math.round((morning / maxCol) * 100)),
        eveningPerc: Math.min(100, Math.round((evening / maxCol) * 100)),
      };
    });
  }, [centers, collections, selectedDate]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter(a => {
      if (selectedCenter !== "All Centers" && a.centerId !== selectedCenter) return false;
      if (a.date !== selectedDate) return false;
      return true;
    });
  }, [selectedCenter, selectedShift, selectedDate, alerts]);

  return (
    <div className="h-full w-full overflow-auto bg-slate-50 p-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6">
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">
              Owner Dashboard {loading && <span className="text-sm font-normal text-slate-400 ml-2 animate-pulse">Syncing...</span>}
            </h1>
            <p className="text-sm text-slate-500">
              Welcome back! Here&apos;s your dairy overview for today.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedCenter}
              onChange={(e) => setSelectedCenter(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option value="All Centers">All Centers</option>
              {centers.map(c => <option key={c.id} value={c.id}>{c.dairyName}</option>)}
            </select>
            <select
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option>Both Shifts</option>
              <option>Morning Shift</option>
              <option>Evening Shift</option>
            </select>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-green-500"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((stat) => (
            <StatCard
              key={stat.title}
              title={stat.title}
              value={stat.value}
              subtitle={stat.unit}
              icon={<stat.icon />}
              variant={
                stat.title.includes("Collection") && !stat.title.includes("Period") ? "teal" :
                  stat.title.includes("Amount") ? "blue" :
                    stat.title.includes("Period") ? "orange" : "green"
              }
            />
          ))}
        </div>

        {/* Charts */}
        <div className="grid gap-5 lg:grid-cols-3">
          <div className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-slate-800">
                Center-wise Milk Collection
              </h2>
              <div className="flex items-center gap-4 text-xs text-slate-500">
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-green-500" />
                  Morning
                </div>
                <div className="flex items-center gap-1">
                  <span className="h-3 w-3 rounded-full bg-blue-500" />
                  Evening
                </div>
              </div>
            </div>
            <div className="mt-5 flex h-48 items-end justify-between gap-3 px-1">
              {centerChartData.map((c) => (
                <div
                  key={c.name}
                  className="flex flex-1 flex-col items-center gap-2"
                >
                  <div className="flex h-40 items-end gap-1">
                    <div
                      className="w-7 rounded-t-lg bg-gradient-to-t from-green-600 to-green-400 max-h-40 min-h-1"
                      style={{ height: `${c.morningPerc}%` }}
                    />
                    <div
                      className="w-7 rounded-t-lg bg-gradient-to-t from-blue-600 to-blue-400 max-h-40 min-h-1"
                      style={{ height: `${c.eveningPerc}%` }}
                    />
                  </div>
                  <span className="text-xs font-medium text-slate-600 overflow-hidden text-ellipsis whitespace-nowrap max-w-full">
                    {c.name}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-sm">
            <h2 className="mb-5 font-semibold text-slate-800">
              FAT &amp; SNF Trends (7 Days)
            </h2>
            <div className="h-48 relative">
              <svg className="h-full w-full" viewBox="0 0 200 100">
                <line x1="0" y1="25" x2="200" y2="25" stroke="#e2e8f0" />
                <line x1="0" y1="50" x2="200" y2="50" stroke="#e2e8f0" />
                <line x1="0" y1="75" x2="200" y2="75" stroke="#e2e8f0" />
                <polyline
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="10,60 40,55 70,58 100,50 130,48 160,45 190,42"
                />
                <circle cx="190" cy="42" r="4" fill="#22c55e" />
                <polyline
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  points="10,35 40,38 70,32 100,30 130,28 160,25 190,22"
                />
                <circle cx="190" cy="22" r="4" fill="#3b82f6" />
              </svg>
            </div>
            <div className="mt-2 flex items-center justify-center gap-6 text-sm text-slate-600">
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-green-500" />
                FAT %
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3 w-3 rounded-full bg-blue-500" />
                SNF %
              </span>
            </div>
          </div>
        </div>

        {/* Alerts table */}
        <div className="rounded-2xl bg-white p-5 shadow-sm">
          <div className="mb-5 flex items-center justify-between">
            <h2 className="font-semibold text-slate-800">
              Quality Alerts - Possible Adulteration
            </h2>
            {filteredAlerts.length > 0 && (
              <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                {filteredAlerts.length} Alerts
              </span>
            )}
          </div>
          <div className="overflow-x-auto mt-4">
            <DataTable
              columns={alertColumns}
              data={filteredAlerts}
              keyField="farmerId"
              emptyMessage="No quality alerts found for the selected filters."
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;