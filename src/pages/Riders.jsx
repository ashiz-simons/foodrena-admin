import { useEffect, useState } from "react";
import api from "../lib/api";

function statusBadge(rider) {
  if (rider.isActive === false) return "bg-red-100 text-red-700";
  if (rider.isAvailable) return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
}

export default function Riders() {
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState(null);

  const loadRiders = async () => {
    try {
      const res = await api.get("/admin/riders"); // ← fixed: was /riders
      setRiders(res.data || []);
    } catch (err) {
      console.error("Failed to load riders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadRiders(); }, []);

  const suspendRider = async (id) => {
    if (!confirm("Suspend this rider?")) return;
    setActionId(id);
    await api.patch(`/admin/riders/${id}/suspend`); // ← fixed: admin route
    await loadRiders();
    setActionId(null);
  };

  const activateRider = async (id) => {
    if (!confirm("Reactivate this rider?")) return;
    setActionId(id);
    await api.patch(`/admin/riders/${id}/activate`); // ← fixed: admin route
    await loadRiders();
    setActionId(null);
  };

  const filteredRiders = riders.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.user?.name?.toLowerCase().includes(q) ||
      r.phone?.includes(q) ||
      r.vehiclePlate?.toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="text-gray-500">Loading riders…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Riders</h1>

      {/* SEARCH BAR */}
      <div className="bg-white p-4 rounded shadow flex gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search rider name, phone, plate..."
          className="px-3 py-2 border rounded text-sm w-64"
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            className="px-4 py-2 bg-gray-200 rounded text-sm"
          >
            Reset
          </button>
        )}
      </div>

      {/* RIDERS LIST */}
      {filteredRiders.map(r => (
        <div key={r._id} className="bg-white p-4 rounded shadow space-y-3">
          <div className="flex justify-between items-center">
            <div>
              <div className="font-bold text-lg">
                {r.user?.name || "Unnamed Rider"}
              </div>
              <div className="text-sm text-gray-500">{r.phone || "No phone"}</div>
              <div className="mt-2 flex gap-2 flex-wrap items-center">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusBadge(r)}`}>
                  {!r.isActive ? "Suspended" : r.isAvailable ? "Available" : "Offline"}
                </span>
                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                  ⭐ {r.rating || 5}
                </span>
                <span className="text-xs bg-purple-50 text-purple-700 px-2 py-1 rounded">
                  Deliveries: {r.totalDeliveries || 0}
                </span>
                <span className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                  {r.vehicleType?.toUpperCase()}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setExpanded(expanded === r._id ? null : r._id)}
                className="px-3 py-1 bg-gray-200 rounded text-xs"
              >
                {expanded === r._id ? "Hide" : "View"}
              </button>

              {!r.isActive ? (
                <button
                  disabled={actionId === r._id}
                  onClick={() => activateRider(r._id)}
                  className="px-3 py-1 bg-green-600 text-white rounded text-xs disabled:opacity-50"
                >
                  Reactivate
                </button>
              ) : (
                <button
                  disabled={actionId === r._id}
                  onClick={() => suspendRider(r._id)}
                  className="px-3 py-1 bg-red-600 text-white rounded text-xs disabled:opacity-50"
                >
                  Suspend
                </button>
              )}
            </div>
          </div>

          {/* EXPANDED DETAILS */}
          {expanded === r._id && (
            <div className="border-t pt-3 text-sm space-y-2 text-gray-700">
              <div><strong>Vehicle:</strong> {r.vehicleType?.toUpperCase()}</div>
              <div><strong>Plate:</strong> {r.vehiclePlate || "—"}</div>
              <div><strong>Bank:</strong> {r.bank?.bankName || "—"}</div>
              <div><strong>Account:</strong> {r.bank?.accountNumber || "—"} {r.bank?.accountName ? `(${r.bank.accountName})` : ""}</div>
              <div>
                <strong>Last Active:</strong>{" "}
                {r.lastActiveAt ? new Date(r.lastActiveAt).toLocaleString() : "Never"}
              </div>
              {r.currentLocation?.lat && (
                <div className="text-xs text-blue-600">
                  📍 {r.currentLocation.lat}, {r.currentLocation.lng}
                </div>
              )}
              <div className="text-xs text-gray-500">Rider ID: {r._id}</div>
            </div>
          )}
        </div>
      ))}

      {filteredRiders.length === 0 && (
        <div className="text-center text-gray-400 py-10">No riders found</div>
      )}
    </div>
  );
}