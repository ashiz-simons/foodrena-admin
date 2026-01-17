import { useEffect, useState } from "react";
import api from "../lib/api";

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

export default function Vendors() {
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const fetchVendors = async () => {
    try {
      const res = await api.get("/admin/vendors");
      setVendors(res.data);
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

  useEffect(() => {
    fetchVendors();
  }, []);

  if (loading) {
    return <div className="text-gray-500">Loading vendors…</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Vendors</h1>

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 text-left">
            <tr>
              <th className="p-4">Business</th>
              <th className="p-4">Owner</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          <tbody>
            {vendors.map(v => (
              <tr key={v._id} className="border-t hover:bg-gray-50">
                <td className="p-4 font-medium">{v.businessName}</td>

                <td className="p-4 text-sm text-gray-600">
                  {v.owner?.email}
                </td>

                <td className="p-4">
                  {statusBadge(v.status)}
                </td>

                <td className="p-4 flex gap-2">
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
                </td>
              </tr>
            ))}

            {vendors.length === 0 && (
              <tr>
                <td colSpan="4" className="p-6 text-center text-gray-400">
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
