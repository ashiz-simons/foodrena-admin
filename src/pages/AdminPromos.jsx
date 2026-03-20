import { useState, useEffect } from "react";
import api from "../lib/api";

const TYPES = [
  { value: "percent",      label: "Percentage off" },
  { value: "free_delivery", label: "Free delivery" },
];

export default function AdminPromos() {
  const [promos, setPromos]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState({
    code: "", type: "percent", discountPercent: "",
    minOrder: "", expiresAt: "", firstOrderOnly: false,
  });
  const [creating, setCreating] = useState(false);
  const [error, setError]       = useState("");

  useEffect(() => { fetchPromos(); }, []);

  async function fetchPromos() {
    try {
      setLoading(true);
      const { data } = await api.get("/promos/admin");
      setPromos(data);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function handleCreate(e) {
    e.preventDefault();
    setError("");
    setCreating(true);
    try {
      const body = {
        code:          form.code,
        type:          form.type,
        minOrder:      Number(form.minOrder) || 0,
        firstOrderOnly: form.firstOrderOnly,
        expiresAt:     form.expiresAt || null,
      };
      if (form.type === "percent") body.discountPercent = Number(form.discountPercent);
      await api.post("/promos/admin", body);
      setForm({ code: "", type: "percent", discountPercent: "", minOrder: "", expiresAt: "", firstOrderOnly: false });
      fetchPromos();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create promo");
    } finally {
      setCreating(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm("Delete this promo?")) return;
    await api.delete(`/promos/admin/${id}`);
    fetchPromos();
  }

  async function handleToggle(id) {
    await api.patch(`/promos/admin/${id}/toggle`);
    fetchPromos();
  }

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Promo Codes</h1>

      {/* ── Create form ── */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 mb-8">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Create New Promo</h2>
        <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Code *</label>
            <input
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm uppercase tracking-widest"
              placeholder="e.g. SAVE20"
              value={form.code}
              onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Type *</label>
            <select
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.type}
              onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
            >
              {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          {form.type === "percent" && (
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Discount % *</label>
              <input
                type="number" min="1" max="100"
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
                placeholder="e.g. 20"
                value={form.discountPercent}
                onChange={e => setForm(f => ({ ...f, discountPercent: e.target.value }))}
                required
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Min Order (₦)</label>
            <input
              type="number" min="0"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              placeholder="0 = no minimum"
              value={form.minOrder}
              onChange={e => setForm(f => ({ ...f, minOrder: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Expires At</label>
            <input
              type="date"
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
              value={form.expiresAt}
              onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
            />
          </div>

          <div className="flex items-center gap-2 mt-2">
            <input
              type="checkbox" id="firstOrder"
              checked={form.firstOrderOnly}
              onChange={e => setForm(f => ({ ...f, firstOrderOnly: e.target.checked }))}
              className="w-4 h-4 accent-teal-500"
            />
            <label htmlFor="firstOrder" className="text-sm text-gray-600">First order only</label>
          </div>

          {error && (
            <div className="sm:col-span-2 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2">
              {error}
            </div>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={creating}
              className="bg-teal-500 hover:bg-teal-600 text-white font-semibold px-6 py-2 rounded-lg text-sm transition disabled:opacity-50"
            >
              {creating ? "Creating…" : "Create Promo"}
            </button>
          </div>
        </form>
      </div>

      {/* ── Promo list ── */}
      {loading ? (
        <div className="text-center text-gray-400 py-12">Loading…</div>
      ) : promos.length === 0 ? (
        <div className="text-center text-gray-400 py-12">No promos yet</div>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-gray-100 shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 uppercase text-xs">
              <tr>
                {["Code","Type","Discount","Min Order","Expires","First Order","Created By","Uses","Status",""].map(h => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {promos.map(p => (
                <tr key={p._id} className="bg-white hover:bg-gray-50 transition">
                  <td className="px-4 py-3 font-mono font-bold tracking-widest text-teal-600">{p.code}</td>
                  <td className="px-4 py-3 capitalize">{p.type === "percent" ? "Percent" : "Free delivery"}</td>
                  <td className="px-4 py-3">{p.type === "percent" ? `${p.discountPercent}%` : "—"}</td>
                  <td className="px-4 py-3">{p.minOrder > 0 ? `₦${p.minOrder}` : "None"}</td>
                  <td className="px-4 py-3">{p.expiresAt ? p.expiresAt.substring(0, 10) : "Never"}</td>
                  <td className="px-4 py-3">{p.firstOrderOnly ? "✅" : "—"}</td>
                  <td className="px-4 py-3">
                    {p.createdByRole === "admin" ? (
                      <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs">Admin</span>
                    ) : (
                      <span className="bg-teal-100 text-teal-700 px-2 py-0.5 rounded-full text-xs">
                        {p.vendorId?.businessName || "Vendor"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">{p.usedBy?.length || 0}</td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                      p.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                    }`}>
                      {p.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleToggle(p._id)}
                        className="text-xs text-blue-500 hover:underline"
                      >
                        {p.isActive ? "Disable" : "Enable"}
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="text-xs text-red-500 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}