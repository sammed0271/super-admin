import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getCenterFullDetails } from "../../axios/center_api";

const CenterDetails: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams();

  console.log("Center ID:", id);
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    if (!id) return;

    const fetchData = async () => {
      try {
        const res = await getCenterFullDetails(id);
        console.log("Full center details response:", res);
        setData(res);
      } catch (err) {
        console.error("Error fetching center details:", err);
      }
    };

    fetchData();
  }, [id]);

  if (!data) return <div>Loading...</div>;

  return (

    <div className="p-6 space-y-6 bg-slate-50 min-h-screen">

      {/* HEADER */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">
            {data.center.name}
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Code: {data.center.code}
          </p>
        </div>

        <span
          className={`px-3 py-1 text-xs font-semibold rounded-full ${data.center.status === "Active"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
            }`}
        >
          {data.center.status}
        </span>
      </div>

      {/* SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {[
          { label: "Total Milk", value: `${data.summary.totalMilk.toFixed(1)} L`, color: "text-green-600" },
          { label: "Avg FAT", value: data.summary.avgFat.toFixed(2), color: "text-blue-600" },
          { label: "Avg SNF", value: data.summary.avgSnf.toFixed(2), color: "text-indigo-600" },
          { label: "Farmers", value: data.summary.farmersCount, color: "text-slate-800" },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition"
          >
            <p className="text-sm text-slate-500 mb-1">{item.label}</p>
            <h3 className={`text-2xl font-bold ${item.color}`}>
              {item.value}
            </h3>
          </div>
        ))}
      </div>

      {/* FARMERS */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-800">Farmers</h3>
          <span className="text-sm text-slate-500">
            {data.farmers.length} total
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="text-left py-3 px-4 font-medium">Name</th>
                <th className="text-left py-3 px-4 font-medium">Code</th>
              </tr>
            </thead>
            <tbody>
              {data.farmers.map((f: any) => (
                <tr
                  key={f._id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {f.name}
                  </td>
                  <td className="py-3 px-4 text-slate-500">
                    {f.code}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* RECENT MILK */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-semibold text-slate-800">
            Recent Milk Entries
          </h3>
          <span className="text-sm text-slate-500">
            Last {data.milk.length} records
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-100 text-slate-600">
              <tr>
                <th className="text-left py-3 px-4 font-medium">Date</th>
                <th className="text-left py-3 px-4 font-medium">Farmer</th>
                <th className="text-left py-3 px-4 font-medium">Liters</th>
                <th className="text-left py-3 px-4 font-medium">FAT</th>
                <th className="text-left py-3 px-4 font-medium">SNF</th>
              </tr>
            </thead>
            <tbody>
              {data.milk.map((m: any) => (
                <tr
                  key={m._id}
                  className="border-b border-slate-100 hover:bg-slate-50 transition"
                >
                  <td className="py-3 px-4 text-slate-600">
                    {m.date}
                  </td>
                  <td className="py-3 px-4 font-medium text-slate-700">
                    {m.farmerId?.name}
                  </td>
                  <td className="py-3 px-4 text-slate-600">
                    {m.quantity}
                  </td>
                  <td className="py-3 px-4 text-green-600 font-semibold">
                    {m.fat}
                  </td>
                  <td className="py-3 px-4 text-blue-600 font-semibold">
                    {m.snf}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* BACK BUTTON */}
      <div>
        <button
          onClick={() => navigate("/centers")}
          className="px-5 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 transition"
        >
          ← Back to Centers
        </button>
      </div>

    </div>


  );
};

export default CenterDetails;