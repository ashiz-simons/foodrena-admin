import { useEffect, useState, useRef } from "react";
import api from "../lib/api";
import { io } from "socket.io-client";

const fmt = n => `₦${Number(n || 0).toLocaleString()}`;

const fmtDate = d => d ? new Date(d).toLocaleString("en-NG", {
  day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit",
}) : "—";

const ageLabel = d => {
  const m = Math.floor((Date.now() - new Date(d)) / 60000);
  if (m < 60) return `${m}m ago`;
  return `${Math.floor(m / 60)}h ${m % 60}m ago`;
};

const fmtAddress = a => {
  if (!a) return "—";
  if (typeof a === "string") return a;
  return [a.street, a.city, a.state].filter(Boolean).join(", ") || "—";
};

const STATUS_COLORS = {
  pending:           "bg-orange-100 text-orange-700",
  accepted:          "bg-blue-100 text-blue-700",
  preparing:         "bg-purple-100 text-purple-700",
  searching_rider:   "bg-yellow-100 text-yellow-700",
  rider_assigned:    "bg-blue-100 text-blue-700",
  arrived_at_pickup: "bg-indigo-100 text-indigo-700",
  picked_up:         "bg-indigo-100 text-indigo-700",
  on_the_way:        "bg-indigo-100 text-indigo-700",
  delivered:         "bg-green-100 text-green-700",
  cancelled:         "bg-red-100 text-red-700",
};

const PAYMENT_COLORS = {
  paid:   "bg-green-50 text-green-700",
  unpaid: "bg-red-50 text-red-600",
};

const ORDER_FLOW = [
  "pending", "accepted", "preparing",
  "searching_rider", "rider_assigned",
  "arrived_at_pickup", "picked_up",
  "on_the_way", "delivered",
];

function OrderTimeline({ status }) {
  const current = ORDER_FLOW.indexOf(status);
  return (
    <div className="flex items-center gap-0 mt-3 overflow-x-auto pb-1">
      {ORDER_FLOW.map((step, i) => (
        <div key={step} className="flex items-center gap-0 flex-shrink-0">
          <div className="flex flex-col items-center">
            <div className={`w-2.5 h-2.5 rounded-full border-2 ${
              i < current
                ? "bg-green-500 border-green-500"
                : i === current
                ? "bg-blue-500 border-blue-500"
                : "bg-white border-gray-300"
            }`} />
            <span className={`text-[9px] mt-0.5 whitespace-nowrap ${
              i <= current ? "text-blue-600 font-medium" : "text-gray-400"
            }`}>
              {step.replace(/_/g, " ")}
            </span>
          </div>
          {i < ORDER_FLOW.length - 1 && (
            <div className={`w-6 h-px mb-3 flex-shrink-0 ${
              i < current ? "bg-green-400" : "bg-gray-200"
            }`} />
          )}
        </div>
      ))}
    </div>
  );
}

export default function Orders() {
  const [orders, setOrders]                   = useState([]);
  const [riders, setRiders]                   = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [expanded, setExpanded]               = useState(null);
  const [actionId, setActionId]               = useState(null);
  const [assigningOrder, setAssigningOrder]   = useState(null);
  const [selectedRider, setSelectedRider]     = useState("");
  const [statusFilter, setStatusFilter]       = useState("all");
  const [paymentFilter, setPaymentFilter]     = useState("all");
  const [typeFilter, setTypeFilter]           = useState("all");
  const [search, setSearch]                   = useState("");
  const socketRef = useRef(null);

  useEffect(() => {
    socketRef.current = io(import.meta.env.VITE_API_URL);
    socketRef.current.on("order_status_update", (payload) => {
      if (!payload) return;
      const orderId = payload.orderId || payload._id;
      const status  = payload.status;
      if (!orderId || !status) return;
      setOrders(prev => prev.map(o =>
        o._id === orderId ? { ...o, status } : o
      ));
    });
    return () => socketRef.current?.disconnect();
  }, []);

  const loadOrders = async () => {
    try {
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
      const res = await api.get("/admin/riders");
      setRiders(res.data || []);
    } catch {}
  };

  useEffect(() => {
    loadOrders();
    loadRiders();
    const interval = setInterval(loadOrders, 10000);
    return () => clearInterval(interval);
  }, []);

  const cancel = async id => {
    if (!confirm("Cancel this order?")) return;
    setActionId(id);
    try {
      await api.patch(`/admin/orders/${id}/cancel`);
      await loadOrders();
    } finally { setActionId(null); }
  };

  const forceComplete = async id => {
    if (!confirm("Force complete this order?")) return;
    setActionId(id);
    try {
      await api.patch(`/admin/orders/${id}/force-complete`);
      await loadOrders();
    } finally { setActionId(null); }
  };

  const assignRider = async orderId => {
    if (!selectedRider) return alert("Select a rider");
    try {
      await api.post(`/riders/assign/${orderId}`, { riderId: selectedRider });
      setAssigningOrder(null);
      setSelectedRider("");
      await loadOrders();
    } catch (err) {
      alert(err.response?.data?.message || "Failed to assign rider");
    }
  };

  const filtered = orders.filter(o => {
    if (statusFilter !== "all" && o.status !== statusFilter) return false;
    if (paymentFilter !== "all" && o.paymentStatus !== paymentFilter) return false;
    if (typeFilter !== "all" && o.type !== typeFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        o._id.toLowerCase().includes(q) ||
        o.user?.email?.toLowerCase().includes(q) ||
        o.user?.name?.toLowerCase().includes(q) ||
        o.vendor?.businessName?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const availableRiders = riders.filter(r => r.isAvailable && r.isActive !== false);

  const resetFilters = () => {
    setSearch(""); setStatusFilter("all");
    setPaymentFilter("all"); setTypeFilter("all");
  };

  const hasFilters = search || statusFilter !== "all" ||
    paymentFilter !== "all" || typeFilter !== "all";

  if (loading) return <div className="text-gray-500 p-6">Loading orders…</div>;

  return (
    <div className="space-y-6">

      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Orders</h1>
        <span className="text-sm text-gray-400">
          {filtered.length} of {orders.length} orders
        </span>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-wrap gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search ID, customer, vendor…"
          className="px-3 py-2 border rounded text-sm w-60 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded text-sm">
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="accepted">Accepted</option>
          <option value="preparing">Preparing</option>
          <option value="searching_rider">Searching Rider</option>
          <option value="rider_assigned">Rider Assigned</option>
          <option value="arrived_at_pickup">Arrived at Pickup</option>
          <option value="picked_up">Picked Up</option>
          <option value="on_the_way">On The Way</option>
          <option value="delivered">Delivered</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select value={paymentFilter} onChange={e => setPaymentFilter(e.target.value)}
          className="px-3 py-2 border rounded text-sm">
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
        </select>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 border rounded text-sm">
          <option value="all">All Types</option>
          <option value="food">Food</option>
          <option value="package">Package</option>
        </select>
        {hasFilters && (
          <button onClick={resetFilters}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition">
            Reset
          </button>
        )}
      </div>

      {/* ORDERS */}
      <div className="space-y-4">
        {filtered.map(o => {
          const ageMinutes = Math.floor((Date.now() - new Date(o.createdAt)) / 60000);
          const isLate = ageMinutes > 40 &&
            !["delivered", "cancelled"].includes(o.status);
          const isExpanded  = expanded === o._id;
          const isAssigning = assigningOrder === o._id;
          const locked      = ["delivered", "cancelled"].includes(o.status);
          const statusLabel = (o.status || "unknown").replace(/_/g, " ");

          return (
            <div key={o._id}
              className={`bg-white rounded-xl shadow-sm border overflow-hidden ${
                isLate ? "border-l-4 border-l-red-400" : ""
              }`}>

              {/* ── MAIN ROW ── */}
              <div className="p-5">
                <div className="flex justify-between items-start gap-4">

                  {/* Left */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-base">
                        #{o._id.slice(-6).toUpperCase()}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        STATUS_COLORS[o.status] || "bg-gray-100 text-gray-600"
                      }`}>
                        {statusLabel}
                      </span>
                      <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                        PAYMENT_COLORS[o.paymentStatus] || "bg-gray-100 text-gray-500"
                      }`}>
                        {o.paymentStatus || "—"}
                      </span>
                      {o.type === "package" && (
                        <span className="px-2 py-0.5 rounded text-xs bg-purple-50 text-purple-700">
                          📦 Package
                        </span>
                      )}
                      {isLate && (
                        <span className="px-2 py-0.5 rounded text-xs bg-red-100 text-red-600 font-medium">
                          ⚠ SLA Breach
                        </span>
                      )}
                    </div>

                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600">
                      <span>👤 {o.user?.name || "—"} · {o.user?.email || "—"}</span>
                      {o.vendor && <span>🍽️ {o.vendor.businessName}</span>}
                      {o.rider && (
                        <span>🛵 {o.rider.user?.name || "Rider"} · {o.rider.vehicleType || "—"}</span>
                      )}
                    </div>

                    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">
                      <span>{fmt(o.total)}</span>
                      <span>{ageLabel(o.createdAt)}</span>
                      {o.deliveryAddress && (
                        <span>📍 {fmtAddress(o.deliveryAddress)}</span>
                      )}
                    </div>
                  </div>

                  {/* Right: actions */}
                  <div className="flex gap-2 flex-wrap justify-end flex-shrink-0">
                    {!o.rider && !locked && (
                      <button
                        onClick={() => {
                          setAssigningOrder(isAssigning ? null : o._id);
                          setSelectedRider("");
                        }}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                      >
                        Assign Rider
                      </button>
                    )}
                    <button
                      onClick={() => setExpanded(isExpanded ? null : o._id)}
                      className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium transition"
                    >
                      {isExpanded ? "Hide" : "Details"}
                    </button>
                    {!locked && (
                      <>
                        {o.status === "pending" && (
                          <button
                            disabled={actionId === o._id}
                            onClick={() => cancel(o._id)}
                            className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition"
                          >
                            Cancel
                          </button>
                        )}
                        <button
                          disabled={actionId === o._id}
                          onClick={() => forceComplete(o._id)}
                          className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition"
                        >
                          Force Complete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Timeline */}
                {!locked && o.status && <OrderTimeline status={o.status} />}
              </div>

              {/* ── ASSIGN RIDER PANEL ── */}
              {isAssigning && (
                <div className="px-5 pb-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex gap-2 items-center flex-wrap">
                    <select
                      value={selectedRider}
                      onChange={e => setSelectedRider(e.target.value)}
                      className="px-3 py-2 border rounded text-sm flex-1 min-w-48 bg-white"
                    >
                      <option value="">Select available rider…</option>
                      {availableRiders.map(r => (
                        <option key={r._id} value={r._id}>
                          {r.user?.name || "Unnamed"} · ⭐{r.rating || 0} · {r.vehicleType || "—"}
                        </option>
                      ))}
                    </select>
                    {availableRiders.length === 0 && (
                      <span className="text-xs text-red-500">No available riders right now</span>
                    )}
                    <button
                      onClick={() => assignRider(o._id)}
                      disabled={!selectedRider}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-green-700 transition"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setAssigningOrder(null)}
                      className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-lg text-sm transition"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* ── EXPANDED DETAILS ── */}
              {isExpanded && (
                <div className="border-t bg-gray-50 px-5 py-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 text-sm text-gray-700">

                    {/* Customer */}
                    <div className="space-y-1.5">
                      <div className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-2">
                        Customer
                      </div>
                      <div><span className="font-medium">Name:</span> {o.user?.name || "—"}</div>
                      <div><span className="font-medium">Email:</span> {o.user?.email || "—"}</div>
                      <div><span className="font-medium">Phone:</span> {o.user?.phone || "—"}</div>
                      <div><span className="font-medium">Address:</span> {fmtAddress(o.deliveryAddress)}</div>
                    </div>

                    {/* Order financials */}
                    <div className="space-y-1.5">
                      <div className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-2">
                        Order
                      </div>
                      <div><span className="font-medium">Type:</span> {o.type || "food"}</div>
                      <div><span className="font-medium">Subtotal:</span> {fmt(o.subtotal)}</div>
                      <div><span className="font-medium">Delivery Fee:</span> {fmt(o.deliveryFee)}</div>
                      <div><span className="font-medium">Service Fee:</span> {fmt(o.serviceFee?.total)}</div>
                      <div><span className="font-medium">Total:</span> {fmt(o.total)}</div>
                      <div>
                        <span className="font-medium">Payment:</span>{" "}
                        {o.paymentStatus}{o.paymentMethod ? ` · ${o.paymentMethod}` : ""}
                      </div>
                    </div>

                    {/* Vendor */}
                    {o.vendor && (
                      <div className="space-y-1.5">
                        <div className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-2">
                          Vendor
                        </div>
                        <div><span className="font-medium">Name:</span> {o.vendor.businessName}</div>
                        <div><span className="font-medium">Phone:</span> {o.vendor.phone || "—"}</div>
                        <div>
                          <span className="font-medium">Pickup:</span>{" "}
                          {o.pickupLocation?.address || fmtAddress(o.vendor.address) || "—"}
                        </div>
                      </div>
                    )}

                    {/* Rider */}
                    {o.rider && (
                      <div className="space-y-1.5">
                        <div className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-2">
                          Rider
                        </div>
                        <div><span className="font-medium">Name:</span> {o.rider.user?.name || "—"}</div>
                        <div><span className="font-medium">Phone:</span> {o.rider.user?.phone || "—"}</div>
                        <div>
                          <span className="font-medium">Vehicle:</span>{" "}
                          {o.rider.vehicleType || "—"} · {o.rider.vehiclePlate || "—"}
                        </div>
                        <div><span className="font-medium">Payout:</span> {fmt(o.riderPayout)}</div>
                      </div>
                    )}

                    {/* Timeline */}
                    <div className="space-y-1.5">
                      <div className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-2">
                        Timeline
                      </div>
                      <div><span className="font-medium">Created:</span> {fmtDate(o.createdAt)}</div>
                      {o.paidAt && (
                        <div><span className="font-medium">Paid:</span> {fmtDate(o.paidAt)}</div>
                      )}
                      {o.deliveredAt && (
                        <div><span className="font-medium">Delivered:</span> {fmtDate(o.deliveredAt)}</div>
                      )}
                      {o.cancelledAt && (
                        <div><span className="font-medium">Cancelled:</span> {fmtDate(o.cancelledAt)}</div>
                      )}
                    </div>

                    {/* Items */}
                    {o.items?.length > 0 && (
                      <div className="md:col-span-2 space-y-1.5">
                        <div className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-2">
                          Items
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {o.items.map((item, i) => (
                            <span key={i}
                              className="text-xs bg-white border rounded-lg px-3 py-1.5">
                              {item.name} × {item.quantity} — {fmt(item.price * item.quantity)}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Package details */}
                    {o.type === "package" && o.packageDetails && (
                      <div className="md:col-span-2 space-y-1.5">
                        <div className="font-semibold text-gray-500 text-xs uppercase tracking-wide mb-2">
                          Package Details
                        </div>
                        <div className="bg-white border rounded-lg p-3 text-xs font-mono text-gray-600 whitespace-pre-wrap">
                          {typeof o.packageDetails === "string"
                            ? o.packageDetails
                            : JSON.stringify(o.packageDetails, null, 2)}
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              )}

            </div>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div className="text-center text-gray-400 py-16">
          No orders match the selected filters
        </div>
      )}
    </div>
  );
}