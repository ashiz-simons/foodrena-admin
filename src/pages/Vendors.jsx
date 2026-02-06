import { useEffect, useState } from "react";
import api from "../lib/api";

/* =========================
   STATUS BADGE
========================= */
function statusBadge(status) {
  const map = {
    pending: "bg-orange-100 text-orange-700",
    verified: "bg-green-100 text-green-700",
    suspended: "bg-red-100 text-red-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

/* =========================
   PAGE
========================= */
export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [expanded, setExpanded] = useState(null);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const fetchVendors = async () => {
    try {
      const res = await api.get("/admin/vendors");
      setVendors(res.data || []);
    } catch (err) {
      console.error("Failed to load vendors", err);
    } finally {
      setLoading(false);
    }
  };

  const verifyVendor = async (id) => {
    setActionId(id);
    await api.patch(`/admin/vendors/${id}/verify`);
    await fetchVendors();
    setActionId(null);
  };

  const suspendVendor = async (id) => {
    setActionId(id);
    await api.patch(`/admin/vendors/${id}/suspend`);
    await fetchVendors();
    setActionId(null);
  };

  const reinstateVendor = async (id) => {
    setActionId(id);
    await api.post(`/admin/vendors/${id}/reinstate`);
    await fetchVendors();
    setActionId(null);
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  /* =========================
     FILTERING
  ========================= */
  const filtered = vendors.filter(v => {
    if (statusFilter !== "all" && v.status !== statusFilter) return false;

    if (search) {
      const q = search.toLowerCase();
      const match =
        v.businessName?.toLowerCase().includes(q) ||
        v.owner?.email?.toLowerCase().includes(q);

      if (!match) return false;
    }

    return true;
  });

  if (loading) {
    return <div className="text-gray-500">Loading vendors…</div>;
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Vendors</h1>

      {/* =========================
          FILTER BAR
      ========================= */}
      <div className="bg-white p-4 rounded shadow flex flex-wrap gap-3 sticky top-2 z-10">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search vendor or owner..."
          className="px-3 py-2 border rounded text-sm w-64"
        />

        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="verified">Verified</option>
          <option value="suspended">Suspended</option>
        </select>

        {(search || statusFilter !== "all") && (
          <button
            onClick={() => {
              setSearch("");
              setStatusFilter("all");
            }}
            className="px-4 py-2 bg-gray-200 rounded text-sm"
          >
            Reset
          </button>
        )}
      </div>

      {/* =========================
          VENDOR TABLE
      ========================= */}
      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-4">Business</th>
              <th className="p-4">Owner</th>
              <th className="p-4">Status</th>
              <th className="p-4">Performance</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filtered.map(v => (
              <>
                <tr key={v._id} className="border-t hover:bg-gray-50">
                  <td className="p-4 font-medium">{v.businessName}</td>

                  <td className="p-4 text-sm text-gray-600">
                    {v.owner?.email}
                  </td>

                  <td className="p-4">
                    {statusBadge(v.status)}
                  </td>

                  <td className="p-4 text-xs text-gray-500">
                    Orders: {v.totalOrders || 0} • Earnings: ₦{(v.totalEarnings || 0).toLocaleString()}
                  </td>

                  <td className="p-4 flex gap-2">
                    <button
                      onClick={() => setExpanded(expanded === v._id ? null : v._id)}
                      className="px-3 py-1 bg-gray-200 rounded text-xs"
                    >
                      View
                    </button>

                    {v.status !== "verified" && (
                      <button
                        disabled={actionId === v._id}
                        onClick={() => verifyVendor(v._id)}
                        className="px-3 py-1 bg-green-600 text-white rounded text-xs hover:bg-green-700 disabled:opacity-50"
                      >
                        Verify
                      </button>
                    )}

                    {v.status === "verified" && (
                      <button
                        disabled={actionId === v._id}
                        onClick={() => suspendVendor(v._id)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-xs hover:bg-red-700 disabled:opacity-50"
                      >
                        Suspend
                      </button>
                    )}

                    {v.status === "suspended" && (
                      <button
                        disabled={actionId === v._id}
                        onClick={() => reinstateVendor(v._id)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-700 disabled:opacity-50"
                      >
                        Reinstate
                      </button>
                    )}
                  </td>
                </tr>

                {/* =========================
                    EXPANDED VIEW
                ========================= */}
                {expanded === v._id && (
                  <tr className="bg-gray-50 border-t">
                    <td colSpan="5" className="p-4 text-sm text-gray-700 space-y-2">
                      <div><strong>Phone:</strong> {v.phone || "N/A"}</div>
                      <div><strong>Address:</strong> {v.address || "N/A"}</div>
                      <div><strong>Joined:</strong> {new Date(v.createdAt).toLocaleDateString()}</div>
                      <div><strong>Status Note:</strong> {v.statusReason || "—"}</div>
                    </td>
                  </tr>
                )}
              </>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="p-6 text-center text-gray-400">
                  No vendors found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
