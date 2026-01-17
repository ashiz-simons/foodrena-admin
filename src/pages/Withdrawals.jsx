import { useEffect, useState } from "react";
import api from "../lib/api";

function statusBadge(status) {
  const map = {
    pending: "bg-orange-100 text-orange-700",
    approved: "bg-green-100 text-green-700",
    rejected: "bg-red-100 text-red-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[status]}`}>
      {status}
    </span>
  );
}

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadWithdrawals = async () => {
    const res = await api.get("/admin/withdrawals");
    setWithdrawals(res.data);
  };

  const approve = async (id) => {
    await api.patch(`/admin/withdrawals/${id}/approve`);
    loadWithdrawals();
  };

  const reject = async (id) => {
    await api.patch(`/admin/withdrawals/${id}/reject`);
    loadWithdrawals();
  };

  useEffect(() => {
    loadWithdrawals().finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading withdrawals…</div>;

  return (
    <div className="bg-white rounded-lg shadow overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-3 text-left">Vendor</th>
            <th className="px-4 py-3 text-left">Amount</th>
            <th className="px-4 py-3 text-left">Status</th>
            <th className="px-4 py-3 text-left">Requested</th>
            <th className="px-4 py-3 text-left">Action</th>
          </tr>
        </thead>

        <tbody>
          {withdrawals.map(w => (
            <tr key={w._id} className="border-t">
              <td className="px-4 py-3 font-medium">
                {w.vendor?.businessName}
              </td>

              <td className="px-4 py-3 font-semibold">
                ₦{w.amount.toLocaleString()}
              </td>

              <td className="px-4 py-3">
                {statusBadge(w.status)}
              </td>

              <td className="px-4 py-3 text-xs text-gray-500">
                {new Date(w.createdAt).toLocaleString()}
              </td>

              <td className="px-4 py-3 space-x-2">
                {w.status === "pending" && (
                  <>
                    <button
                      onClick={() => approve(w._id)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-xs"
                    >
                      Approve
                    </button>

                    <button
                      onClick={() => reject(w._id)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-xs"
                    >
                      Reject
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}

          {withdrawals.length === 0 && (
            <tr>
              <td colSpan="5" className="px-4 py-6 text-center text-gray-400">
                No withdrawal requests
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
