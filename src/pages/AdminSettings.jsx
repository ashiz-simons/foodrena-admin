import { useState } from "react";
import api from "../lib/api";

export default function AdminSettings() {
  const [newEmail, setNewEmail] = useState("");
  const [emailToken, setEmailToken] = useState("");
  const [emailStep, setEmailStep] = useState("request");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const notify = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
  };

  /* ======================
     EMAIL CHANGE
  ====================== */
  const requestEmailChange = async () => {
    try {
      setLoading(true);
      notify("");

      await api.post("/admin/settings/email/request", { newEmail });

      setEmailStep("verify");
      notify("Verification token sent to new email", "success");
    } catch (err) {
      notify(err.response?.data?.message || "Request failed", "error");
    } finally {
      setLoading(false);
    }
  };

  const verifyEmailChange = async () => {
    try {
      setLoading(true);
      notify("");

      await api.post("/admin/settings/email/confirm", {
        token: emailToken,
      });

      notify("Email updated successfully", "success");
      setEmailStep("done");
    } catch (err) {
      notify(err.response?.data?.message || "Verification failed", "error");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     PASSWORD CHANGE
  ====================== */
  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      return notify("Passwords do not match", "error");
    }

    try {
      setLoading(true);
      notify("");

      await api.patch("/admin/settings/password", {
        currentPassword,
        newPassword,
      });

      notify("Password updated successfully", "success");

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      notify(err.response?.data?.message || "Password update failed", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl space-y-10">

      {/* HEADER */}
      <div>
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <p className="text-sm text-gray-500">
          Manage account security and credentials
        </p>
      </div>

      {/* EMAIL SETTINGS */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-lg font-semibold">Change Email</h2>

        {emailStep === "request" && (
          <>
            <input
              type="email"
              placeholder="New email address"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring"
            />

            <button
              onClick={requestEmailChange}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              {loading ? "Sending..." : "Send Verification"}
            </button>
          </>
        )}

        {emailStep === "verify" && (
          <>
            <input
              placeholder="Verification token"
              value={emailToken}
              onChange={e => setEmailToken(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring"
            />

            <button
              onClick={verifyEmailChange}
              disabled={loading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              {loading ? "Verifying..." : "Verify Email"}
            </button>
          </>
        )}

        {emailStep === "done" && (
          <p className="text-green-600 font-medium">
            Email updated successfully ✔
          </p>
        )}
      </div>

      {/* PASSWORD SETTINGS */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-lg font-semibold">Change Password</h2>

        <input
          type="password"
          placeholder="Current password"
          value={currentPassword}
          onChange={e => setCurrentPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:ring"
        />

        <input
          type="password"
          placeholder="New password"
          value={newPassword}
          onChange={e => setNewPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:ring"
        />

        <input
          type="password"
          placeholder="Confirm new password"
          value={confirmPassword}
          onChange={e => setConfirmPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:ring"
        />

        <button
          onClick={changePassword}
          disabled={loading}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          {loading ? "Updating..." : "Update Password"}
        </button>
      </div>

      {/* SECURITY */}
      <div className="bg-white p-6 rounded-xl shadow space-y-3">
        <h2 className="text-lg font-semibold">Security</h2>

        <button
          onClick={async () => {
            const res = await api.patch("/admin/settings/2fa");
            notify(
              res.data.enabled
                ? "Two-factor authentication enabled"
                : "Two-factor authentication disabled",
              "success"
            );
          }}
          className="px-4 py-2 bg-gray-900 text-white rounded hover:bg-black transition"
        >
          Toggle Two-Factor Authentication
        </button>
      </div>

      {/* MESSAGE */}
      {message && (
        <div
          className={`text-sm px-4 py-2 rounded ${
            messageType === "success"
              ? "bg-green-50 text-green-700"
              : messageType === "error"
              ? "bg-red-50 text-red-700"
              : "bg-blue-50 text-blue-700"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}
