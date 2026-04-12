import { useEffect, useState } from "react";
import api from "../lib/api";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";

const formatMoney = n => `₦${Number(n || 0).toLocaleString()}`;

function Card({ label, value, highlight }) {
  return (
    <div className="bg-white rounded-xl shadow-sm p-5 border hover:shadow transition">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">{label}</div>
      <div className={`text-2xl font-bold ${highlight ? "text-blue-600" : ""}`}>{value}</div>
    </div>
  );
}

const statusColor = status => {
  if (status === "delivered") return "text-green-600";
  if (status === "cancelled") return "text-red-500";
  if (status === "pending")   return "text-yellow-500";
  return "text-gray-500";
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.get("/admin/analytics/dashboard")
      .then(res => setStats(res.data))
      .catch(() => setError("Failed to load dashboard"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-gray-500 p-6">Loading dashboard...</div>;
  if (error)   return <div className="text-red-500 p-6">{error}</div>;
  if (!stats)  return null;

  const completionRate = stats.totalOrders > 0
    ? Math.round((stats.completedOrders / stats.totalOrders) * 100)
    : 0;

  return (
    <div className="space-y-8">

      <div>
        <h1 className="text-2xl font-bold">Foodrena Admin Overview</h1>
        <p className="text-gray-500 text-sm">Real-time platform performance & growth metrics</p>
      </div>

      {/* KPI GRID — now 8 cards including riders */}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-4">
        <Card label="Total Orders"    value={stats.totalOrders} />
        <Card label="Delivered"       value={stats.completedOrders} />
        <Card label="Cancelled"       value={stats.cancelledOrders} />
        <Card label="Users"           value={stats.totalUsers} />
        <Card label="Vendors"         value={stats.totalVendors} />
        <Card label="Riders"          value={stats.totalRiders} />
        <Card label="Total Revenue"   value={formatMoney(stats.totalRevenue)} highlight />
      </div>

      {/* COMPLETION RATE */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex justify-between items-center mb-2 text-sm">
          <span className="font-medium">Order Completion Rate</span>
          <span className="font-bold text-blue-600">{completionRate}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-blue-500 h-3 rounded-full transition-all"
            style={{ width: `${completionRate}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-gray-400 mt-1">
          <span>{stats.completedOrders} delivered</span>
          <span>{stats.cancelledOrders} cancelled</span>
        </div>
      </div>

      {/* REVENUE TREND */}
      {stats.revenueChart?.length > 0 ? (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold mb-4">Revenue Trend (last 14 days)</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.revenueChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" tick={{ fontSize: 11 }} />
              <YAxis tickFormatter={v => `₦${(v / 1000).toFixed(0)}k`} />
              <Tooltip formatter={v => formatMoney(v)} />
              <Line type="monotone" dataKey="amount" stroke="#2563eb"
                strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      ) : (
        <div className="bg-white rounded-xl shadow-sm border p-6 text-gray-400 text-sm">
          No revenue data yet
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

        {/* RECENT ORDERS */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <div className="flex justify-between items-center mb-4">
            <h2 className="font-semibold text-lg">Recent Orders</h2>
            <span className="text-xs text-gray-400">Last {stats.recentOrders?.length || 0}</span>
          </div>
          {stats.recentOrders?.length === 0 ? (
            <p className="text-gray-500 text-sm">No recent orders</p>
          ) : (
            <div className="space-y-3">
              {stats.recentOrders?.map(o => (
                <div key={o._id}
                  className="flex justify-between items-center text-sm border-b pb-2 last:border-0">
                  <span className="font-mono text-gray-500">#{o._id.slice(-6)}</span>
                  <span className="text-xs text-gray-400">{o.vendor?.businessName || "—"}</span>
                  <span className={`capitalize font-medium ${statusColor(o.status)}`}>
                    {o.status}
                  </span>
                  <span className="font-semibold">{formatMoney(o.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* TOP VENDORS */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold mb-4">Top Vendors by Revenue</h2>
          {stats.topVendors?.length === 0 ? (
            <p className="text-gray-400 text-sm">No vendor data yet</p>
          ) : (
            <div className="space-y-3">
              {stats.topVendors?.map((v, i) => (
                <div key={v._id} className="flex justify-between items-center text-sm">
                  <div className="flex items-center gap-2">
                    <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 text-xs flex items-center justify-center font-bold">
                      {i + 1}
                    </span>
                    <span>{v.businessName}</span>
                  </div>
                  <span className="font-semibold">{formatMoney(v.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  );
}