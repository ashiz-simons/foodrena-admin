import { useEffect, useState } from "react";
import api from "../lib/api";

function statusBadge(status) {
  const map = {
    pending: "bg-orange-100 text-orange-700",
    paid: "bg-green-100 text-green-700",
    failed: "bg-red-100 text-red-700",
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${map[status] || "bg-gray-100 text-gray-700"}`}>
      {status}
    </span>
  );
}

export default function RiderWithdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);

  const load = async () => {
    try {
      const { data } = await api.get("/admin/rider-withdrawals");
      setWithdrawals(data || []);
    } catch (err) {
      console.error("Failed to load rider withdrawals", err);
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markPaid = async id => {
    if (!confirm("Mark rider withdrawal as PAID?")) return;
    setActionId(id);
    await api.patch(`/admin/rider-withdrawals/${id}/pay`);
    await load();
    setActionId(null);
  };

  const markFailed = async id => {
    const reason = prompt("Failure reason?");
    if (!reason) return;
    setActionId(id);
    await api.patch(`/admin/rider-withdrawals/${id}/fail`, { reason });
    await load();
    setActionId(null);
  };

  if (loading) {
    return <div className="p-6 text-gray-500">Loading rider withdrawals…</div>;
  }

  return (
    <div className="space-y-6">

      <h1 className="text-2xl font-bold">Rider Withdrawals</h1>

      {withdrawals.length === 0 ? (
        <div className="bg-white p-6 rounded-lg shadow text-gray-500">
          No rider withdrawals yet.
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-4">Rider</th>
                <th className="p-4">Amount</th>
                <th className="p-4">Reference</th>
                <th className="p-4">Status</th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {withdrawals.map(w => (
                <tr key={w._id} className="border-t hover:bg-gray-50">

                  <td className="p-4 font-medium">
                    {w.rider?.name || w.rider?.email || "—"}
                  </td>

                  <td className="p-4">
                    ₦{Number(w.amount).toLocaleString()}
                  </td>

                  <td className="p-4 text-xs text-gray-500">
                    {w.reference || "—"}
                  </td>

                  <td className="p-4">
                    {statusBadge(w.status)}
                  </td>

                  <td className="p-4 flex gap-2">
                    {w.status === "pending" && (
                      <>
                        <button
                          disabled={actionId === w._id}
                          onClick={() => markPaid(w._id)}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                        >
                          Mark Paid
                        </button>

                        <button
                          disabled={actionId === w._id}
                          onClick={() => markFailed(w._id)}
                          className="bg-red-600 text-white px-3 py-1 rounded text-xs hover:bg-red-700 disabled:opacity-50"
                        >
                          Fail
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}

              {withdrawals.length === 0 && (
                <tr>
                  <td colSpan="5" className="p-6 text-center text-gray-400">
                    No rider withdrawals found
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
