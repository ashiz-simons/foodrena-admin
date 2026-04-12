import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../lib/api";

const fmt    = n => `₦${Number(n || 0).toLocaleString()}`;
const fmtDate = d => d ? new Date(d).toLocaleString("en-NG", {
  day: "numeric", month: "short", year: "numeric",
  hour: "2-digit", minute: "2-digit",
}) : "—";

const orderStatusColor = s => {
  if (s === "delivered")  return "text-green-600 bg-green-50";
  if (s === "cancelled")  return "text-red-500 bg-red-50";
  if (s === "pending")    return "text-yellow-600 bg-yellow-50";
  return "text-gray-500 bg-gray-50";
};

const wStatusColor = s => {
  if (s === "paid")   return "text-green-600 bg-green-50";
  if (s === "failed") return "text-red-500 bg-red-50";
  return "text-yellow-600 bg-yellow-50";
};

const vendorStatusColor = s => {
  if (s === "verified")  return "bg-green-100 text-green-700";
  if (s === "suspended") return "bg-red-100 text-red-700";
  return "bg-orange-100 text-orange-700";
};

export default function VendorDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("orders");
  const [actionLoading, setActionLoading] = useState(false);

  const load = () => {
    setLoading(true);
    api.get(`/admin/vendors/${id}`)
      .then(res => setData(res.data))
      .catch(() => setError("Failed to load vendor details"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [id]);

  const doAction = async (endpoint, method = "patch") => {
    if (!confirm(`Are you sure?`)) return;
    setActionLoading(true);
    try {
      await api[method](`/admin/vendors/${id}/${endpoint}`);
      load();
    } catch {
      alert("Action failed");
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-500">
      Loading vendor details…
    </div>
  );

  if (error) return (
    <div className="p-6">
      <button onClick={() => navigate("/vendors")}
        className="text-blue-600 text-sm mb-4 hover:underline">
        ← Back to Vendors
      </button>
      <div className="text-red-500">{error}</div>
    </div>
  );

  const { vendor, wallet, orders, withdrawals, stats, earningsSummary } = data;
  const coords = vendor.kitchenLocation?.coordinates
    ?? vendor.location?.coordinates;
  const [lng, lat] = coords?.length === 2 ? coords : [null, null];
  const hasLocation = lat !== null && lng !== null;

  return (
    <div className="space-y-6 pb-12">

      {/* BACK */}
      <button onClick={() => navigate("/vendors")}
        className="flex items-center gap-1 text-blue-600 text-sm hover:underline">
        ← Back to Vendors
      </button>

      {/* PROFILE CARD */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex items-start gap-5">

          {/* Logo */}
          <div className="flex-shrink-0">
            {vendor.logo?.url ? (
              <img src={vendor.logo.url} alt={vendor.businessName}
                className="w-20 h-20 rounded-xl object-cover border-2 border-gray-200" />
            ) : (
              <div className="w-20 h-20 rounded-xl bg-gray-100 border-2 border-gray-200
                flex items-center justify-center text-3xl">🍽️</div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-bold">{vendor.businessName || "Unnamed Vendor"}</h1>
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${vendorStatusColor(vendor.status)}`}>
                {vendor.status}
              </span>
              {vendor.isOpen && (
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-600">
                  Open
                </span>
              )}
            </div>

            <div className="mt-1 text-sm text-gray-500 space-y-0.5">
              <div>{vendor.owner?.email || "—"}</div>
              <div>{vendor.phone || "—"}</div>
              {vendor.address?.street && (
                <div>
                  {[vendor.address.street, vendor.address.city, vendor.address.state]
                    .filter(Boolean).join(", ")}
                </div>
              )}
              <div className="text-xs text-gray-400">
                Joined {fmtDate(vendor.owner?.createdAt)}
              </div>
            </div>

            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded">
                ⭐ {vendor.rating || 0} ({vendor.ratingCount || 0} ratings)
              </span>
              <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded">
                {stats.menuItemCount} menu items
              </span>
              {vendor.zone && (
                <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  Zone: {vendor.zone}
                </span>
              )}
              <span className={`px-2 py-1 rounded ${vendor.onboardingCompleted
                ? "bg-green-50 text-green-700"
                : "bg-orange-50 text-orange-700"}`}>
                {vendor.onboardingCompleted ? "Onboarding complete" : "Onboarding incomplete"}
              </span>
            </div>
          </div>

          {/* Quick actions */}
          <div className="flex flex-col gap-2 flex-shrink-0">
            {vendor.status !== "verified" && (
              <button
                disabled={actionLoading}
                onClick={() => doAction("verify")}
                className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition"
              >
                Verify
              </button>
            )}
            {vendor.status === "verified" && (
              <button
                disabled={actionLoading}
                onClick={() => doAction("suspend")}
                className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition"
              >
                Suspend
              </button>
            )}
            {vendor.status === "suspended" && (
              <button
                disabled={actionLoading}
                onClick={() => doAction("reinstate")}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition"
              >
                Reinstate
              </button>
            )}
          </div>
        </div>

        {/* Bank */}
        {vendor.bank?.accountNumber && (
          <div className="mt-4 pt-4 border-t text-sm text-gray-600 flex gap-6 flex-wrap">
            <div><span className="font-medium">Bank:</span> {vendor.bank.bankName}</div>
            <div><span className="font-medium">Account:</span> {vendor.bank.accountNumber}</div>
            <div><span className="font-medium">Name:</span> {vendor.bank.accountName}</div>
          </div>
        )}
      </div>

      {/* STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Orders",      value: stats.totalOrders,            color: "text-blue-600" },
          { label: "Delivered Orders",  value: stats.deliveredOrders,        color: "text-green-600" },
          { label: "Total Revenue",     value: fmt(stats.totalRevenue),      color: "text-purple-600" },
          { label: "Available Balance", value: fmt(wallet.balance),          color: "text-green-600" },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border shadow-sm p-4">
            <div className="text-xs text-gray-500 mb-1">{c.label}</div>
            <div className={`text-xl font-bold ${c.color}`}>{c.value}</div>
          </div>
        ))}
      </div>

      {/* EARNINGS BREAKDOWN */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Gross Earnings",    value: fmt(earningsSummary.totalGross) },
          { label: "Net Earnings",      value: fmt(earningsSummary.totalNet) },
          { label: "Pending Release",   value: fmt(earningsSummary.totalPending) },
          { label: "Pending Withdrawal",value: fmt(wallet.pendingBalance) },
        ].map(c => (
          <div key={c.label} className="bg-white rounded-xl border shadow-sm p-4">
            <div className="text-xs text-gray-500 mb-1">{c.label}</div>
            <div className="text-xl font-bold text-gray-800">{c.value}</div>
          </div>
        ))}
      </div>

      {/* MAP */}
      <div className="bg-white rounded-xl shadow-sm border p-5">
        <h2 className="font-semibold mb-3">Kitchen Location</h2>
        {hasLocation ? (
          <div className="space-y-2">
            {vendor.kitchenAddress && (
              <div className="text-sm text-gray-600">📍 {vendor.kitchenAddress}</div>
            )}
            <div className="text-xs text-gray-400">
              {lat.toFixed(5)}, {lng.toFixed(5)}
            </div>
            <img
              src={`https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/pin-s+ff0000(${lng},${lat})/${lng},${lat},15,0/800x320?access_token=${import.meta.env.VITE_MAPBOX_TOKEN}`}
              alt="Vendor kitchen location"
              className="rounded-lg border w-full"
              style={{ height: 300, objectFit: "cover" }}
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
            No location data available for this vendor
          </div>
        )}
      </div>

      {/* TABS */}
      <div className="bg-white rounded-xl shadow-sm border">
        <div className="flex border-b">
          {[
            { key: "orders",      label: `Orders (${orders.length})` },
            { key: "withdrawals", label: `Withdrawals (${withdrawals.length})` },
            { key: "menu",        label: `Menu (${stats.menuItemCount})` },
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

          {/* ORDERS TAB */}
          {tab === "orders" && (
            orders.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No orders yet</div>
            ) : (
              <div className="space-y-3">
                {orders.map(o => (
                  <div key={o._id}
                    className="flex items-center justify-between text-sm border-b pb-3 last:border-0 gap-3">
                    <div className="font-mono text-gray-400 text-xs">
                      #{o._id.slice(-6).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">
                        {o.user?.name || "Customer"}
                      </div>
                      <div className="text-xs text-gray-400">{fmtDate(o.createdAt)}</div>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-xs font-medium ${orderStatusColor(o.status)}`}>
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

          {/* WITHDRAWALS TAB */}
          {tab === "withdrawals" && (
            withdrawals.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No withdrawals yet</div>
            ) : (
              <div className="space-y-3">
                {withdrawals.map(w => (
                  <div key={w._id}
                    className="flex items-center justify-between text-sm border-b pb-3 last:border-0 gap-3">
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

          {/* MENU TAB */}
          {tab === "menu" && (
            vendor.menuItems?.length === 0 ? (
              <div className="text-center text-gray-400 py-8">No menu items</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vendor.menuItems?.map(item => (
                  <div key={item._id}
                    className="flex items-center gap-3 border rounded-lg p-3">
                    {item.image?.url ? (
                      <img src={item.image.url} alt={item.name}
                        className="w-12 h-12 rounded-lg object-cover border flex-shrink-0" />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center
                        justify-center text-xl flex-shrink-0">🍴</div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm truncate">{item.name}</div>
                      <div className="text-xs text-gray-400">{item.category}</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="font-semibold text-sm">{fmt(item.price)}</div>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        item.available
                          ? "bg-green-50 text-green-600"
                          : "bg-red-50 text-red-500"
                      }`}>
                        {item.available ? "Available" : "Unavailable"}
                      </span>
                    </div>
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