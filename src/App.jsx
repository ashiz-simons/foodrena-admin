import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./auth/AuthContext";
import ProtectedRoute from "./auth/ProtectedRoute";
import AdminLayout from "./layout/AdminLayout";

import Dashboard from "./pages/Dashboard";
import Vendors from "./pages/Vendors";
import Orders from "./pages/Orders";
import Withdrawals from "./pages/Withdrawals";
import Earnings from "./pages/Earnings";
import Login from "./pages/Login";
import AdminSettings from "./pages/AdminSettings";
import AdminForgotPassword from "./pages/AdminForgotPassword";
import AdminVerifyReset from "./pages/AdminVerifyReset";
import AdminResetPassword from "./pages/AdminResetPassword";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>

          {/* ================= PUBLIC ================= */}
          <Route path="/login" element={<Login />} />

          <Route path="/admin/forgot-password" element={<AdminForgotPassword />} />
          <Route path="/admin/verify-reset" element={<AdminVerifyReset />} />
          <Route path="/admin/reset-password" element={<AdminResetPassword />} />

          {/* ================= PROTECTED ADMIN ================= */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="vendors" element={<Vendors />} />
            <Route path="orders" element={<Orders />} />
            <Route path="withdrawals" element={<Withdrawals />} />
            <Route path="earnings" element={<Earnings />} />
            <Route path="settings" element={<AdminSettings />} />
          </Route>

        </Routes>

      </BrowserRouter>
    </AuthProvider>
  );
}
