import React, { useState, useEffect } from "react";
import { api } from "../../services/api";
import type { Center, MilkCollection } from "../../types/models";

interface ReportConfig {
  type: string;
  center: string;
  dateRange: string;
  mode: string;
  shift: string;
}

const Reports: React.FC = () => {
  const [activeTab, setActiveTab] = useState("Milk Collection");
  const [timeMode, setTimeMode] = useState<"Daily" | "Monthly">("Daily");

  // Form State
  const [reportType, setReportType] = useState("Milk Collection");
  const [dateRange, setDateRange] = useState("Today");
  const [centerId, setCenterId] = useState("All Centers");
  const [shift, setShift] = useState("Both Shifts");

  // Data State
  const [centers, setCenters] = useState<Center[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [collections, setCollections] = useState<MilkCollection[]>([]);

  // Output State
  const [isGenerated, setIsGenerated] = useState(false);
  const [generatedConfig, setGeneratedConfig] = useState<ReportConfig | null>(null);

  useEffect(() => {
    const fetchInitData = async () => {
      setIsLoading(true);
      try {
        const loadedCenters = await api.getCenters();
        setCenters(loadedCenters);
      } catch (err) {
        console.error("Failed to fetch centers", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchInitData();
  }, []);

  const resolveDateRange = (range: string) => {
    const today = new Date();
    const isoToday = today.toISOString().split("T")[0];

    if (range === "Today") return { startDate: isoToday, endDate: isoToday };

    if (range === "This Week") {
      const start = new Date(today);
      start.setDate(today.getDate() - today.getDay());
      return { startDate: start.toISOString().split("T")[0], endDate: isoToday };
    }

    if (range === "This Month") {
      const start = new Date(today.getFullYear(), today.getMonth(), 1);
      return { startDate: start.toISOString().split("T")[0], endDate: isoToday };
    }

    return {};
  };

  const handleGenerate = async () => {
    setIsGenerating(true);
    setIsGenerated(false);
    try {
      const dates = resolveDateRange(dateRange);
      const data = await api.getCollections({
        centerId: centerId !== "All Centers" ? centerId : undefined,
        shift: shift !== "Both Shifts" ? shift.replace(" Only", "") : undefined,
        ...dates
      });
      setCollections(data);
      setGeneratedConfig({ type: reportType, center: centerId, dateRange, mode: timeMode, shift });
      setIsGenerated(true);
    } catch (err) {
      console.error("Failed to generate report", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const tabs = [
    { id: "Milk Collection", title: "Milk Collection", desc: "Total volumes & FAT/SNF", icon: "m12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477-4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" },
    { id: "Cow/Buffalo Yield", title: "Cow/Buffalo Yield", desc: "Type-wise breakdown", icon: "M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" },
    { id: "Billing", title: "Billing", desc: "Payments & deductions", icon: "M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" },
    { id: "Inventory", title: "Inventory", desc: "Stock levels & value", icon: "M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" },
  ];

  const renderTableData = () => {
    if (!generatedConfig) return null;
    const type = generatedConfig.type;

    // Group collections by center
    const centerMap: Record<string, {
      name: string, morningL: number, eveningL: number, totalL: number,
      sumFat: number, sumSnf: number, count: number, farmers: Set<string>,
      totalAmount: number, cowL: number, buffaloL: number, mixL: number
    }> = {};

    collections.forEach(c => {
      if (!centerMap[c.centerId]) {
        const cName = centers.find(center => center.id === c.centerId)?.dairyName || c.centerId;
        centerMap[c.centerId] = {
          name: cName, morningL: 0, eveningL: 0, totalL: 0,
          sumFat: 0, sumSnf: 0, count: 0, farmers: new Set(),
          totalAmount: 0, cowL: 0, buffaloL: 0, mixL: 0
        };
      }
      const st = centerMap[c.centerId];
      if (c.shift === "Morning") st.morningL += c.quantity;
      if (c.shift === "Evening") st.eveningL += c.quantity;

      if (c.milkType === "Cow") st.cowL += c.quantity;
      if (c.milkType === "Buffalo") st.buffaloL += c.quantity;
      if (c.milkType === "Mix") st.mixL += c.quantity;

      st.totalL += c.quantity;
      st.sumFat += c.fat;
      st.sumSnf += c.snf;
      st.count += 1;
      st.totalAmount += c.totalAmount;
      st.farmers.add(c.farmerId);
    });

    const entries = Object.values(centerMap);

    if (entries.length === 0) {
      return (
        <div className="py-8 text-center text-slate-500">
          No records found for the selected criteria.
        </div>
      );
    }

    if (type === "Milk Collection") {
      const grandTotalMorning = entries.reduce((s, c) => s + c.morningL, 0);
      const grandTotalEvening = entries.reduce((s, c) => s + c.eveningL, 0);
      const grandTotal = entries.reduce((s, c) => s + c.totalL, 0);
      const grandAvgFat = entries.reduce((s, c) => s + (c.sumFat / c.count), 0) / entries.length || 0;
      const grandAvgSnf = entries.reduce((s, c) => s + (c.sumSnf / c.count), 0) / entries.length || 0;

      return (
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Center</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Morning (L)</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Evening (L)</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Total (L)</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Avg FAT</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Avg SNF</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((st, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition">
                <td className="py-3 px-4 text-sm font-medium text-slate-700">{st.name}</td>
                <td className="py-3 px-4 text-sm text-slate-600">{Math.round(st.morningL).toLocaleString()}</td>
                <td className="py-3 px-4 text-sm text-slate-600">{Math.round(st.eveningL).toLocaleString()}</td>
                <td className="py-3 px-4 text-sm font-semibold text-slate-800">{Math.round(st.totalL).toLocaleString()}</td>
                <td className="py-3 px-4 text-sm font-semibold text-green-600">{(st.sumFat / st.count).toFixed(1)}%</td>
                <td className="py-3 px-4 text-sm font-semibold text-blue-600">{(st.sumSnf / st.count).toFixed(1)}%</td>
              </tr>
            ))}
            <tr className="bg-slate-50">
              <td className="py-3 px-4 text-sm font-bold text-slate-800">TOTAL</td>
              <td className="py-3 px-4 text-sm font-bold text-slate-800">{Math.round(grandTotalMorning).toLocaleString()}</td>
              <td className="py-3 px-4 text-sm font-bold text-slate-800">{Math.round(grandTotalEvening).toLocaleString()}</td>
              <td className="py-3 px-4 text-sm font-bold text-slate-800">{Math.round(grandTotal).toLocaleString()}</td>
              <td className="py-3 px-4 text-sm font-bold text-green-700">{grandAvgFat.toFixed(1)}%</td>
              <td className="py-3 px-4 text-sm font-bold text-blue-700">{grandAvgSnf.toFixed(1)}%</td>
            </tr>
          </tbody>
        </table>
      );
    }

    if (type === "Billing") {
      return (
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Center</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Farmers Billed</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Gross Amt</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Deductions (2%)</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Net Payable</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((st, i) => {
              const deductions = st.totalAmount * 0.02; // Simulate 2% deduction
              const netPayable = st.totalAmount - deductions;
              const isPaid = i % 2 === 0;

              return (
                <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition">
                  <td className="py-3 px-4 text-sm font-medium text-slate-700">{st.name}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">{st.farmers.size}</td>
                  <td className="py-3 px-4 text-sm text-slate-600">₹{st.totalAmount.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm text-red-600">-₹{deductions.toLocaleString()}</td>
                  <td className="py-3 px-4 text-sm font-bold text-slate-800">₹{netPayable.toLocaleString()}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${isPaid ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                      {isPaid ? "Paid" : "Pending"}
                    </span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      );
    }

    if (type === "Cow/Buffalo Yield") {
      return (
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Center</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Cow Milk (L)</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Buffalo Milk (L)</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Mix Milk (L)</th>
              <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">Total Yield (L)</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((st, i) => (
              <tr key={i} className="border-b border-slate-50 hover:bg-slate-50 transition">
                <td className="py-3 px-4 text-sm font-medium text-slate-700">{st.name}</td>
                <td className="py-3 px-4 text-sm text-slate-600">{Math.round(st.cowL).toLocaleString()}</td>
                <td className="py-3 px-4 text-sm text-slate-600">{Math.round(st.buffaloL).toLocaleString()}</td>
                <td className="py-3 px-4 text-sm text-slate-600">{Math.round(st.mixL).toLocaleString()}</td>
                <td className="py-3 px-4 text-sm font-bold text-slate-800">{Math.round(st.totalL).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }

    return (
      <div className="py-8 text-center text-slate-500">
        Preview data layout for {type} is not mocked yet.
      </div>
    );
  };

  return (
    <div className="h-full w-full overflow-auto bg-slate-50 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Reports &amp; Analytics</h2>
          <p className="text-slate-500 text-sm mt-1">Generate and export center manager synced reports</p>
        </div>
        <div className="flex bg-slate-200 p-1 rounded-lg">
          {(["Daily", "Monthly"] as const).map((mode) => (
            <button
              key={mode}
              className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${timeMode === mode ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"
                }`}
              onClick={() => setTimeMode(mode)}
            >
              {mode} View
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-4 gap-5 mb-6">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id);
              setReportType(tab.title);
              setIsGenerated(false);
            }}
            className={`card p-5 text-left transition rounded-2xl border-2 ${activeTab === tab.id
              ? "border-green-500 bg-green-50/50 shadow-md"
              : "border-transparent bg-white shadow-sm hover:border-slate-200"
              }`}
          >
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 transition ${activeTab === tab.id ? "bg-green-500" : "bg-slate-100"
              }`}>
              <svg className={`w-6 h-6 transition ${activeTab === tab.id ? "text-white" : "text-slate-500"
                }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={tab.icon} />
              </svg>
            </div>
            <h3 className={`font-semibold mb-1 ${activeTab === tab.id ? "text-green-800" : "text-slate-800"}`}>{tab.title}</h3>
            <p className={`text-sm ${activeTab === tab.id ? "text-green-700/80" : "text-slate-500"}`}>{tab.desc}</p>
          </button>
        ))}
      </div>

      <div className="card p-6 mb-6 bg-white shadow-sm rounded-2xl border border-slate-200 relative overflow-hidden">
        {isLoading && (
          <div className="absolute inset-0 bg-white/70 backdrop-blur-sm z-10 flex items-center justify-center">
            <span className="text-slate-500 font-medium">Loading filters...</span>
          </div>
        )}
        <h3 className="font-semibold text-slate-800 mb-5">Generate Custom Report</h3>
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Report Type</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option>Milk Collection</option>
              <option>Cow/Buffalo Yield</option>
              <option>Billing</option>
              {/* <option>Inventory</option> - Removed inventory as it's not strictly tied to local simple collections API */}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Date Range</label>
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option>Today</option>
              <option>This Week</option>
              <option>This Month</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Collection Center</label>
            <select
              value={centerId}
              onChange={(e) => setCenterId(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
            >
              <option value="All Centers">All Centers</option>
              {centers.map(c => (
                <option key={c.id} value={c.id}>{c.dairyName}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-2">Shift</label>
            <select
              value={shift}
              onChange={(e) => setShift(e.target.value)}
              className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
            >
              <option>Both Shifts</option>
              <option>Morning Only</option>
              <option>Evening Only</option>
            </select>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={() => { void handleGenerate(); }} disabled={isGenerating} className="px-6 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-green-200 hover:shadow-green-300 transition flex items-center gap-2">
            {isGenerating ? "Generating..." : "Generate Report"}
          </button>
          <button className="px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition flex items-center gap-2 disabled:opacity-50" disabled={!isGenerated}>
            Export PDF
          </button>
          <button className="px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition flex items-center gap-2 disabled:opacity-50" disabled={!isGenerated}>
            Export Excel
          </button>
        </div>
      </div>

      {isGenerated && generatedConfig && (
        <div className="card p-6 bg-white shadow-sm rounded-2xl mb-6 border border-slate-200 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-800">
              Report Preview - {generatedConfig.type} ({generatedConfig.mode})
            </h3>
            <span className="text-sm text-slate-500">Center: {generatedConfig.center === "All Centers" ? "All Centers" : centers.find(c => c.id === generatedConfig.center)?.dairyName} | Range: {generatedConfig.dateRange}</span>
          </div>
          <div className="overflow-x-auto">
            {renderTableData()}
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;
