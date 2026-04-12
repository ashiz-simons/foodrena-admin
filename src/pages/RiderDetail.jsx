import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";

const fmt = n => `₦${Number(n || 0).toLocaleString()}`;
const fmtDate = d => d ? new Date(d).toLocaleString("en-NG", {
  day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit",
}) : "—";

const statusColor = s => {
  if (s === "delivered")  return "text-green-600 bg-green-50";
  if (s === "cancelled")  return "text-red-500 bg-red-50";
  if (s === "on_the_way") return "text-blue-600 bg-blue-50";
  return "text-gray-500 bg-gray-50";
};

const wStatusColor = s => {
  if (s === "paid")   return "text-green-600 bg-green-50";
  if (s === "failed") return "text-red-500 bg-red-50";
  return "text-yellow-600 bg-yellow-50";
};

export default function RiderDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("orders");

  useEffect(() => {
    api.get(`/admin/riders/${id}`)
      .then(res => setData(res.data))
      .catch(() => setError("Failed to load rider details"))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-500">
      Loading rider details…
    </div>
  );

  if (error) return (
    <div className="p-6">
      <button onClick={() => navigate("/riders")}
        className="text-blue-600 text-sm mb-4 hover:underline">
        ← Back to Riders
      </button>
      <div className="text-red-500">{error}</div>
    </div>
  );

  const { rider, wallet, orders, withdrawals } = data;
  const coords = rider.currentLocation?.coordinates;
  const [lng, lat] = coords?.length === 2 ? coords : [null, null];
  const hasLocation = lat !== null && lng !== null;

  return (
    <div className="space-y-6 pb-12">

      {/* BACK */}
      <button
        onClick={() => navigate("/riders")}
        className="flex items-center gap-1 text-blue-600 text-sm hover:underline"
      >
        ← Back to Riders
      </button>

      {/* PROFILE CARD */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-start gap-5">
          <div className="flex-shrink-0">
            {rider.profileImage?.url ? (
              <img
                src={rider.profileImage.url}
                alt={rider.user?.name}
                className="w-20 h-20 rounded-full object-cover border-2 border-gray-200"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-100 border-2 border-gray-200
                flex items-center justify-center text-3xl text-gray-400">
                🛵
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold">{rider.user?.name || "Unnamed Rider"}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                !rider.isActive
                  ? "bg-red-100 text-red-700"
                  : rider.isAvailable
                  ? "bg-green-100 text-green-700"
                  : "bg-gray-100 text-gray-600"
              }`}>
                {!rider.isActive ? "Suspended" : rider.isAvailable ? "Online" : "Offline"}
              </span>
            </div>

            <div className="mt-1 text-sm text-gray-500 space-y-0.5">
              <div>{rider.user?.email || "—"}</div>
              <div>{rider.user?.phone || "—"}</div>
              <div className="text-xs text-gray-400">
                Joined {fmtDate(rider.user?.createdAt)}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                ⭐ {rider.rating || 0} ({rider.ratingCount || 0} ratings)
              </span>
              <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">
                {rider.totalDeliveries || 0} deliveries
              </span>
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                {rider.vehicleType?.toUpperCase() || "—"} · {rider.vehiclePlate || "No plate"}
              </span>
              <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                Last active: {fmtDate(rider.lastActiveAt)}
              </span>
            </div>
          </div>
        </div>

        {rider.bank?.accountNumber && (
          <div className="mt-4 pt-4 border-t text-sm text-gray-600 flex gap-6 flex-wrap">
            <div><span className="font-medium">Bank:</span> {rider.bank.bankName}</div>
            <div><span className="font-medium">Account:</span> {rider.bank.accountNumber}</div>
            <div><span className="font-medium">Name:</span> {rider.bank.accountName}</div>
          </div>
        )}
      </div>

      {/* WALLET CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Available Balance", value: fmt(wallet.balance),       color: "text-green-600" },
          { label: "Pending Balance",   value: fmt(wallet.pendingBalance), color: "text-yellow-600" },
          { label: "Total Earned",      value: fmt(wallet.totalEarned),    color: "text-blue-600" },
          { label: "Total Deliveries",  value: rider.totalDeliveries || 0, color: "text-purple-600" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border shadow-sm p-4">
            <div className="text-xs text-gray-500 mb-1">{c.label}</div>
            <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* MAP */}
        <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="font-semibold mb-3">Last Known Location</h2>
        {hasLocation ? (
            <div className="space-y-2">
            <div className="text-sm text-gray-500">
                📍 {lat.toFixed(5)}, {lng.toFixed(5)}
            </div>
            <iframe
                title="Rider location"
                width="100%"
                height="320"
                className="rounded-lg border"
                style={{ border: 0 }}
                loading="lazy"
                allowFullScreen
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=${import.meta.env.VITE_GOOGLE_MAPS_KEY}&q=${lat},${lng}&zoom=16&maptype=satellite`}
            />
            <div className="text-xs text-gray-400 text-right">
               <a
                href={`https://www.google.com/maps?q=${lat},${lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline"
                >
                Open in Google Maps ↗
                </a>
            </div>
            </div>
        ) : (
            <div className="text-sm text-gray-400 py-8 text-center">
            No location data available for this rider
            </div>
        )}
        </div>

      {/* TABS */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex border-b">
          {[
            { key: "orders",      label: `Orders (${orders.length})` },
            { key: "withdrawals", label: `Withdrawals (${withdrawals.length})` },
          ].map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`px-6 py-3 text-sm font-medium transition border-b-2 -mb-px ${
                tab === t.key
                  ? "border-blue-600 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">

          {tab === "orders" && (
            orders.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No orders yet</div>
            ) : (
              <div className="space-y-3">
                {orders.map(o => (
                  <div key={o._id}
                    className="flex items-center justify-between text-sm
                      border-b pb-3 last:border-0 gap-3">
                    <div className="font-mono text-gray-400 text-xs">
                      #{o._id.slice(-6).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {o.type === "package"
                          ? "📦 Package"
                          : o.vendor?.businessName || "—"}
                      </div>
                      <div className="text-xs text-gray-400">{fmtDate(o.createdAt)}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${statusColor(o.status)}`}>
                      {o.status.replace(/_/g, " ")}
                    </span>
                    <div className="font-semibold text-right whitespace-nowrap">
                      {fmt(o.total)}
                    </div>
                  </div>
                ))}
              </div>
            )
          )}

          {tab === "withdrawals" && (
            withdrawals.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No withdrawals yet</div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map(w => (
                  <div key={w._id}
                    className="flex items-center justify-between text-sm
                      border-b pb-3 last:border-0 gap-3">
                    <div className="flex-1">
                      <div className="font-semibold">{fmt(w.amount)}</div>
                      <div className="text-xs text-gray-400">{fmtDate(w.createdAt)}</div>
                      {w.failureReason && (
                        <div className="text-xs text-red-500 mt-0.5">{w.failureReason}</div>
                      )}
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${wStatusColor(w.status)}`}>
                      {w.status.toUpperCase()}
                    </span>
                    {w.paidAt && (
                      <div className="text-xs text-gray-400 whitespace-nowrap">
                        {fmtDate(w.paidAt)}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )
          )}

        </div>
      </div>

    </div>
  );
}