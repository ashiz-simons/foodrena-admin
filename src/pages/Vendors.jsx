import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom"; // ← add
import api from "../lib/api";

function statusBadge(status) {
  const map = {
    pending:   "bg-orange-100 text-orange-700",
    verified:  "bg-green-100 text-green-700",
    suspended: "bg-red-100 text-red-700",
  };
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

export default function Vendors() {
  const navigate = useNavigate(); // ← add
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
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
    try {
      await api.patch(`/admin/vendors/${id}/verify`);
      await fetchVendors();
    } finally { setActionId(null); }
  };

  const suspendVendor = async (id) => {
    setActionId(id);
    try {
      await api.patch(`/admin/vendors/${id}/suspend`);
      await fetchVendors();
    } finally { setActionId(null); }
  };

  const reinstateVendor = async (id) => {
    setActionId(id);
    try {
      await api.patch(`/admin/vendors/${id}/reinstate`);
      await fetchVendors();
    } finally { setActionId(null); }
  };

  useEffect(() => { fetchVendors(); }, []);

  const filtered = vendors.filter(v => {
    if (statusFilter !== "all" && v.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        v.businessName?.toLowerCase().includes(q) ||
        v.owner?.email?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  if (loading) return <div className="text-gray-500">Loading vendors…</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <span className="text-sm text-gray-400">{filtered.length} vendor{filtered.length !== 1 ? "s" : ""}</span>
      </div>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded-xl shadow-sm border flex flex-wrap gap-3">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search vendor or owner..."
          className="px-3 py-2 border rounded text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-200"
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
            onClick={() => { setSearch(""); setStatusFilter("all"); }}
            className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded text-sm transition"
          >
            Reset
          </button>
        )}
      </div>

      {/* TABLE */}
      <div className="bg-white rounded-xl shadow-sm border overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left border-b">
            <tr>
              <th className="p-4 font-medium text-gray-600">Business</th>
              <th className="p-4 font-medium text-gray-600">Owner</th>
              <th className="p-4 font-medium text-gray-600">Status</th>
              <th className="p-4 font-medium text-gray-600">Performance</th>
              <th className="p-4 font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(v => (
              <tr key={v._id} className="border-t hover:bg-gray-50 transition">
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    {v.logo?.url ? (
                      <img src={v.logo.url} alt={v.businessName}
                        className="w-9 h-9 rounded-lg object-cover border" />
                    ) : (
                      <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center
                        justify-center text-lg border">🍽️</div>
                    )}
                    <span className="font-medium">{v.businessName}</span>
                  </div>
                </td>

                <td className="p-4 text-gray-600">{v.owner?.email || "—"}</td>

                <td className="p-4">{statusBadge(v.status)}</td>

                <td className="p-4 text-xs text-gray-500">
                  <div>{v.totalOrders || 0} orders</div>
                  <div>₦{(v.totalEarnings || 0).toLocaleString()} revenue</div>
                </td>

                <td className="p-4">
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => navigate(`/vendors/${v._id}`)}
                      className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 transition"
                    >
                      View
                    </button>

                    {v.status !== "verified" && (
                      <button
                        disabled={actionId === v._id}
                        onClick={() => verifyVendor(v._id)}
                        className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-medium hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        Verify
                      </button>
                    )}
                    {v.status === "verified" && (
                      <button
                        disabled={actionId === v._id}
                        onClick={() => suspendVendor(v._id)}
                        className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium hover:bg-red-700 disabled:opacity-50 transition"
                      >
                        Suspend
                      </button>
                    )}
                    {v.status === "suspended" && (
                      <button
                        disabled={actionId === v._id}
                        onClick={() => reinstateVendor(v._id)}
                        className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 disabled:opacity-50 transition"
                      >
                        Reinstate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan="5" className="p-8 text-center text-gray-400">
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