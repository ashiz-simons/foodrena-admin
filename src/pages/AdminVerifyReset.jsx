import { useLocation, useNavigate } from "react-router-dom";
import { useState } from "react";
import api from "../lib/api";

export default function AdminVerifyReset() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const [otp, setOtp] = useState("");
  const [answers, setAnswers] = useState([]);

  if (!state) return <div>Invalid access</div>;

  const submit = async e => {
    e.preventDefault();
    try {
      const res = await api.post("/admin/auth/verify-reset", {
        email: state.email,
        otp,
        answers,
      });

      navigate("/admin/reset-password", {
        state: { resetToken: res.data.resetToken },
      });
    } catch (err) {
      alert(err.response?.data?.message || "Verification failed");
    }
  };

  return (
    <form onSubmit={submit} className="max-w-md mx-auto mt-24 bg-white p-6 rounded shadow">
      <h1 className="text-xl font-bold mb-4">Verify Identity</h1>

      <input
        className="w-full border p-2 mb-4"
        placeholder="OTP"
        value={otp}
        onChange={e => setOtp(e.target.value)}
      />

      {state.questions.map((q, i) => (
        <input
          key={i}
          className="w-full border p-2 mb-3"
          placeholder={q}
          onChange={e => {
            const copy = [...answers];
            copy[i] = e.target.value;
            setAnswers(copy);
          }}
        />
      ))}

      <button className="w-full bg-blue-600 text-white py-2 rounded">
        Verify
      </button>
    </form>
  );
}
