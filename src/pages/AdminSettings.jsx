import { useState, useEffect } from "react";
import api from "../lib/api";

export default function AdminSettings() {
  const [newEmail, setNewEmail] = useState("");
  const [emailToken, setEmailToken] = useState("");
  const [emailStep, setEmailStep] = useState("request");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [flatFee, setFlatFee] = useState("");
  const [percentage, setPercentage] = useState("");
  const [minFee, setMinFee] = useState("");
  const [maxFee, setMaxFee] = useState("");

  const [vendorPercent, setVendorPercent] = useState("");
  const [riderPercent, setRiderPercent] = useState("");

  // ── Separate loading states per section ──────────────────────────────────
  const [emailLoading, setEmailLoading]     = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [feeLoading, setFeeLoading]         = useState(false);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [configLoading, setConfigLoading]   = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");

  const notify = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
  };

  // ── Load config on mount ──────────────────────────────────────────────────
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setConfigLoading(true);
        const res = await api.get("/admin/config");
        const data = res.data;

        setFlatFee(data.serviceFee?.flatFee ?? 0);
        setPercentage((data.serviceFee?.percentage ?? 0) * 100);
        setMinFee(data.serviceFee?.minFee ?? 0);
        setMaxFee(data.serviceFee?.maxFee ?? "");

        setVendorPercent((data.pricing?.vendorCommissionPercent ?? 0.1) * 100);
        setRiderPercent((data.pricing?.riderPayoutPercent ?? 0.7) * 100);
      } catch {
        notify("Failed to load config", "error");
      } finally {
        setConfigLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // ── Email ─────────────────────────────────────────────────────────────────
  const requestEmailChange = async () => {
    try {
      setEmailLoading(true);
      notify("");
      await api.post("/admin/settings/email/request", { newEmail });
      setEmailStep("verify");
      notify("Verification token sent to new email", "success");
    } catch (err) {
      notify(err.response?.data?.message || "Request failed", "error");
    } finally {
      setEmailLoading(false);
    }
  };

  const verifyEmailChange = async () => {
    try {
      setEmailLoading(true);
      notify("");
      await api.post("/admin/settings/email/confirm", { token: emailToken });
      notify("Email updated successfully", "success");
      setEmailStep("done");
    } catch (err) {
      notify(err.response?.data?.message || "Verification failed", "error");
    } finally {
      setEmailLoading(false);
    }
  };

  // ── Password ──────────────────────────────────────────────────────────────
  const changePassword = async () => {
    if (newPassword !== confirmPassword) {
      return notify("Passwords do not match", "error");
    }
    try {
      setPasswordLoading(true);
      notify("");
      await api.patch("/admin/settings/password", { currentPassword, newPassword });
      notify("Password updated successfully", "success");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      notify(err.response?.data?.message || "Password update failed", "error");
    } finally {
      setPasswordLoading(false);
    }
  };

  // ── Service fee validation ────────────────────────────────────────────────
  const validateServiceFee = () => {
    const flat = Number(flatFee);
    const perc = Number(percentage);
    const min  = Number(minFee);
    const max  = maxFee !== "" ? Number(maxFee) : null;

    if (flatFee === "" || percentage === "" || minFee === "") {
      notify("Flat fee, percentage and minimum fee are required", "error");
      return false;
    }
    if (flat < 0 || perc < 0 || min < 0 || (max !== null && max < 0)) {
      notify("Values cannot be negative", "error");
      return false;
    }
    if (perc > 100) {
      notify("Percentage cannot exceed 100%", "error");
      return false;
    }
    if (flat === 0 && perc === 0) {
      notify("Flat fee and percentage cannot both be 0", "error");
      return false;
    }
    if (max !== null && min > max) {
      notify("Minimum fee cannot be greater than maximum fee", "error");
      return false;
    }
    return true;
  };

  const updateServiceFee = async () => {
    if (!validateServiceFee()) return;
    try {
      setFeeLoading(true);
      notify("");
      await api.put("/admin/config/service-fee", {
        flatFee:    Number(flatFee),
        percentage: Number(percentage) / 100,
        minFee:     Number(minFee),
        maxFee:     maxFee !== "" ? Number(maxFee) : null,
      });
      notify("Service fee updated successfully", "success");
    } catch (err) {
      notify(err.response?.data?.message || "Failed to update service fee", "error");
    } finally {
      setFeeLoading(false);
    }
  };

  // ── Pricing validation ────────────────────────────────────────────────────
  const validatePricing = () => {
    const vendor = Number(vendorPercent);
    const rider  = Number(riderPercent);

    if (vendorPercent === "" || riderPercent === "") {
      notify("Both vendor commission and rider payout are required", "error");
      return false;
    }
    if (vendor < 0 || rider < 0) {
      notify("Values cannot be negative", "error");
      return false;
    }
    if (vendor > 100 || rider > 100) {
      notify("Percentages cannot exceed 100%", "error");
      return false;
    }
    // Backend allows up to 120% combined (vendor + rider) — mirror that here
    if ((vendor + rider) > 120) {
      notify("Combined vendor + rider payout cannot exceed 120%", "error");
      return false;
    }
    return true;
  };

  const updatePricing = async () => {
    if (!validatePricing()) return;
    try {
      setPricingLoading(true);
      notify("");
      await api.put("/admin/config/pricing", {
        vendorCommissionPercent: Number(vendorPercent) / 100,
        riderPayoutPercent:      Number(riderPercent) / 100,
      });
      notify("Pricing updated successfully", "success");
    } catch (err) {
      notify(err.response?.data?.message || "Failed to update pricing", "error");
    } finally {
      setPricingLoading(false);
    }
  };

  // ── UI ────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl space-y-10">

      <div>
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <p className="text-sm text-gray-500">Manage account security and credentials</p>
      </div>

      {/* EMAIL */}
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
              disabled={emailLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              {emailLoading ? "Sending..." : "Send Verification"}
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
              disabled={emailLoading}
              className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
            >
              {emailLoading ? "Verifying..." : "Verify Email"}
            </button>
          </>
        )}

        {emailStep === "done" && (
          <p className="text-green-600 font-medium">Email updated successfully ✔</p>
        )}
      </div>

      {/* PASSWORD */}
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
          disabled={passwordLoading}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 transition"
        >
          {passwordLoading ? "Updating..." : "Update Password"}
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

      {/* SERVICE FEE */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-lg font-semibold">Service Fee Settings</h2>

        {configLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Flat Fee (₦)</label>
              <input
                type="number"
                placeholder="e.g. 200"
                value={flatFee}
                onChange={e => setFlatFee(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Percentage (%)</label>
              <input
                type="number"
                placeholder="e.g. 5"
                value={percentage}
                onChange={e => setPercentage(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring"
              />
              <p className="text-xs text-gray-400 mt-1">Example: 5 = 5%</p>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Minimum Fee (₦)</label>
              <input
                type="number"
                placeholder="e.g. 200"
                value={minFee}
                onChange={e => setMinFee(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring"
              />
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Maximum Fee (₦) — optional</label>
              <input
                type="number"
                placeholder="Leave blank for no cap"
                value={maxFee}
                onChange={e => setMaxFee(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring"
              />
            </div>

            <button
              onClick={updateServiceFee}
              disabled={feeLoading}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
            >
              {feeLoading ? "Saving..." : "Save Service Fee"}
            </button>
          </>
        )}
      </div>

      {/* PRICING / REVENUE SPLIT */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <h2 className="text-lg font-semibold">Revenue Split</h2>

        {configLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <>
            <div>
              <label className="text-sm text-gray-600 mb-1 block">Vendor Commission (%)</label>
              <input
                type="number"
                placeholder="e.g. 10"
                value={vendorPercent}
                onChange={e => setVendorPercent(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring"
              />
              <p className="text-xs text-gray-400 mt-1">
                Platform takes this % from vendor subtotal. Example: 10 = 10%
              </p>
            </div>

            <div>
              <label className="text-sm text-gray-600 mb-1 block">Rider Payout (%)</label>
              <input
                type="number"
                placeholder="e.g. 70"
                value={riderPercent}
                onChange={e => setRiderPercent(e.target.value)}
                className="w-full px-3 py-2 border rounded focus:ring"
              />
              <p className="text-xs text-gray-400 mt-1">
                Rider gets this % of delivery fee. Example: 70 = 70%
              </p>
            </div>

            <button
              onClick={updatePricing}
              disabled={pricingLoading}
              className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700 transition"
            >
              {pricingLoading ? "Saving..." : "Save Pricing"}
            </button>
          </>
        )}
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