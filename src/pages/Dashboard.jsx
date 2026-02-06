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

  if (loading) return <div className="text-gray-500">Loading dashboard...</div>;
  if (error) return <div className="text-red-500">{error}</div>;
  if (!stats) return null;

  const formatMoney = n => `₦${Number(n || 0).toLocaleString()}`;

  const Card = ({ label, value, highlight }) => (
    <div className="bg-white rounded-xl shadow-sm p-5 border hover:shadow transition">
      <div className="text-xs text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </div>
      <div className={`text-2xl font-bold ${highlight ? "text-blue-600" : ""}`}>
        {value}
      </div>
    </div>
  );

  const statusColor = status => {
    if (status === "completed") return "text-green-600";
    if (status === "cancelled") return "text-red-500";
    if (status === "pending") return "text-yellow-500";
    return "text-gray-500";
  };

  return (
    <div className="space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Foodrena Admin Overview</h1>
        <p className="text-gray-500 text-sm">
          Real-time platform performance & growth metrics
        </p>
      </div>

      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <Card label="Total Orders" value={stats.totalOrders} />
        <Card label="Completed Orders" value={stats.completedOrders} />
        <Card label="Cancelled Orders" value={stats.cancelledOrders} />
        <Card label="Users" value={stats.totalUsers} />
        <Card label="Vendors" value={stats.totalVendors} />
        <Card label="Total Revenue" value={formatMoney(stats.totalRevenue)} highlight />
      </div>

      {/* REVENUE TREND */}
      {stats.revenueChart?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="font-semibold mb-4">Revenue Trend</h2>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={stats.revenueChart}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="amount" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* ORDER FUNNEL */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="font-semibold mb-3">Order Funnel</h2>

        <div className="grid grid-cols-3 gap-4 text-center text-sm">
          <div>
            <div className="font-bold text-lg">{stats.totalOrders}</div>
            <div className="text-gray-500">Total</div>
          </div>

          <div>
            <div className="font-bold text-lg text-green-600">
              {stats.completedOrders}
            </div>
            <div className="text-gray-500">Completed</div>
          </div>

          <div>
            <div className="font-bold text-lg text-red-600">
              {stats.cancelledOrders}
            </div>
            <div className="text-gray-500">Cancelled</div>
          </div>
        </div>
      </div>

      {/* RECENT ORDERS */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-semibold text-lg">Recent Orders</h2>
          <span className="text-xs text-gray-400">
            Last {stats.recentOrders?.length || 0} orders
          </span>
        </div>

        {stats.recentOrders?.length === 0 ? (
          <p className="text-gray-500 text-sm">No recent orders</p>
        ) : (
          <div className="space-y-3">
            {stats.recentOrders.map(o => (
              <div
                key={o._id}
                className="flex justify-between items-center text-sm border-b pb-2 last:border-0"
              >
                <span className="font-mono text-gray-500">
                  #{o._id.slice(-6)}
                </span>

                <span className={`capitalize font-medium ${statusColor(o.status)}`}>
                  {o.status}
                </span>

                <span className="font-semibold">
                  ₦{Number(o.totalAmount).toLocaleString()}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOP VENDORS */}
      {stats.topVendors?.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border p-5">
          <h2 className="font-semibold mb-3">Top Vendors</h2>

          <div className="space-y-2 text-sm">
            {stats.topVendors.map(v => (
              <div key={v._id} className="flex justify-between">
                <span>{v.businessName}</span>
                <span className="font-semibold">{formatMoney(v.revenue)}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
