import { useState, useEffect } from "react";
import api from "../lib/api";

export default function AdminSettings() {
  const [newEmail, setNewEmail] = useState("");
  const [emailToken, setEmailToken] = useState("");
  const [emailStep, setEmailStep] = useState("request");

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // ── Food service fee ───────────────────────────────────────────────────────
  const [flatFee, setFlatFee]       = useState("");
  const [percentage, setPercentage] = useState("");
  const [minFee, setMinFee]         = useState("");
  const [maxFee, setMaxFee]         = useState("");

  // ── Food revenue split ─────────────────────────────────────────────────────
  const [vendorPercent, setVendorPercent] = useState("");
  const [riderPercent, setRiderPercent]   = useState("");

  // ── Package pricing ────────────────────────────────────────────────────────
  const [pkgBaseFees, setPkgBaseFees] = useState({
    small: "", medium: "", large: "", xl: "",
  });
  const [pkgFreeWeight, setPkgFreeWeight] = useState({
    small: "", medium: "", large: "", xl: "",
  });
  const [pkgTransport, setPkgTransport] = useState({
    motorcycle: "", car: "", van: "",
  });
  const [pkgWeightSurcharge, setPkgWeightSurcharge] = useState("");
  const [pkgBaseDistanceKm, setPkgBaseDistanceKm]   = useState("");
  const [pkgRatePerKm, setPkgRatePerKm]             = useState("");
  const [pkgRiderPayoutRate, setPkgRiderPayoutRate] = useState("");
  const [pkgMinFee, setPkgMinFee] = useState("");
  const [pkgMaxFee, setPkgMaxFee] = useState("");

  // ── Loading states ─────────────────────────────────────────────────────────
  const [emailLoading, setEmailLoading]       = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [feeLoading, setFeeLoading]           = useState(false);
  const [pricingLoading, setPricingLoading]   = useState(false);
  const [pkgLoading, setPkgLoading]           = useState(false);
  const [configLoading, setConfigLoading]     = useState(false);

  const [message, setMessage]       = useState("");
  const [messageType, setMessageType] = useState("info");

  const notify = (msg, type = "info") => {
    setMessage(msg);
    setMessageType(type);
    if (msg) setTimeout(() => setMessage(""), 5000);
  };

  // ── Load config on mount ───────────────────────────────────────────────────
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setConfigLoading(true);
        const res  = await api.get("/admin/config");
        const data = res.data;

        // Food service fee
        setFlatFee(data.serviceFee?.flatFee ?? 0);
        setPercentage((data.serviceFee?.percentage ?? 0) * 100);
        setMinFee(data.serviceFee?.minFee ?? 0);
        setMaxFee(data.serviceFee?.maxFee ?? "");

        // Food revenue split
        setVendorPercent((data.pricing?.vendorCommissionPercent ?? 0.1) * 100);
        setRiderPercent((data.pricing?.riderPayoutPercent ?? 0.7) * 100);

        // Package pricing
        const pkg = data.packagePricing ?? {};

        setPkgBaseFees({
          small:  pkg.baseFees?.small  ?? 500,
          medium: pkg.baseFees?.medium ?? 900,
          large:  pkg.baseFees?.large  ?? 1400,
          xl:     pkg.baseFees?.xl     ?? 2000,
        });
        setPkgFreeWeight({
          small:  pkg.freeWeightKg?.small  ?? 2,
          medium: pkg.freeWeightKg?.medium ?? 5,
          large:  pkg.freeWeightKg?.large  ?? 15,
          xl:     pkg.freeWeightKg?.xl     ?? 30,
        });
        setPkgTransport({
          motorcycle: pkg.transportMultipliers?.motorcycle ?? 1.0,
          car:        pkg.transportMultipliers?.car        ?? 1.4,
          van:        pkg.transportMultipliers?.van        ?? 1.8,
        });
        setPkgWeightSurcharge(pkg.weightSurchargePerKg ?? 50);
        setPkgBaseDistanceKm(pkg.baseDistanceKm        ?? 3);
        setPkgRatePerKm(pkg.ratePerKm                  ?? 120);
        setPkgRiderPayoutRate((pkg.riderPayoutRate      ?? 0.8) * 100);
        setPkgMinFee(pkg.minFee                         ?? 300);
        setPkgMaxFee(pkg.maxFee                         ?? 25000);
      } catch {
        notify("Failed to load config", "error");
      } finally {
        setConfigLoading(false);
      }
    };
    fetchConfig();
  }, []);

  // ── Email ──────────────────────────────────────────────────────────────────
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

  // ── Password ───────────────────────────────────────────────────────────────
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

  // ── Service fee ────────────────────────────────────────────────────────────
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

  // ── Food revenue split ─────────────────────────────────────────────────────
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
        riderPayoutPercent:      Number(riderPercent)  / 100,
      });
      notify("Pricing updated successfully", "success");
    } catch (err) {
      notify(err.response?.data?.message || "Failed to update pricing", "error");
    } finally {
      setPricingLoading(false);
    }
  };

  // ── Package pricing ────────────────────────────────────────────────────────
  const validatePackagePricing = () => {
    const rate    = Number(pkgRiderPayoutRate);
    const minF    = Number(pkgMinFee);
    const maxF    = Number(pkgMaxFee);
    const distKm  = Number(pkgBaseDistanceKm);
    const perKm   = Number(pkgRatePerKm);
    const wSurch  = Number(pkgWeightSurcharge);

    if (rate < 0 || rate > 100) {
      notify("Rider payout rate must be between 0 and 100%", "error");
      return false;
    }
    if (minF < 0 || maxF < 0) {
      notify("Min/max fee cannot be negative", "error");
      return false;
    }
    if (minF > maxF) {
      notify("Min fee cannot be greater than max fee", "error");
      return false;
    }
    if (distKm < 0 || perKm < 0 || wSurch < 0) {
      notify("Distance and weight values cannot be negative", "error");
      return false;
    }
    for (const [key, val] of Object.entries(pkgBaseFees)) {
      if (Number(val) < 0) {
        notify(`Base fee for "${key}" cannot be negative`, "error");
        return false;
      }
    }
    for (const [key, val] of Object.entries(pkgTransport)) {
      if (Number(val) <= 0) {
        notify(`Transport multiplier for "${key}" must be greater than 0`, "error");
        return false;
      }
    }
    return true;
  };

  const updatePackagePricing = async () => {
    if (!validatePackagePricing()) return;
    try {
      setPkgLoading(true);
      notify("");
      await api.put("/admin/config/package-pricing", {
        baseFees: {
          small:  Number(pkgBaseFees.small),
          medium: Number(pkgBaseFees.medium),
          large:  Number(pkgBaseFees.large),
          xl:     Number(pkgBaseFees.xl),
        },
        freeWeightKg: {
          small:  Number(pkgFreeWeight.small),
          medium: Number(pkgFreeWeight.medium),
          large:  Number(pkgFreeWeight.large),
          xl:     Number(pkgFreeWeight.xl),
        },
        transportMultipliers: {
          motorcycle: Number(pkgTransport.motorcycle),
          car:        Number(pkgTransport.car),
          van:        Number(pkgTransport.van),
        },
        weightSurchargePerKg: Number(pkgWeightSurcharge),
        baseDistanceKm:       Number(pkgBaseDistanceKm),
        ratePerKm:            Number(pkgRatePerKm),
        riderPayoutRate:      Number(pkgRiderPayoutRate) / 100,
        minFee:               Number(pkgMinFee),
        maxFee:               Number(pkgMaxFee),
      });
      notify("Package pricing updated successfully", "success");
    } catch (err) {
      notify(err.response?.data?.message || "Failed to update package pricing", "error");
    } finally {
      setPkgLoading(false);
    }
  };

  // ── Shared input component ─────────────────────────────────────────────────
  const Field = ({ label, hint, value, onChange, placeholder, type = "number" }) => (
    <div>
      <label className="text-sm text-gray-600 mb-1 block">{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full px-3 py-2 border rounded focus:ring focus:outline-none"
      />
      {hint && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
    </div>
  );

  // ── UI ─────────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-3xl space-y-10">

      <div>
        <h1 className="text-2xl font-bold">Admin Settings</h1>
        <p className="text-sm text-gray-500">Manage account security and platform pricing</p>
      </div>

      {/* ── EMAIL ──────────────────────────────────────────────────────────── */}
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

      {/* ── PASSWORD ───────────────────────────────────────────────────────── */}
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

      {/* ── SECURITY ───────────────────────────────────────────────────────── */}
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

      {/* ── SERVICE FEE ────────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Food — Service Fee</h2>
          <p className="text-sm text-gray-400">Charged to customers on every food order</p>
        </div>

        {configLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <>
            <Field label="Flat Fee (₦)" placeholder="e.g. 200"
              value={flatFee} onChange={setFlatFee} />
            <Field label="Percentage (%)" placeholder="e.g. 5"
              hint="Example: 5 = 5%"
              value={percentage} onChange={setPercentage} />
            <Field label="Minimum Fee (₦)" placeholder="e.g. 200"
              value={minFee} onChange={setMinFee} />
            <Field label="Maximum Fee (₦) — optional" placeholder="Leave blank for no cap"
              value={maxFee} onChange={setMaxFee} />
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

      {/* ── REVENUE SPLIT ──────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-xl shadow space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Food — Revenue Split</h2>
          <p className="text-sm text-gray-400">How food order revenue is distributed</p>
        </div>

        {configLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <>
            <Field label="Vendor Commission (%)" placeholder="e.g. 10"
              hint="Platform takes this % from vendor subtotal. Example: 10 = 10%"
              value={vendorPercent} onChange={setVendorPercent} />
            <Field label="Rider Payout (%)" placeholder="e.g. 70"
              hint="Rider gets this % of delivery fee. Example: 70 = 70%"
              value={riderPercent} onChange={setRiderPercent} />
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

      {/* ── PACKAGE PRICING ────────────────────────────────────────────────── */}
      <div className="bg-white p-6 rounded-xl shadow space-y-6">
        <div>
          <h2 className="text-lg font-semibold">Package Delivery — Pricing</h2>
          <p className="text-sm text-gray-400">
            Fee formula: (base fee + weight surcharge + distance charge) × transport
            multiplier, clamped between min and max.
          </p>
        </div>

        {configLoading ? (
          <p className="text-sm text-gray-500">Loading...</p>
        ) : (
          <>
            {/* Base fees by size */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-3">
                Base Fees by Size (₦)
              </p>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { key: "small",  label: "Small (≤ free weight)" },
                  { key: "medium", label: "Medium" },
                  { key: "large",  label: "Large" },
                  { key: "xl",     label: "Extra Large" },
                ].map(({ key, label }) => (
                  <Field key={key} label={label}
                    placeholder="₦"
                    value={pkgBaseFees[key]}
                    onChange={val =>
                      setPkgBaseFees(prev => ({ ...prev, [key]: val }))
                    }
                  />
                ))}
              </div>
            </div>

            {/* Free weight thresholds */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Free Weight Thresholds (kg)
              </p>
              <p className="text-xs text-gray-400 mb-3">
                Weight above these limits incurs a surcharge per kg.
              </p>
              <div className="grid grid-cols-2 gap-4">
                {["small", "medium", "large", "xl"].map(key => (
                  <Field key={key} label={key.charAt(0).toUpperCase() + key.slice(1)}
                    placeholder="kg"
                    value={pkgFreeWeight[key]}
                    onChange={val =>
                      setPkgFreeWeight(prev => ({ ...prev, [key]: val }))
                    }
                  />
                ))}
              </div>
            </div>

            {/* Weight + distance */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Weight Surcharge (₦ per kg over limit)"
                placeholder="e.g. 50"
                hint="Charged per kg above the free threshold"
                value={pkgWeightSurcharge} onChange={setPkgWeightSurcharge} />
              <Field label="Base Distance (km included free)"
                placeholder="e.g. 3"
                hint="Distance included in base fee before per-km charge kicks in"
                value={pkgBaseDistanceKm} onChange={setPkgBaseDistanceKm} />
              <Field label="Rate Per km (₦)"
                placeholder="e.g. 120"
                hint="Charged per km beyond the base distance"
                value={pkgRatePerKm} onChange={setPkgRatePerKm} />
            </div>

            {/* Transport multipliers */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-1">
                Transport Multipliers
              </p>
              <p className="text-xs text-gray-400 mb-3">
                Final fee is multiplied by this value. Motorcycle = 1.0 (no change).
              </p>
              <div className="grid grid-cols-3 gap-4">
                {[
                  { key: "motorcycle", label: "Motorcycle" },
                  { key: "car",        label: "Car" },
                  { key: "van",        label: "Van / Truck" },
                ].map(({ key, label }) => (
                  <Field key={key} label={label}
                    placeholder="e.g. 1.4"
                    value={pkgTransport[key]}
                    onChange={val =>
                      setPkgTransport(prev => ({ ...prev, [key]: val }))
                    }
                  />
                ))}
              </div>
            </div>

            {/* Rider payout + fee bounds */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="Rider Payout (%)"
                placeholder="e.g. 80"
                hint="Rider gets this % of the delivery fee. Example: 80 = 80%"
                value={pkgRiderPayoutRate} onChange={setPkgRiderPayoutRate} />
              <Field label="Minimum Fee (₦)"
                placeholder="e.g. 300"
                value={pkgMinFee} onChange={setPkgMinFee} />
              <Field label="Maximum Fee (₦)"
                placeholder="e.g. 25000"
                value={pkgMaxFee} onChange={setPkgMaxFee} />
            </div>

            <button
              onClick={updatePackagePricing}
              disabled={pkgLoading}
              className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700 transition"
            >
              {pkgLoading ? "Saving..." : "Save Package Pricing"}
            </button>
          </>
        )}
      </div>

      {/* ── MESSAGE TOAST ──────────────────────────────────────────────────── */}
      {message && (
        <div
          className={`text-sm px-4 py-3 rounded ${
            messageType === "success"
              ? "bg-green-50 text-green-700 border border-green-200"
              : messageType === "error"
              ? "bg-red-50 text-red-700 border border-red-200"
              : "bg-blue-50 text-blue-700 border border-blue-200"
          }`}
        >
          {message}
        </div>
      )}
    </div>
  );
}