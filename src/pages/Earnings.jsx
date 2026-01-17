import { useEffect, useState } from "react";
import api from "../lib/api";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";

export default function Earnings() {
  const [data, setData] = useState(null);
  const [range, setRange] = useState("week");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadEarnings() {
      try {
        setLoading(true);
        const res = await api.get(`/admin/earnings?range=${range}`);
        setData(res.data || {});
      } catch (err) {
        console.error("Earnings error", err);
        setData({});
      } finally {
        setLoading(false);
      }
    }

    loadEarnings();
  }, [range]);

  if (loading) {
    return <div className="text-gray-500">Loading earnings…</div>;
  }

  const daily = Array.isArray(data.daily) ? data.daily : [];

  return (
    <div className="space-y-6">
      {/* =====================
          RANGE FILTER
      ===================== */}
      <div className="flex gap-3">
        {["today", "week", "month"].map(r => (
          <button
            key={r}
            onClick={() => setRange(r)}
            className={`px-4 py-2 rounded text-sm font-medium ${
              range === r
                ? "bg-blue-600 text-white"
                : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            {r.toUpperCase()}
          </button>
        ))}
      </div>

      {/* =====================
          STATS
      ===================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Stat title="Total Revenue" value={data.totalRevenue} />
        <Stat title="Platform Earnings" value={data.platformEarnings} green />
        <Stat title="Vendor Earnings" value={data.vendorEarnings} blue />
        <Stat title="Completed Orders" value={data.completedOrders} />
      </div>

      {/* =====================
          CHART
      ===================== */}
      <div className="bg-white p-6 rounded-lg shadow h-[320px]">
        <h3 className="font-semibold mb-4">Revenue Trend</h3>

        {daily.length === 0 ? (
          <div className="text-gray-400 text-sm">
            No data available for this period
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={daily}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#2563eb"
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

/* =====================
   STAT CARD
===================== */
function Stat({ title, value, green, blue }) {
  return (
    <div className="bg-white p-5 rounded-lg shadow">
      <div className="text-sm text-gray-500">{title}</div>
      <div
        className={`text-2xl font-bold ${
          green ? "text-green-600" : blue ? "text-blue-600" : ""
        }`}
      >
        {typeof value === "number"
          ? value > 1000
            ? `₦${value.toLocaleString()}`
            : value
          : "—"}
      </div>
    </div>
  );
}
