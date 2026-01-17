import { useEffect, useState } from "react";
import api from "../lib/api";

export default function Orders() {
  const [orders, setOrders] = useState([]);

  const loadOrders = async () => {
    const res = await api.get("/admin/orders");
    setOrders(res.data);
  };

  const cancel = async (id) => {
    if (!confirm("Cancel this order?")) return;
    await api.patch(`/admin/orders/${id}/cancel`);
    loadOrders();
  };

  const forceComplete = async (id) => {
    if (!confirm("Force complete this order?")) return;
    await api.patch(`/admin/orders/${id}/force-complete`);
    loadOrders();
  };

  useEffect(() => {
    loadOrders();
  }, []);

  return (
    <div className="space-y-4">
      {orders.map(o => (
        <div
          key={o._id}
          className="bg-white p-4 rounded shadow flex justify-between"
        >
          <div>
            <div className="font-bold">Order #{o._id.slice(-6)}</div>
            <div className="text-sm text-gray-500">
              {o.user?.email} → {o.vendor?.businessName}
            </div>
            <div className="text-xs mt-1">Status: {o.status}</div>
          </div>

          <div className="space-x-2">
            {o.status === "pending" && (
              <button
                onClick={() => cancel(o._id)}
                className="px-3 py-1 bg-red-600 text-white rounded text-xs"
              >
                Cancel
              </button>
            )}

            {o.status !== "completed" && (
              <button
                onClick={() => forceComplete(o._id)}
                className="px-3 py-1 bg-green-600 text-white rounded text-xs"
              >
                Force Complete
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
