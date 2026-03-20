import { useEffect, useState, useRef } from "react";
import api from "../lib/api";
import { io } from "socket.io-client";
import { GoogleMap, Marker, useJsApiLoader } from "@react-google-maps/api";

function statusBadge(status) {
  const map = {
    pending: "bg-orange-100 text-orange-700",
    accepted: "bg-blue-100 text-blue-700",
    preparing: "bg-purple-100 text-purple-700",
    dispatched: "bg-indigo-100 text-indigo-700",
    rider_assigned: "bg-blue-100 text-blue-700",
    searching_rider: "bg-yellow-100 text-yellow-700",
    on_the_way: "bg-indigo-100 text-indigo-700",
    delivered: "bg-green-100 text-green-700",
    completed: "bg-green-100 text-green-700",
    cancelled: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-700"}`}>
      {status.replace(/_/g, " ")}
    </span>
  );
}

const ORDER_FLOW = ["pending", "accepted", "preparing", "rider_assigned", "on_the_way", "delivered", "completed"];

function OrderTimeline({ status }) {
  const currentIndex = ORDER_FLOW.indexOf(status);
  return (
    <div className="flex items-center gap-1 text-xs mt-2 flex-wrap">
      {ORDER_FLOW.map((step, i) => (
        <div key={step} className="flex items-center gap-1">
          <div className={`w-2.5 h-2.5 rounded-full ${i <= currentIndex ? "bg-green-500" : "bg-gray-300"}`} />
          <span className={i <= currentIndex ? "text-green-600" : "text-gray-400"}>
            {step.replace(/_/g, " ")}
          </span>
          {i < ORDER_FLOW.length - 1 && <div className="w-4 h-px bg-gray-300" />}
        </div>
      ))}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders] = useState([]);
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [assigningOrder, setAssigningOrder] = useState(null);
  const [selectedRider, setSelectedRider] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [search, setSearch] = useState("");

  const socketRef = useRef(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: import.meta.env.VITE_GOOGLE_MAPS_KEY,
  });

  // Socket for live updates
  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL);

    socketRef.current.on("order_status_update", updated => {
      setOrders(prev => prev.map(o => o._id === updated._id ? updated : o));
    });

    socketRef.current.on("order_rider_location_update", payload => {
      setOrders(prev =>
        prev.map(o =>
          o.rider?._id === payload.riderId
            ? { ...o, riderLiveLocation: payload.location }
            : o
        )
      );
    });

    return () => socketRef.current.disconnect();
  }, []);

  const loadOrders = async () => {
    try {
      // Uses adminOrders.routes.js → GET /api/admin/orders
      const res = await api.get("/admin/orders");
      setOrders(res.data || []);
    } catch {
      console.error("Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  const loadRiders = async () => {
    try {
      // Fixed: was /riders (public), now /admin/riders (protected)
      const res = await api.get("/admin/riders");
      setRiders(res.data || []);
    } catch {}
  };

  useEffect(() => {
    loadOrders();
    loadRiders();
    const interval = setInterval(loadOrders, 8000);
    return () => clearInterval(interval);
  }, []);

  const cancel = async id => {
    if (!confirm("Cancel this order?")) return;
    setActionId(id);
    try {
      // adminOrders.routes.js → PATCH /api/admin/orders/:id/cancel
      await api.patch(`/admin/orders/${id}/cancel`);
      await loadOrders();
    } finally {
      setActionId(null);
    }
  };

  const forceComplete = async id => {
    if (!confirm("Force complete this order?")) return;
    setActionId(id);
    try {
      // adminOrders.routes.js → PATCH /api/admin/orders/:id/force-complete
      await api.patch(`/admin/orders/${id}/force-complete`);
      await loadOrders();
    } finally {
      setActionId(null);
    }
  };

  const assignRider = async orderId => {
    if (!selectedRider) return alert("Select a rider");
    try {
      // riderRoutes.js → POST /api/riders/assign/:orderId
      await api.post(`/riders/assign/${orderId}`, { riderId: selectedRider });
      setAssigningOrder(null);
      setSelectedRider("");
      await loadOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign rider");
    }
  };

  const filteredOrders = orders.filter(o => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (paymentFilter !== "all" && o.paymentStatus !== paymentFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o._id.toLowerCase().includes(q) ||
        o.user?.email?.toLowerCase().includes(q) ||
        o.vendor?.businessName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) return <div className="text-gray-500 p-6">Loading orders…</div>;

  const availableRiders = riders.filter(r => r.isAvailable && r.isActive !== false);

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Orders</h1>
        <span className="text-sm text-gray-500">{filteredOrders.length} orders</span>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-lg shadow flex flex-wrap gap-3 sticky top-2 z-10">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search Order ID, Vendor, User..."
          className="px-3 py-2 border rounded text-sm w-64"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="preparing">Preparing</option>
          <option value="rider_assigned">Rider Assigned</option>
          <option value="on_the_way">On The Way</option>
          <option value="delivered">Delivered</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
          className="px-3 py-2 border rounded text-sm"
        >
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
        {(search || statusFilter !== "all" || paymentFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setStatusFilter("all"); setPaymentFilter("all"); }}
            className="px-4 py-2 bg-gray-200 rounded text-sm"
          >
            Reset
          </button>
        )}
      </div>

      {/* ORDERS */}
      {filteredOrders.map(o => {
        const ageMinutes = Math.floor((Date.now() - new Date(o.createdAt)) / 60000);
        const isLate = ageMinutes > 40 && !["delivered", "completed", "cancelled"].includes(o.status);

        return (
          <div
            key={o._id}
            className={`bg-white p-4 rounded shadow space-y-2 border-l-4 ${
              isLate ? "border-l-red-400" : "border-l-transparent"
            }`}
          >
            <div className="flex justify-between items-start gap-4">
              <div className="flex-1 min-w-0">
                <div className="font-bold">Order #{o._id.slice(-6)}</div>
                <div className="text-sm text-gray-500 truncate">
                  {o.user?.email} → {o.vendor?.businessName}
                </div>
                <div className="text-xs text-gray-400">
                  {formatMoney(o.totalAmount)} • {o.paymentStatus} • {ageMinutes}m ago
                </div>
                <div className="mt-2 flex gap-2 items-center flex-wrap">
                  {statusBadge(o.status)}
                  {isLate && (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded">
                      ⚠ SLA Breach
                    </span>
                  )}
                  {o.rider && (
                    <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded">
                      Rider: {o.rider.user?.name || o.rider.name || "Assigned"}
                    </span>
                  )}
                </div>
                <OrderTimeline status={o.status} />
              </div>

              <div className="flex gap-2 flex-wrap justify-end">
                {!o.rider && !["completed", "cancelled", "delivered"].includes(o.status) && (
                  <button
                    onClick={() => setAssigningOrder(assigningOrder === o._id ? null : o._id)}
                    className="px-3 py-1 bg-blue-600 text-white rounded text-xs"
                  >
                    Assign Rider
                  </button>
                )}
                <button
                  onClick={() => setExpanded(expanded === o._id ? null : o._id)}
                  className="px-3 py-1 bg-gray-200 rounded text-xs"
                >
                  {expanded === o._id ? "Hide" : "View"}
                </button>
                {!["completed", "cancelled"].includes(o.status) && (
                  <>
                    {o.status === "pending" && (
                      <button
                        disabled={actionId === o._id}
                        onClick={() => cancel(o._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    )}
                    <button
                      disabled={actionId === o._id}
                      onClick={() => forceComplete(o._id)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs disabled:opacity-50"
                    >
                      Force Complete
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* ASSIGN RIDER PANEL */}
            {assigningOrder === o._id && (
              <div className="bg-gray-50 p-3 rounded border flex gap-2 items-center flex-wrap">
                <select
                  value={selectedRider}
                  onChange={e => setSelectedRider(e.target.value)}
                  className="px-3 py-2 border rounded text-sm flex-1 min-w-48"
                >
                  <option value="">Select available rider...</option>
                  {availableRiders.map(r => (
                    <option key={r._id} value={r._id}>
                      {r.user?.name || "Unnamed"} — ⭐ {r.rating || 5} — {r.vehicleType}
                    </option>
                  ))}
                </select>
                {availableRiders.length === 0 && (
                  <span className="text-xs text-red-500">No available riders right now</span>
                )}
                <button
                  onClick={() => assignRider(o._id)}
                  disabled={!selectedRider}
                  className="px-3 py-2 bg-green-600 text-white rounded text-sm disabled:opacity-50"
                >
                  Confirm
                </button>
                <button
                  onClick={() => setAssigningOrder(null)}
                  className="px-3 py-2 bg-gray-300 rounded text-sm"
                >
                  Cancel
                </button>
              </div>
            )}

            {/* EXPANDED DETAILS */}
            {expanded === o._id && (
              <div className="border-t pt-3 text-sm space-y-1 text-gray-700">
                <div><strong>Delivery Address:</strong> {o.deliveryAddress || "N/A"}</div>
                <div><strong>User Phone:</strong> {o.user?.phone || "N/A"}</div>
                <div><strong>Vendor:</strong> {o.vendor?.businessName}</div>
                <div><strong>Payment Status:</strong> {o.paymentStatus}</div>
                <div><strong>Created:</strong> {new Date(o.createdAt).toLocaleString()}</div>
                {o.cancelledAt && <div><strong>Cancelled:</strong> {new Date(o.cancelledAt).toLocaleString()}</div>}
                {o.completedAt && <div><strong>Completed:</strong> {new Date(o.completedAt).toLocaleString()}</div>}
              </div>
            )}

            {/* LIVE RIDER MAP */}
            {isLoaded && o.riderLiveLocation && (
              <div className="mt-3 h-52 rounded overflow-hidden border">
                <GoogleMap
                  mapContainerStyle={{ width: "100%", height: "100%" }}
                  center={{ lat: o.riderLiveLocation.lat, lng: o.riderLiveLocation.lng }}
                  zoom={15}
                >
                  <Marker position={o.riderLiveLocation} />
                </GoogleMap>
              </div>
            )}
          </div>
        );
      })}

      {filteredOrders.length === 0 && (
        <div className="text-center text-gray-400 py-10">No orders match selected filters</div>
      )}
    </div>
  );
}

function formatMoney(n) {
  return `₦${Number(n || 0).toLocaleString()}`;
}