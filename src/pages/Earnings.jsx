import { useEffect, useState } from "react";
import api from "../lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Earnings() {
  const [range, setRange] = useState("week");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    platformEarnings: 0,
    vendorEarnings: 0,
    completedOrders: 0,
  });
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    fetchEarnings();
  }, [range]);

  const fetchEarnings = async () => {
    try {
      setLoading(true);
      setError("");

      const [summaryRes, earningsRes] = await Promise.all([
        api.get("/admin/earnings/summary"),
        api.get(`/admin/earnings?range=${range}`),
      ]);

      setSummary({
        totalRevenue: summaryRes.data?.totalRevenue || 0,
        platformEarnings: summaryRes.data?.platformEarnings || 0,
        vendorEarnings: summaryRes.data?.vendorEarnings || 0,
        completedOrders: summaryRes.data?.completedOrders || 0,
      });

      const rawChart = earningsRes.data?.chartData || [];

      setChartData(
        rawChart.map(d => ({
          ...d,
          date: new Date(d.date).toLocaleDateString(),
        }))
      );
    } catch (err) {
      setError("Failed to load earnings data");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-gray-600">Loading earnings…</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="space-y-8">

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Earnings & Revenue</h1>

        <div className="flex gap-2">
          {["today", "week", "month"].map(r => (
            <button
              key={r}
              onClick={() => setRange(r)}
              className={`px-4 py-2 rounded text-sm transition ${
                range === r
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {r.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* KPI SUMMARY */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <StatCard title="Total Revenue" value={`₦${Number(summary.totalRevenue).toLocaleString()}`} highlight />
        <StatCard title="Platform Earnings" value={`₦${Number(summary.platformEarnings).toLocaleString()}`} />
        <StatCard title="Vendor Earnings" value={`₦${Number(summary.vendorEarnings).toLocaleString()}`} />
        <StatCard title="Completed Orders" value={summary.completedOrders} />
      </div>

      {/* CHART */}
      <div className="bg-white p-6 rounded-xl shadow space-y-3">
        <div className="flex justify-between items-center">
          <h2 className="font-semibold">Revenue Trend</h2>
          <span className="text-xs text-gray-500">
            {range.toUpperCase()} view
          </span>
        </div>

        {chartData.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No earnings data for this period
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="amount"
                strokeWidth={3}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

    </div>
  );
}

function StatCard({ title, value, highlight }) {
  return (
    <div className={`p-5 rounded-xl shadow bg-white ${highlight ? "ring-2 ring-blue-200" : ""}`}>
      <p className="text-sm text-gray-500 mb-1">{title}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
