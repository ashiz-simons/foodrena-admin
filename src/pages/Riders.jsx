import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../lib/api";

function statusBadge(rider) {
  if (rider.isActive === false) return "bg-red-100 text-red-700";
  if (rider.isAvailable) return "bg-green-100 text-green-700";
  return "bg-gray-100 text-gray-700";
}

export default function Riders() {
  const navigate = useNavigate();
  const [riders, setRiders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [actionId, setActionId] = useState(null);

  const loadRiders = async () => {
    try {
      const res = await api.get("/admin/riders");
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
    try {
      await api.patch(`/admin/riders/${id}/suspend`);
      await loadRiders();
    } finally {
      setActionId(null);
    }
  };

  const activateRider = async (id) => {
    if (!confirm("Reactivate this rider?")) return;
    setActionId(id);
    try {
      await api.patch(`/admin/riders/${id}/activate`);
      await loadRiders();
    } finally {
      setActionId(null);
    }
  };

  const filteredRiders = riders.filter(r => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      r.user?.name?.toLowerCase().includes(q) ||
      r.user?.email?.toLowerCase().includes(q) ||
      r.vehiclePlate?.toLowerCase().includes(q)
    );
  });

  if (loading) return <div className="text-gray-500 p-6">Loading riders…</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Riders</h1>
        <span className="text-sm text-gray-400">{filteredRiders.length} rider{filteredRiders.length !== 1 ? "s" : ""}</span>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border flex gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search name, email, plate…"
          className="px-3 py-2 border rounded text-sm w-72 focus:outline-none focus:ring-2 focus:ring-blue-200"
        />
        {search && (
          <button onClick={() => setSearch("")}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition">
            Clear
          </button>
        )}
      </div>

      {filteredRiders.map(r => (
        <div key={r._id} className="bg-white p-5 rounded-xl shadow-sm border hover:shadow transition">
          <div className="flex justify-between items-center gap-4">

            {/* Avatar + info */}
            <div className="flex items-center gap-4 min-w-0">
              <div className="flex-shrink-0">
                {r.profileImage?.url ? (
                  <img src={r.profileImage.url} alt={r.user?.name}
                    className="w-12 h-12 rounded-full object-cover border" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center
                    justify-center text-xl border">🛵</div>
                )}
              </div>
              <div className="min-w-0">
                <div className="font-bold text-base truncate">
                  {r.user?.name || "Unnamed Rider"}
                </div>
                <div className="text-sm text-gray-500 truncate">
                  {r.user?.email || "No email"}
                </div>
                <div className="mt-1.5 flex gap-2 flex-wrap items-center">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${statusBadge(r)}`}>
                    {!r.isActive ? "Suspended" : r.isAvailable ? "Available" : "Offline"}
                  </span>
                  <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded">
                    ⭐ {r.rating || 0}
                  </span>
                  <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded">
                    {r.totalDeliveries || 0} deliveries
                  </span>
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                    {r.vehicleType?.toUpperCase() || "—"}
                    {r.vehiclePlate ? ` · ${r.vehiclePlate}` : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={() => navigate(`/riders/${r._id}`)}
                className="px-4 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
              >
                View
              </button>

              {!r.isActive ? (
                <button
                  disabled={actionId === r._id}
                  onClick={() => activateRider(r._id)}
                  className="px-4 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-green-700 transition"
                >
                  Reactivate
                </button>
              ) : (
                <button
                  disabled={actionId === r._id}
                  onClick={() => suspendRider(r._id)}
                  className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium disabled:opacity-50 hover:bg-red-700 transition"
                >
                  Suspend
                </button>
              )}
            </div>

          </div>
        </div>
      ))}

      {filteredRiders.length === 0 && (
        <div className="text-center text-gray-400 py-16">No riders found</div>
      )}
    </div>
  );
}