import { useEffect, useState } from "react";
import api from "../lib/api";

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/admin/analytics/dashboard").then(res => {
      setStats(res.data);
    });
  }, []);

  if (!stats) return <div>Loading dashboard...</div>;

  const Card = ({ label, value }) => (
    <div className="bg-white rounded shadow p-4">
      <div className="text-sm text-gray-500">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* KPI GRID */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card label="Total Orders" value={stats.totalOrders} />
        <Card label="Completed Orders" value={stats.completedOrders} />
        <Card label="Cancelled Orders" value={stats.cancelledOrders} />
        <Card label="Total Users" value={stats.totalUsers} />
        <Card label="Total Vendors" value={stats.totalVendors} />
        <Card
          label="Total Revenue"
          value={`₦${stats.totalRevenue.toLocaleString()}`}
        />
      </div>

      {/* RECENT ORDERS */}
      <div className="bg-white rounded shadow p-4">
        <h2 className="font-bold mb-3">Recent Orders</h2>

        <div className="space-y-2">
          {stats.recentOrders.map(o => (
            <div
              key={o._id}
              className="flex justify-between text-sm border-b pb-1"
            >
              <span>{o._id.slice(-6)}</span>
              <span>{o.status}</span>
              <span>₦{o.totalAmount}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
