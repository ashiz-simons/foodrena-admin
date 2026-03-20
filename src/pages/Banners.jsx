import { useEffect, useRef, useState } from "react";

const API = import.meta.env.VITE_API_URL || "https://foodrena-backend-1.onrender.com/api";

async function authFetch(path, options = {}) {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(options.headers || {}),
    },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Request failed");
  return data;
}

export default function Banners() {
  const [banners, setBanners]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [uploading, setUploading] = useState(false);
  const [form, setForm]           = useState({ title: "", link: "", sortOrder: 0 });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [error, setError]         = useState("");
  const [success, setSuccess]     = useState("");
  const fileRef                   = useRef();

  useEffect(() => { fetchBanners(); }, []);

  async function fetchBanners() {
    setLoading(true);
    try {
      const data = await authFetch("/admin/banners");
      setBanners(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function handleFileChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function uploadToCloudinary(file) {
    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("image", file);
    formData.append("folder", "banners");

    const res = await fetch(`${API}/upload`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || "Upload failed");
    return { imageUrl: data.url, publicId: data.publicId };
  }

  async function handleCreate(e) {
    e.preventDefault();
    if (!imageFile) { setError("Please select an image"); return; }
    setUploading(true);
    setError("");
    setSuccess("");
    try {
      const { imageUrl, publicId } = await uploadToCloudinary(imageFile);
      await authFetch("/admin/banners", {
        method: "POST",
        body: JSON.stringify({
          imageUrl, publicId,
          title:     form.title,
          link:      form.link,
          sortOrder: Number(form.sortOrder),
        }),
      });
      setSuccess("Banner created successfully");
      setForm({ title: "", link: "", sortOrder: 0 });
      setImageFile(null);
      setImagePreview(null);
      if (fileRef.current) fileRef.current.value = "";
      fetchBanners();
    } catch (e) {
      setError(e.message);
    } finally {
      setUploading(false);
    }
  }

  async function toggleActive(banner) {
    try {
      await authFetch(`/admin/banners/${banner._id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !banner.active }),
      });
      fetchBanners();
    } catch (e) {
      setError(e.message);
    }
  }

  async function deleteBanner(id) {
    if (!window.confirm("Delete this banner?")) return;
    try {
      await authFetch(`/admin/banners/${id}`, { method: "DELETE" });
      setSuccess("Banner deleted");
      fetchBanners();
    } catch (e) {
      setError(e.message);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <h1 className="text-2xl font-bold text-gray-800">Banner Management</h1>

      {error   && <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">{error}</div>}
      {success && <div className="bg-green-50 text-green-600 px-4 py-3 rounded-lg text-sm">{success}</div>}

      {/* ── Create Banner ── */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">Add New Banner</h2>
        <form onSubmit={handleCreate} className="space-y-4">
          {/* Image upload */}
          <div
            onClick={() => fileRef.current?.click()}
            className="border-2 border-dashed border-gray-200 rounded-xl h-40 flex items-center justify-center cursor-pointer hover:border-blue-400 transition overflow-hidden"
          >
            {imagePreview ? (
              <img src={imagePreview} alt="preview"
                className="w-full h-full object-cover rounded-xl" />
            ) : (
              <div className="text-center text-gray-400">
                <div className="text-3xl mb-1">🖼️</div>
                <p className="text-sm">Click to upload banner image</p>
                <p className="text-xs mt-1">JPG, PNG, WEBP</p>
              </div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*"
            className="hidden" onChange={handleFileChange} />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Title (optional)</label>
              <input
                type="text"
                value={form.title}
                onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                placeholder="e.g. Free delivery promo"
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">Sort Order</label>
              <input
                type="number"
                value={form.sortOrder}
                onChange={e => setForm(f => ({ ...f, sortOrder: e.target.value }))}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">Link (optional)</label>
            <input
              type="text"
              value={form.link}
              onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
              placeholder="https://..."
              className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            type="submit"
            disabled={uploading}
            className="w-full bg-blue-600 text-white py-2.5 rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {uploading ? "Uploading..." : "Create Banner"}
          </button>
        </form>
      </div>

      {/* ── Banner List ── */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <h2 className="text-lg font-semibold text-gray-700 mb-4">
          All Banners
          <span className="ml-2 text-sm font-normal text-gray-400">({banners.length})</span>
        </h2>

        {loading ? (
          <div className="text-center py-8 text-gray-400">Loading...</div>
        ) : banners.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-4xl mb-2">🖼️</div>
            <p>No banners yet. Add one above.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {banners.map(banner => (
              <div key={banner._id}
                className="flex items-center gap-4 p-4 rounded-xl border bg-gray-50">
                {/* Image */}
                <div className="w-28 h-16 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                  <img src={banner.imageUrl} alt={banner.title || "Banner"}
                    className="w-full h-full object-cover" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-gray-800 truncate">
                    {banner.title || "Untitled banner"}
                  </p>
                  {banner.link && (
                    <p className="text-xs text-blue-500 truncate mt-0.5">{banner.link}</p>
                  )}
                  <div className="flex items-center gap-3 mt-1">
                    <span className="text-xs text-gray-400">
                      Order: {banner.sortOrder}
                    </span>
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                      banner.active
                        ? "bg-green-100 text-green-600"
                        : "bg-gray-200 text-gray-500"
                    }`}>
                      {banner.active ? "Active" : "Inactive"}
                    </span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 flex-shrink-0">
                  <button
                    onClick={() => toggleActive(banner)}
                    className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${
                      banner.active
                        ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200"
                        : "bg-green-100 text-green-700 hover:bg-green-200"
                    }`}
                  >
                    {banner.active ? "Deactivate" : "Activate"}
                  </button>
                  <button
                    onClick={() => deleteBanner(banner._id)}
                    className="text-xs px-3 py-1.5 rounded-lg font-medium bg-red-100 text-red-600 hover:bg-red-200 transition"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}