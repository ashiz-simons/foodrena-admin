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

export default function Withdrawals() {
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [expanded, setExpanded] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const load = async () => {
    try {
      setLoading(true);
      const { data } = await api.get("/admin/withdrawals");
      setWithdrawals(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load withdrawals", err);
      setWithdrawals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const markPaid = async id => {
    if (!confirm("Mark this withdrawal as PAID?")) return;
    setActionId(id);
    await api.patch(`/admin/withdrawals/${id}/pay`);
    await load();
    setActionId(null);
  };

  const markFailed = async id => {
    const reason = prompt("Failure reason?");
    if (!reason) return;
    setActionId(id);
    await api.patch(`/admin/withdrawals/${id}/fail`, { reason });
    await load();
    setActionId(null);
  };

  const filtered = withdrawals.filter(w => {
    if (statusFilter !== "all" && w.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match =
        w.vendor?.businessName?.toLowerCase().includes(q) ||
        w.reference?.toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  if (loading) return <div className="p-6 text-gray-500">Loading withdrawals…</div>;

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">Vendor Withdrawals</h1>

      {/* FILTER BAR */}
      <div className="bg-white p-4 rounded shadow flex flex-wrap gap-3 sticky top-2 z-10">
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search vendor or reference..."
          className="px-3 py-2 border rounded text-sm w-64"
        />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border rounded text-sm"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="failed">Failed</option>
        </select>
        {(search || statusFilter !== "all") && (
          <button
            onClick={() => { setSearch(""); setStatusFilter("all"); }}
            className="px-4 py-2 bg-gray-200 rounded text-sm"
          >
            Reset
          </button>
        )}
      </div>

      {/* TABLE */}
      {filtered.length === 0 ? (
        <div className="bg-white p-6 rounded shadow text-gray-500">
          No withdrawals found.
        </div>
      ) : (
        <div className="bg-white rounded shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-100 text-left">
              <tr>
                <th className="p-3">Vendor</th>
                <th className="p-3">Amount</th>
                <th className="p-3">Reference</th>
                <th className="p-3">Status</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(w => (
                <>
                  <tr key={w._id} className="border-b hover:bg-gray-50">
                    <td className="p-3 font-medium">{w.vendor?.businessName || "—"}</td>
                    <td className="p-3">₦{Number(w.amount).toLocaleString()}</td>
                    <td className="p-3 text-xs text-gray-500">{w.reference || "—"}</td>
                    <td className="p-3">{statusBadge(w.status)}</td>
                    <td className="p-3 flex gap-2">
                      <button
                        onClick={() => setExpanded(expanded === w._id ? null : w._id)}
                        className="px-3 py-1 bg-gray-200 rounded text-xs"
                      >
                        {expanded === w._id ? "Hide" : "View"}
                      </button>
                      {w.status === "pending" && (
                        <>
                          <button
                            disabled={actionId === w._id}
                            onClick={() => markPaid(w._id)}
                            className="bg-green-600 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                          >
                            Mark Paid
                          </button>
                          <button
                            disabled={actionId === w._id}
                            onClick={() => markFailed(w._id)}
                            className="bg-red-600 text-white px-3 py-1 rounded text-xs disabled:opacity-50"
                          >
                            Fail
                          </button>
                        </>
                      )}
                    </td>
                  </tr>

                  {/* EXPANDED BANK DETAILS */}
                  {expanded === w._id && (
                    <tr className="bg-gray-50 border-b">
                      <td colSpan="5" className="p-4 text-xs text-gray-700 space-y-2">
                        {/* bank fields: top-level on withdrawal doc OR nested in vendor.bank */}
                        <div><strong>Bank:</strong> {w.bankName || w.vendor?.bank?.bankName || "N/A"}</div>
                        <div><strong>Account Number:</strong> {w.accountNumber || w.vendor?.bank?.accountNumber || "N/A"}</div>
                        <div><strong>Account Name:</strong> {w.accountName || w.vendor?.bank?.accountName || "N/A"}</div>
                        <div><strong>Requested:</strong> {new Date(w.createdAt).toLocaleString()}</div>
                        {w.failureReason && (
                          <div><strong>Failure Reason:</strong> {w.failureReason}</div>
                        )}
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}