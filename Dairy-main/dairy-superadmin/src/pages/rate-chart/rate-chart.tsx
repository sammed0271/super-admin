import React, { useEffect, useState } from "react";
import { api } from "../../services/api";
import type { RateConfig, Center } from "../../types/models";

type MilkType = "Cow" | "Buffalo" | "Mix";

const RateChartPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<MilkType>("Cow");
  const [rates, setRates] = useState<Record<MilkType, { fatFactor: number; snfFactor: number; baseRate: number }>>({
    Cow: { fatFactor: 4.0, snfFactor: 1.0, baseRate: 20.0 },
    Buffalo: { fatFactor: 4.5, snfFactor: 1.2, baseRate: 25.0 },
    Mix: { fatFactor: 4.2, snfFactor: 1.1, baseRate: 22.5 },
  });

  const [sampleFat, setSampleFat] = useState(4.2);
  const [sampleSnf, setSampleSnf] = useState(8.7);
  const [effectiveDate, setEffectiveDate] = useState("2025-02-16");
  const [applyTo, setApplyTo] = useState("All Centers");
  const [showMatrix, setShowMatrix] = useState(false);

  const [centers, setCenters] = useState<Center[]>([]);
  const [rateHistory, setRateHistory] = useState<RateConfig[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchRatesAndCenters = async () => {
    setIsLoading(true);
    try {
      const [fetchedCenters, fetchedRates] = await Promise.all([
        api.getCenters(),
        api.getRateConfigs()
      ]);
      setCenters(fetchedCenters);
      setRateHistory(fetchedRates);

      // Attempt to load the most recent 'Active' rate config for each milk type to preset the inputs
      const newRates = { ...rates };
      (["Cow", "Buffalo", "Mix"] as MilkType[]).forEach(type => {
        const activeConfig = fetchedRates.find(c => c.milkType === type && c.status === "Active");
        if (activeConfig) {
          newRates[type] = {
            fatFactor: activeConfig.fatFactor,
            snfFactor: activeConfig.snfFactor,
            baseRate: activeConfig.baseRate
          };
        }
      });
      setRates(newRates);
    } catch (e) {
      console.error("Failed to fetch rates", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRatesAndCenters();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const activeRates = rates[activeTab];

  const updateActiveRates = (field: "fatFactor" | "snfFactor" | "baseRate", value: number) => {
    setRates((prev) => ({
      ...prev,
      [activeTab]: {
        ...prev[activeTab],
        [field]: value,
      },
    }));
  };

  const calculateRate = (fat: number, snf: number): number => {
    return activeRates.baseRate + fat * activeRates.fatFactor + snf * activeRates.snfFactor;
  };

  const calculatedRate = calculateRate(sampleFat, sampleSnf);

  const fatSteps = [3, 3.2, 3.4, 3.6, 3.8, 4, 4.2, 4.4, 4.6, 4.8, 5];
  const snfSteps = [7, 7.2, 7.4, 7.6, 7.8, 8, 8.2, 8.4, 8.6, 8.8, 9, 9.2, 9.4, 9.6, 9.8, 10];

  const formatEffectiveDate = (value: string) => {
    const parsed = new Date(`${value}T00:00:00`);
    if (Number.isNaN(parsed.getTime())) return value;
    return parsed.toLocaleDateString("en-US", {
      month: "short",
      day: "2-digit",
      year: "numeric",
    });
  };

  const handleSaveRateChart = async () => {
    if (isLoading) return;

    // Convert 'applyTo' target centers
    const targetCenterIds = applyTo === "All Centers" ? centers.map(c => c.id) : [applyTo];

    const newConfig: RateConfig = {
      id: `RC-${Date.now()}`,
      milkType: activeTab,
      appliedCenterIds: targetCenterIds,
      fatFactor: activeRates.fatFactor,
      snfFactor: activeRates.snfFactor,
      baseRate: activeRates.baseRate,
      effectiveDate: effectiveDate,
      status: "Active",
      changedBy: "Rajesh Sharma (Admin)"
    };

    setIsLoading(true);
    await api.saveRateConfig(newConfig);
    alert(`Rate Chart saved for ${activeTab} milk!`);
    await fetchRatesAndCenters(); // Refresh
  };

  const resolveCenterNames = (ids: string[]) => {
    if (ids.length === centers.length) return "All Centers";
    const names = ids.map(id => centers.find(c => c.id === id)?.dairyName || id);
    return names.join(", ");
  };

  const InfoIcon = () => (
    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
    </svg>
  );

  return (
    <div className="space-y-6 p-6 overflow-y-auto bg-slate-50 h-full">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-slate-800">Smart Rate Chart</h2>
        <p className="text-slate-500 text-sm mt-1">
          Configure milk purchase rates based on FAT and SNF values for different milk types
        </p>
      </div>

      {isLoading && rateHistory.length === 0 && (
        <div className="p-6 bg-white rounded-xl text-center text-slate-500 shadow-sm animate-pulse">
          Loading rate charts...
        </div>
      )}

      {/* Main Content Grid */}
      <div className={`grid grid-cols-3 gap-5 transition-opacity duration-300 ${isLoading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
        {/* Base Rate Configuration */}
        <div className="card p-6 col-span-2 bg-white rounded-lg border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-semibold text-slate-800">
              Base Rate Configuration
            </h3>
            <div className="flex bg-slate-100 p-1 rounded-lg">
              {(["Cow", "Buffalo", "Mix"] as MilkType[]).map((type) => (
                <button
                  key={type}
                  className={`px-4 py-1.5 text-sm font-medium rounded-md transition ${activeTab === type
                    ? "bg-white text-green-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-800"
                    }`}
                  onClick={() => setActiveTab(type)}
                >
                  {type} Milk
                </button>
              ))}
            </div>
          </div>

          {/* Input Fields Grid */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Fat Factor
              </label>
              <input
                type="number"
                value={activeRates.fatFactor}
                onChange={(e) => updateActiveRates("fatFactor", Number(e.target.value) || 0)}
                step="0.1"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-semibold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                SNF Factor
              </label>
              <input
                type="number"
                value={activeRates.snfFactor}
                onChange={(e) => updateActiveRates("snfFactor", Number(e.target.value) || 0)}
                step="0.1"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-semibold"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Base Rate (₹/L)
              </label>
              <input
                type="number"
                value={activeRates.baseRate}
                onChange={(e) => updateActiveRates("baseRate", Number(e.target.value) || 0)}
                step="0.5"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 text-lg font-semibold"
              />
            </div>
          </div>

          {/* Formula Box */}
          <div className="bg-blue-50 rounded-xl p-4 mb-6">
            <h4 className="font-semibold text-blue-800 mb-2 flex items-center gap-2">
              <InfoIcon />
              Rate Calculation Formula ({activeTab})
            </h4>
            <p className="text-sm text-blue-700 font-mono bg-blue-100 rounded-lg p-3">
              Rate = Base Rate + (FAT × Fat Factor) + (SNF × SNF Factor)
            </p>
          </div>

          {/* Bottom Controls */}
          <div className="flex items-center gap-4 mb-6">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Effective Date
              </label>
              <input
                type="date"
                value={effectiveDate}
                onChange={(e) => setEffectiveDate(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Apply To Centers
              </label>
              <select
                value={applyTo}
                onChange={(e) => setApplyTo(e.target.value)}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="All Centers">All Centers</option>
                {centers.map(c => (
                  <option key={c.id} value={c.id}>{c.dairyName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              type="button"
              disabled={isLoading}
              onClick={() => { void handleSaveRateChart(); }}
              className="flex-1 py-3 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-green-200 hover:shadow-green-300 transition disabled:opacity-70"
            >
              {isLoading ? "Saving..." : `Save & Apply ${activeTab} Rate Chart`}
            </button>
            <button
              type="button"
              onClick={() => setShowMatrix(true)}
              className="flex-1 py-3 border border-slate-200 text-slate-700 font-semibold rounded-xl hover:bg-slate-50 transition"
            >
              View Rate Chart Matrix
            </button>
          </div>
        </div>

        {/* Rate Preview Calculator */}
        <div className="card p-6 bg-white rounded-lg border border-slate-200 shadow-sm">
          <h3 className="font-semibold text-slate-800 mb-5">
            Rate Preview Calculator
          </h3>

          <div className="mb-4 text-sm text-slate-500">
            Previewing for <span className="font-semibold text-green-700">{activeTab} Milk</span>
          </div>

          <div className="space-y-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Sample FAT (%)
              </label>
              <input
                type="number"
                value={sampleFat}
                onChange={(e) => setSampleFat(Number(e.target.value) || 0)}
                step="0.1"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-600 mb-2">
                Sample SNF (%)
              </label>
              <input
                type="number"
                value={sampleSnf}
                onChange={(e) => setSampleSnf(Number(e.target.value) || 0)}
                step="0.1"
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>
          </div>

          <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-5 text-center transition-all">
            <p className="text-sm text-slate-600 mb-1">Calculated Rate</p>
            <p className="text-4xl font-bold text-green-700">
              ₹{calculatedRate.toFixed(2)}
            </p>
            <p className="text-xs text-slate-500 mt-1">per liter</p>
          </div>
        </div>
      </div>

      {/* Rate History Table */}
      <div className={`card p-5 bg-white rounded-lg border border-slate-200 shadow-sm transition-opacity ${isLoading ? 'opacity-60 pointer-events-none' : 'opacity-100'}`}>
        <h3 className="font-semibold text-slate-800 mb-5">Rate Change History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-100">
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                  Effective Date
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                  Milk Type
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                  Applied To
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                  Factors (FAT/SNF)
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                  Base Rate
                </th>
                <th className="text-left py-3 px-4 text-xs font-semibold text-slate-500 uppercase">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {rateHistory.map((history, index) => (
                <tr
                  key={history.id || index}
                  className="table-row border-b border-slate-50 transition hover:bg-slate-50"
                >
                  <td className="py-3 px-4 text-sm text-slate-700 font-medium">
                    {formatEffectiveDate(history.effectiveDate)}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 font-semibold">
                    {history.milkType}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {resolveCenterNames(history.appliedCenterIds)}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {history.fatFactor.toFixed(1)} / {history.snfFactor.toFixed(1)}
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600 font-semibold">
                    ₹{history.baseRate.toFixed(2)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 text-xs font-medium rounded-full ${history.status === "Active"
                        ? "bg-green-100 text-green-700"
                        : "bg-slate-100 text-slate-600"
                        }`}
                    >
                      {history.status}
                    </span>
                  </td>
                </tr>
              ))}
              {rateHistory.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-6 text-center text-sm text-slate-500">
                    No rate history found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showMatrix && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-slate-900/40"
            onClick={() => setShowMatrix(false)}
          />
          <div className="relative z-10 w-[92vw] max-w-5xl max-h-[80vh] overflow-hidden rounded-2xl bg-white shadow-xl">
            <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-800">
                  Rate Chart Matrix ({activeTab} Milk)
                </h3>
                <p className="text-sm text-slate-500">
                  Base: ₹{activeRates.baseRate.toFixed(2)}/L, Fat Factor {activeRates.fatFactor.toFixed(1)}, SNF Factor {activeRates.snfFactor.toFixed(1)}.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMatrix(false)}
                className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"
                aria-label="Close matrix"
              >
                <svg
                  className="h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 6l12 12M18 6l-12 12" />
                </svg>
              </button>
            </div>
            <div className="max-h-[calc(80vh-88px)] overflow-auto p-6">
              <table className="w-full text-sm mt-0 relative">
                <thead>
                  <tr className="border-b border-slate-100">
                    <th className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase bg-white sticky top-[0px] left-0 z-20 shadow-sm">
                      FAT \ SNF
                    </th>
                    {fatSteps.map((fat) => (
                      <th
                        key={fat}
                        className="text-left py-3 px-3 text-xs font-semibold text-slate-500 uppercase bg-white sticky top-[0px] z-10 shadow-sm"
                      >
                        {fat.toFixed(1)}%
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {snfSteps.map((snf) => (
                    <tr
                      key={snf}
                      className="border-b border-slate-50 transition hover:bg-slate-50"
                    >
                      <td className="py-3 px-3 font-semibold text-slate-700 bg-white sticky left-0 z-10 shadow-sm">
                        {snf.toFixed(1)}%
                      </td>
                      {fatSteps.map((fat) => (
                        <td
                          key={`${fat}-${snf}`}
                          className="py-3 px-3 text-slate-600"
                        >
                          ₹{calculateRate(fat, snf).toFixed(2)}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RateChartPage;
