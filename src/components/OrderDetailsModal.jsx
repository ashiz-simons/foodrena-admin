export default function OrderDetailsModal({ order, onClose }) {
  if (!order) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        {/* HEADER */}
        <div className="flex justify-between items-center px-6 py-4 border-b">
          <h2 className="text-lg font-semibold">
            Order #{order._id.slice(-6)}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-700 text-xl"
          >
            ×
          </button>
        </div>

        {/* BODY */}
        <div className="p-6 space-y-6 text-sm">
          {/* STATUS */}
          <div className="grid grid-cols-2 gap-4">
            <Info label="Status" value={order.status} />
            <Info label="Payment" value={order.paymentStatus} />
            <Info label="Total" value={`₦${order.total.toLocaleString()}`} />
            <Info
              label="Created"
              value={new Date(order.createdAt).toLocaleString()}
            />
          </div>

          {/* USER */}
          <Section title="Customer">
            <Info label="Name" value={order.user?.name} />
            <Info label="Email" value={order.user?.email} />
          </Section>

          {/* VENDOR */}
          <Section title="Vendor">
            <Info label="Name" value={order.vendor?.name} />
            <Info label="ID" value={order.vendor?._id} />
          </Section>

          {/* DELIVERY */}
          <Section title="Delivery Address">
            <p className="text-gray-700">
              {order.deliveryAddress.street}, {order.deliveryAddress.city},{" "}
              {order.deliveryAddress.state}
            </p>
          </Section>

          {/* ITEMS */}
          <Section title="Items">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2">Item</th>
                  <th>Qty</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map(item => (
                  <tr key={item._id} className="border-b">
                    <td className="py-2">{item.name}</td>
                    <td className="text-center">{item.quantity}</td>
                    <td className="text-right">
                      ₦{item.price.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Section>
        </div>
      </div>
    </div>
  );
}

/* ---------- helpers ---------- */
function Section({ title, children }) {
  return (
    <div>
      <h3 className="font-semibold mb-2">{title}</h3>
      <div className="bg-gray-50 rounded-lg p-4">{children}</div>
    </div>
  );
}

function Info({ label, value }) {
  return (
    <div>
      <p className="text-gray-400 text-xs">{label}</p>
      <p className="font-medium">{value || "—"}</p>
    </div>
  );
}
