import { useState } from "react";
import api from "../lib/api";
import { useEffect } from "react";

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

  const [flatFee, setFlatFee] = useState("");
  const [percentage, setPercentage] = useState("");
  const [minFee, setMinFee] = useState("");
  const [maxFee, setMaxFee] = useState("");
  const [configLoading, setConfigLoading] = useState(false);

  const [vendorPercent, setVendorPercent] = useState("");
  const [riderPercent, setRiderPercent] = useState("");

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

    useEffect(() => {
        const fetchConfig = async () => {
          try {
            setConfigLoading(true);

            const res = await api.get("/admin/config");
            const data = res.data;

            // Service Fee
            setFlatFee(data.serviceFee?.flatFee ?? 0);
            setPercentage((data.serviceFee?.percentage ?? 0) * 100);
            setMinFee(data.serviceFee?.minFee ?? 0);
            setMaxFee(data.serviceFee?.maxFee ?? "");

            // Pricing
            setVendorPercent((data.pricing?.vendorCommissionPercent ?? 0.1) * 100);
            setRiderPercent((data.pricing?.riderPayoutPercent ?? 0.7) * 100);

          } catch (err) {
            notify("Failed to load config", "error");
          } finally {
            setConfigLoading(false);
          }
        };

        fetchConfig();
      }, []);

    const validateServiceFee = () => {
      const flat = Number(flatFee);
      const perc = Number(percentage);
      const min = Number(minFee);
      const max = maxFee ? Number(maxFee) : null;

      // Empty check
      if (flatFee === "" || percentage === "" || minFee === "") {
        notify("All required fields must be filled", "error");
        return false;
      }

      // Negative values
      if (flat < 0 || perc < 0 || min < 0 || (max !== null && max < 0)) {
        notify("Values cannot be negative", "error");
        return false;
      }

      // Percentage limit (0–100)
      if (perc > 100) {
        notify("Percentage cannot exceed 100%", "error");
        return false;
      }

      // Prevent zero revenue
      if (flat === 0 && perc === 0) {
        notify("Flat fee and percentage cannot both be 0", "error");
        return false;
      }

      // Min vs Max
      if (max !== null && min > max) {
        notify("Minimum fee cannot be greater than maximum fee", "error");
        return false;
      }

      return true;
    };

    const updatePricing = async () => {
      try {
        setLoading(true);
        notify("");

        await api.put("/admin/config/pricing", {
          vendorCommissionPercent: Number(vendorPercent) / 100,
          riderPayoutPercent: Number(riderPercent) / 100,
        });

        notify("Pricing updated successfully", "success");
      } catch (err) {
        notify(
          err.response?.data?.message || "Failed to update pricing",
          "error"
        );
      } finally {
        setLoading(false);
      }
    };

    const updateServiceFee = async () => {
      if (!validateServiceFee()) return;

      try {
        setLoading(true);
        notify("");

        await api.put("/admin/config/service-fee", {
          flatFee: Number(flatFee),
          percentage: Number(percentage) / 100, // ✅ FIXED
          minFee: Number(minFee),
          maxFee: maxFee ? Number(maxFee) : null,
        });

        notify("Service fee updated successfully", "success");
      } catch (err) {
        notify(
          err.response?.data?.message || "Failed to update service fee",
          "error"
        );
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

      {/* SERVICE FEE SETTINGS */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-lg font-semibold">Service Fee Settings</h2>

        {configLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <>
            <input
              type="number"
              placeholder="Flat Fee (₦)"
              value={flatFee}
              onChange={e => setFlatFee(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring"
            />

            <input
              type="number"
              placeholder="Percentage (%)"
              value={percentage}
              onChange={e => setPercentage(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring"
            />
            <p className="text-xs text-gray-500">
              Example: 5 = 5%
            </p>

            <input
              type="number"
              placeholder="Minimum Fee (₦)"
              value={minFee}
              onChange={e => setMinFee(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring"
            />

            <input
              type="number"
              placeholder="Maximum Fee (optional)"
              value={maxFee}
              onChange={e => setMaxFee(e.target.value)}
              className="w-full px-3 py-2 border rounded focus:ring"
            />

            <button
              onClick={updateServiceFee}
              disabled={loading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              {loading ? "Updating..." : "Save Service Fee"}
            </button>
          </>
        )}
      </div>

      {/* PRICING SETTINGS */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-lg font-semibold">Revenue Split</h2>

        <input
          type="number"
          placeholder="Vendor Commission (%)"
          value={vendorPercent}
          onChange={e => setVendorPercent(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:ring"
        />
        <p className="text-xs text-gray-500">
          Example: 10 = 10% platform commission from vendor
        </p>

        <input
          type="number"
          placeholder="Rider Payout (%)"
          value={riderPercent}
          onChange={e => setRiderPercent(e.target.value)}
          className="w-full px-3 py-2 border rounded focus:ring"
        />
        <p className="text-xs text-gray-500">
          Example: 70 = 70% of delivery fee goes to rider
        </p>

        <button
          onClick={updatePricing}
          disabled={loading}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
        >
          {loading ? "Updating..." : "Save Pricing"}
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