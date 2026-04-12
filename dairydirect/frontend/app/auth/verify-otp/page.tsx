"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, CheckCircle2, AlertTriangle, Lock } from "lucide-react";

const C = {
  green: "#3f6530",
  greenPale: "#c2efac",
  brown: "#8a5025",
  surfaceLow: "#f4f4ed",
  surfaceHi: "#e8e9e2",
  surfaceMid: "#eeeee7",
  greenMint: "#bfedce",
  white: "#ffffff",
  text: "#1a1c18",
  muted: "#43493e",
  faint: "#73796d",
  error: "#ba1a1a",
};

export default function VerifyOTPPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [otpSent, setOtpSent] = useState(false);

  useEffect(() => {
    const phoneParam = searchParams.get("phone");
    if (phoneParam) {
      setPhone(phoneParam);
      setOtpSent(true);
    }
  }, [searchParams]);

  // Countdown timer
  useEffect(() => {
    if (timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleOtpInput = (value: string, index: number) => {
    if (!/^\d*$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setError("");

    // Auto-focus next input
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number,
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleVerifyOTP = async () => {
    const otpCode = otp.join("");

    if (otpCode.length !== 6) {
      setError("Please enter all 6 digits");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/verify-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone, otp: otpCode }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Invalid OTP");
        return;
      }

      // Store token and user data
      localStorage.setItem("authToken", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      sessionStorage.removeItem("tempPhone");

      // Redirect to home or dashboard
      router.push("/");
    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (timeLeft > 180) {
      // Allow resend after 2 minutes
      setError("Please wait before requesting a new OTP");
      return;
    }

    setResendLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/resend-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to resend OTP");
        return;
      }

      // Reset timer
      setTimeLeft(300);
      setOtp(["", "", "", "", "", ""]);
      setError("");
    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: C.surfaceLow }}
    >
      {/* Header */}
      <div className="mb-8 text-center">
        <div
          className="inline-block p-3 rounded-full mb-4"
          style={{ backgroundColor: C.greenPale }}
        >
          <Lock size={32} style={{ color: C.green }} />
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: C.text }}>
          Verify OTP
        </h1>
        <p className="text-sm" style={{ color: C.muted }}>
          Enter the 6-digit code sent to <br />
          <strong>{phone ? `+91 ${phone}` : "your phone"}</strong>
        </p>
      </div>

      {/* Main Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-sm"
        style={{ backgroundColor: C.white }}
      >
        {/* Error Alert */}
        {error && (
          <div
            className="mb-4 p-3 rounded-lg flex gap-2"
            style={{ backgroundColor: "#ffebee" }}
          >
            <AlertCircle
              size={20}
              style={{ color: C.error }}
              className="flex-shrink-0"
            />
            <p className="text-sm" style={{ color: C.error }}>
              {error}
            </p>
          </div>
        )}

        {/* OTP Input Fields */}
        <div className="mb-6">
          <label
            className="block text-sm font-medium mb-4"
            style={{ color: C.text }}
          >
            Enter OTP
          </label>
          <div className="flex gap-2 justify-between mb-4">
            {otp.map((digit, index) => (
              <input
                key={index}
                id={`otp-${index}`}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleOtpInput(e.target.value, index)}
                onKeyDown={(e) => handleKeyDown(e, index)}
                className="w-12 h-12 text-center text-2xl font-bold rounded-lg border-2 transition"
                style={{
                  borderColor: digit ? C.green : C.surfaceHi,
                  backgroundColor: C.surfaceLow,
                  color: C.text,
                }}
              />
            ))}
          </div>
        </div>

        {/* Timer */}
        <div className="text-center mb-6">
          {timeLeft > 0 ? (
            <p className="text-sm" style={{ color: C.muted }}>
              OTP expires in{" "}
              <strong style={{ color: C.green }}>{formatTime(timeLeft)}</strong>
            </p>
          ) : (
            <p className="text-sm" style={{ color: C.error }}>
              OTP has expired. Please request a new one.
            </p>
          )}
        </div>

        {/* Verify Button */}
        <button
          onClick={handleVerifyOTP}
          disabled={loading || otp.join("").length !== 6 || timeLeft <= 0}
          className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          style={{
            backgroundColor:
              otp.join("").length === 6 && !loading && timeLeft > 0
                ? C.green
                : C.surfaceHi,
            color: C.white,
          }}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Verifying...
            </>
          ) : (
            <>
              <CheckCircle2 size={18} />
              Verify OTP
            </>
          )}
        </button>

        {/* Resend OTP */}
        <div className="mt-6 text-center">
          <p className="text-sm" style={{ color: C.muted }} className="mb-2">
            Didn't receive the code?
          </p>
          <button
            onClick={handleResendOTP}
            disabled={resendLoading || timeLeft > 180}
            className="text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed transition"
            style={{ color: C.green }}
          >
            {resendLoading ? "Sending..." : "Resend OTP"}
          </button>
          {timeLeft > 180 && (
            <p className="text-xs mt-2" style={{ color: C.faint }}>
              (Wait {Math.ceil((timeLeft - 180) / 60)} more minute(s))
            </p>
          )}
        </div>

        {/* Help Text */}
        <div
          className="mt-6 p-4 rounded-lg text-xs"
          style={{ backgroundColor: C.surfaceLow }}
        >
          <div className="flex gap-2">
            <AlertTriangle
              size={16}
              style={{ color: C.brown }}
              className="flex-shrink-0"
            />
            <p style={{ color: C.muted }}>
              Don't share this code with anyone. DairyDirect staff will never
              ask for your OTP.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
