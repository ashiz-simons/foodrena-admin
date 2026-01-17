import { useState } from "react";
import api from "../lib/api";

export default function AdminSettings() {
  /* ======================
     EMAIL CHANGE STATE
  ====================== */
  const [newEmail, setNewEmail] = useState("");
  const [emailToken, setEmailToken] = useState("");
  const [emailStep, setEmailStep] = useState("request");

  /* ======================
     PASSWORD CHANGE STATE
  ====================== */
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  /* ======================
     EMAIL CHANGE
  ====================== */
  const requestEmailChange = async () => {
    try {
      setLoading(true);
      setMessage("");

      await api.post("/admin/settings/email/request", { newEmail });

      setEmailStep("verify");
      setMessage("Verification token sent to new email");
    } catch (err) {
      setMessage(err.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailChange = async () => {
    try {
      setLoading(true);
      setMessage("");

      await api.post("/admin/settings/email/confirm", {
        token: emailToken,
      });

      setMessage("Email updated successfully");
      setEmailStep("done");
    } catch (err) {
      setMessage(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     PASSWORD CHANGE
  ====================== */
  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      return setMessage("Passwords do not match");
    }

    try {
      setLoading(true);
      setMessage("");

      await api.patch("/admin/settings/password", {
        currentPassword,
        newPassword,
      });

      setMessage("Password updated successfully");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setMessage(err.response?.data?.message || "Password update failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl space-y-10">

      {/* ======================
          EMAIL SETTINGS
      ====================== */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">Change Email</h2>

        {emailStep === "request" && (
          <>
            <input
              type="email"
              placeholder="New email"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-3"
            />

            <button
              onClick={requestEmailChange}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded"
            >
              Send Verification
            </button>
          </>
        )}

        {emailStep === "verify" && (
          <>
            <input
              placeholder="Verification token"
              value={emailToken}
              onChange={e => setEmailToken(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-3"
            />

            <button
              onClick={verifyEmailChange}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded"
            >
              Verify Email
            </button>
          </>
        )}

        {emailStep === "done" && (
          <p className="text-green-600 font-medium">
            Email updated ✔
          </p>
        )}
      </div>

      {/* ======================
          PASSWORD SETTINGS
      ====================== */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-bold mb-4">Change Password</h2>

        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-3"
        />

        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-3"
        />

        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded mb-4"
        />

        <button
          onClick={changePassword}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>

      {/* ======================
    SECURITY SETTINGS
====================== */}
<div className="bg-white p-6 rounded-lg shadow">
  <h2 className="text-lg font-bold mb-4">Security</h2>

  <button
    onClick={async () => {
      const res = await api.patch("/admin/settings/2fa");
      setMessage(
        res.data.enabled
          ? "Two-factor authentication enabled"
          : "Two-factor authentication disabled"
      );
    }}
    className="px-4 py-2 bg-gray-800 text-white rounded"
  >
    Toggle Two-Factor Authentication
  </button>
</div>


      {message && (
        <div className="text-sm text-blue-600">{message}</div>
      )}
    </div>
  );
}
