import { NavLink } from "react-router-dom";

const links = [
  { name: "Dashboard",         path: "/" },
  // Core Ops
  { name: "Orders",            path: "/orders" },
  { name: "Vendors",           path: "/vendors" },
  { name: "Riders",            path: "/riders" },
  { name: "Rider Radar",       path: "/rider-radar" },
  { name: "Promos",            path: "/promos" },
  { name: "Banners",           path: "/banners" },
  { name: "Support",           path: "/support" },
  // Finance
  { name: "Withdrawals",       path: "/withdrawals" },
  { name: "Rider Withdrawals", path: "/rider-withdrawals" },
  { name: "Earnings",          path: "/earnings" },
  // System
  { name: "Settings",          path: "/settings" },
];

export default function Sidebar() {
  return (
    <aside className="w-64 bg-white border-r h-screen flex flex-col">
      <div className="p-6 font-bold text-xl">Foodrena Admin</div>
      <nav className="space-y-1 px-3 flex-1">
        {links.map(link => (
          <NavLink
            key={link.path}
            to={link.path}
            className={({ isActive }) =>
              `block px-4 py-2 rounded transition text-sm ${
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
      <div className="p-4 text-xs text-gray-400 border-t">
        Admin Panel • Foodrena<br />property of AshizVerse.
      </div>
    </aside>
  );
}