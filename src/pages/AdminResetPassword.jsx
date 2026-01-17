import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../lib/api";

export default function AdminResetPassword() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");

  if (!state) return <div>Invalid access</div>;

  const submit = async e => {
    e.preventDefault();
    try {
      await api.post("/admin/auth/reset-password", {
        resetToken: state.resetToken,
        newPassword: password,
      });

      alert("Password reset successful");
      navigate("/login");
    } catch (err) {
      alert(err.response?.data?.message || "Failed");
    }
  };

  return (
    <form onSubmit={submit} className="max-w-md mx-auto mt-24 bg-white p-6 rounded shadow">
      <h1 className="text-xl font-bold mb-4">Set New Password</h1>

      <input
        type="password"
        className="w-full border p-2 mb-4"
        placeholder="New password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      <button className="w-full bg-green-600 text-white py-2 rounded">
        Reset Password
      </button>
    </form>
  );
}
