import { useState } from "react";
import api from "../lib/api";

export default function AdminForgotPassword() {
  const [step, setStep] = useState(1);

  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [answers, setAnswers] = useState(["", "", ""]);
  const [resetToken, setResetToken] = useState("");

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  /* ======================
     STEP 1 — REQUEST OTP
  ====================== */
  const requestOtp = async () => {
    try {
      setLoading(true);
      setMessage("");

      await api.post("/admin/auth/forgot-password", { email });

      setStep(2);
      setMessage("OTP sent to admin email");
    } catch (err) {
      setMessage(err.response?.data?.message || "Request failed");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     STEP 2 — VERIFY OTP + SECURITY
  ====================== */
  const verifySecurity = async () => {
    try {
      setLoading(true);
      setMessage("");

      const res = await api.post("/admin/auth/verify-reset", {
        email,
        otp,
        answers,
      });

      setResetToken(res.data.resetToken);
      setStep(3);
    } catch (err) {
      setMessage(err.response?.data?.message || "Verification failed");
    } finally {
      setLoading(false);
    }
  };

  /* ======================
     STEP 3 — RESET PASSWORD
  ====================== */
  const resetPassword = async () => {
    if (newPassword !== confirmPassword) {
      return setMessage("Passwords do not match");
    }

    try {
      setLoading(true);
      setMessage("");

      await api.post("/admin/auth/reset-password", {
        resetToken,
        newPassword,
      });

      setMessage("Password reset successful. You can now log in.");
      setStep(4);
    } catch (err) {
      setMessage(err.response?.data?.message || "Reset failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-md bg-white p-6 rounded-lg shadow">
        <h1 className="text-xl font-bold mb-4">Admin Password Recovery</h1>

        {/* STEP 1 */}
        {step === 1 && (
          <>
            <input
              type="email"
              placeholder="Admin email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-3"
            />

            <button
              onClick={requestOtp}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded"
            >
              Send OTP
            </button>
          </>
        )}

        {/* STEP 2 */}
        {step === 2 && (
          <>
            <input
              placeholder="OTP"
              value={otp}
              onChange={e => setOtp(e.target.value)}
              className="w-full px-3 py-2 border rounded mb-3"
            />

            {answers.map((a, i) => (
              <input
                key={i}
                placeholder={`Security answer ${i + 1}`}
                value={answers[i]}
                onChange={e => {
                  const copy = [...answers];
                  copy[i] = e.target.value;
                  setAnswers(copy);
                }}
                className="w-full px-3 py-2 border rounded mb-3"
              />
            ))}

            <button
              onClick={verifySecurity}
              disabled={loading}
              className="w-full bg-green-600 text-white py-2 rounded"
            >
              Verify & Continue
            </button>
          </>
        )}

        {/* STEP 3 */}
        {step === 3 && (
          <>
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
              onClick={resetPassword}
              disabled={loading}
              className="w-full bg-red-600 text-white py-2 rounded"
            >
              Reset Password
            </button>
          </>
        )}

        {/* DONE */}
        {step === 4 && (
          <p className="text-green-600 font-medium text-center">
            Password reset complete ✔
          </p>
        )}

        {message && (
          <p className="text-sm text-blue-600 mt-4">{message}</p>
        )}
      </div>
    </div>
  );
}
