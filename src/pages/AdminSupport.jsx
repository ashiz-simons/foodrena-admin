import { useEffect, useState } from "react";
import api from "../lib/api";

const STATUS_COLORS = {
  open:        { bg: "#EFF6FF", text: "#2563EB" },
  in_progress: { bg: "#FFF7ED", text: "#EA580C" },
  resolved:    { bg: "#F0FDF4", text: "#16A34A" },
  closed:      { bg: "#F3F4F6", text: "#6B7280" },
};

export default function AdminSupport() {
  const [tickets, setTickets]     = useState([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState(null);
  const [filter, setFilter]       = useState("all");
  const [replyText, setReplyText] = useState("");
  const [sending, setSending]     = useState(false);

  useEffect(() => { fetchTickets(); }, [filter]);

  async function fetchTickets() {
    setLoading(true);
    try {
      const params = filter !== "all" ? `?status=${filter}` : "";
      const { data } = await api.get(`/support/admin/all${params}`);
      setTickets(data.tickets || []);
    } catch (e) { console.error(e); }
    setLoading(false);
  }

  async function sendReply(status) {
    if (!replyText.trim() && !status) return;
    setSending(true);
    try {
      const { data } = await api.post(`/support/admin/${selected._id}/reply`, {
        text:   replyText.trim() || undefined,
        status: status || undefined,
      });
      setSelected(data.ticket);
      setReplyText("");
      fetchTickets();
    } catch (e) { console.error(e); }
    setSending(false);
  }

  async function closeTicket() {
    try {
      const { data } = await api.patch(`/support/admin/${selected._id}/close`);
      setSelected(data.ticket);
      fetchTickets();
    } catch (e) { console.error(e); }
  }

  const filters = ["all", "open", "in_progress", "resolved", "closed"];
  const filtered = filter === "all" ? tickets
    : tickets.filter(t => t.status === filter);

  return (
    <div style={{ display: "flex", height: "calc(100vh - 64px)", overflow: "hidden" }}>
      {/* ── Left panel — ticket list ── */}
      <div style={{ width: 340, borderRight: "1px solid #E5E7EB",
          display: "flex", flexDirection: "column", background: "#fff" }}>
        <div style={{ padding: "16px", borderBottom: "1px solid #E5E7EB" }}>
          <h2 style={{ fontWeight: 700, fontSize: 17, marginBottom: 12 }}>
            Support Tickets
          </h2>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
            {filters.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                style={{
                  padding: "4px 10px", borderRadius: 20, fontSize: 12,
                  fontWeight: 600, cursor: "pointer", border: "none",
                  background: filter === f ? "#2563EB" : "#F3F4F6",
                  color: filter === f ? "#fff" : "#374151",
                }}>
                {f === "all" ? "All" : f.replace("_", " ").replace(/^\w/, c => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>
        <div style={{ flex: 1, overflowY: "auto" }}>
          {loading ? (
            <div style={{ padding: 24, textAlign: "center", color: "#9CA3AF" }}>
              Loading...
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: 24, textAlign: "center", color: "#9CA3AF" }}>
              No tickets
            </div>
          ) : filtered.map(t => {
            const sc = STATUS_COLORS[t.status] || STATUS_COLORS.closed;
            const active = selected?._id === t._id;
            return (
              <div key={t._id} onClick={() => setSelected(t)}
                style={{
                  padding: "14px 16px", cursor: "pointer",
                  borderBottom: "1px solid #F3F4F6",
                  background: active ? "#EFF6FF" : "transparent",
                  borderLeft: active ? "3px solid #2563EB" : "3px solid transparent",
                }}>
                <div style={{ display: "flex", justifyContent: "space-between",
                    alignItems: "flex-start", marginBottom: 4 }}>
                  <span style={{ fontWeight: 600, fontSize: 13,
                      color: "#111827", flex: 1, marginRight: 8 }}
                    className="line-clamp-1">
                    {t.subject}
                  </span>
                  <span style={{ fontSize: 11, fontWeight: 700,
                      padding: "2px 7px", borderRadius: 10,
                      background: sc.bg, color: sc.text, whiteSpace: "nowrap" }}>
                    {t.status.replace("_", " ")}
                  </span>
                </div>
                <div style={{ fontSize: 12, color: "#6B7280" }}>
                  {t.customer?.name} · {t.category}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Right panel — chat ── */}
      {selected ? (
        <div style={{ flex: 1, display: "flex", flexDirection: "column",
            background: "#F9FAFB" }}>
          {/* Header */}
          <div style={{ padding: "14px 20px", background: "#fff",
              borderBottom: "1px solid #E5E7EB",
              display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{selected.subject}</div>
              <div style={{ fontSize: 12, color: "#6B7280", marginTop: 2 }}>
                {selected.customer?.name} · {selected.customer?.email}
                {selected.orderId && ` · Order #${selected.orderId._id?.substring(0,8).toUpperCase()}`}
              </div>
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              {selected.status !== "resolved" && (
                <button onClick={() => sendReply("resolved")}
                  style={{ padding: "6px 14px", background: "#F0FDF4",
                      color: "#16A34A", border: "1px solid #BBF7D0",
                      borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  Mark Resolved
                </button>
              )}
              {selected.status !== "closed" && (
                <button onClick={closeTicket}
                  style={{ padding: "6px 14px", background: "#FEF2F2",
                      color: "#DC2626", border: "1px solid #FECACA",
                      borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: "pointer" }}>
                  Close
                </button>
              )}
            </div>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px",
              display: "flex", flexDirection: "column", gap: 10 }}>
            {(selected.messages || []).map((m, i) => {
              const isSupport = m.sender === "support";
              return (
                <div key={i} style={{
                  display: "flex",
                  justifyContent: isSupport ? "flex-start" : "flex-end",
                }}>
                  <div style={{
                    maxWidth: "65%", padding: "10px 14px",
                    borderRadius: isSupport
                      ? "14px 14px 14px 2px"
                      : "14px 14px 2px 14px",
                    background: isSupport ? "#fff" : "#2563EB",
                    color: isSupport ? "#111827" : "#fff",
                    fontSize: 13, lineHeight: 1.5,
                    boxShadow: "0 1px 2px rgba(0,0,0,0.06)",
                  }}>
                    {isSupport && (
                      <div style={{ fontSize: 11, fontWeight: 700,
                          color: "#2563EB", marginBottom: 4 }}>Support</div>
                    )}
                    {m.text}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Reply input */}
          {selected.status !== "closed" && (
            <div style={{ padding: "12px 20px 20px", background: "#fff",
                borderTop: "1px solid #E5E7EB", display: "flex", gap: 10 }}>
              <textarea
                value={replyText}
                onChange={e => setReplyText(e.target.value)}
                rows={2}
                placeholder="Type a reply..."
                style={{ flex: 1, padding: "10px 14px", borderRadius: 10,
                    border: "1px solid #E5E7EB", fontSize: 13,
                    resize: "none", outline: "none", fontFamily: "inherit" }}
              />
              <button onClick={() => sendReply(null)} disabled={sending}
                style={{ padding: "0 20px", background: "#2563EB",
                    color: "#fff", border: "none", borderRadius: 10,
                    fontWeight: 700, fontSize: 14, cursor: "pointer",
                    opacity: sending ? 0.6 : 1 }}>
                {sending ? "..." : "Send"}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div style={{ flex: 1, display: "flex", alignItems: "center",
            justifyContent: "center", color: "#9CA3AF", flexDirection: "column", gap: 8 }}>
          <span style={{ fontSize: 40 }}>💬</span>
          <span style={{ fontSize: 15 }}>Select a ticket to view the conversation</span>
        </div>
      )}
    </div>
  );
}