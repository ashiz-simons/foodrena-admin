import { useAuth } from "../auth/AuthContext";

export default function Topbar() {
  const { logout } = useAuth();

  return (
    <header className="h-14 bg-white border-b flex items-center justify-between px-6">
      <span className="font-semibold">Admin Panel</span>

      <button
        onClick={logout}
        className="text-sm text-red-600 hover:underline"
      >
        Logout
      </button>
    </header>
  );
}
