import { NavLink } from "react-router-dom";

const links = [
  { name: "Dashboard", path: "/" },
  { name: "Vendors", path: "/vendors" },
  { name: "Orders", path: "/orders" },
  { name: "Withdrawals", path: "/withdrawals" },
  { name: "Earnings", path: "/earnings" },
  { name: "Settings", path: "/settings" }, // ✅ added
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r h-screen">
      <div className="p-6 font-bold text-xl">Foodrena Admin</div>

      <nav className="space-y-1 px-3">
        {links.map(link => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `block px-4 py-2 rounded transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-100"
              }`
            }
          >
            {link.name}
          </NavLink>
        ))}
      </nav>
    </aside>
  );
}
