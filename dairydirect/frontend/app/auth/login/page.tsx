"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Phone, CheckCircle2, ArrowRight } from "lucide-react";
import Image from "next/image";

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

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, "");
    if (cleaned.length <= 10) {
      return cleaned;
    }
    return cleaned.slice(0, 10);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    setPhone(formatted);
    setError("");
  };

  const handleRequestOTP = async () => {
    if (!phone || phone.length !== 10) {
      setError("Please enter a valid 10-digit phone number");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_BASE_URL}/auth/request-otp`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone }),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to send OTP");
        return;
      }

      // Store phone temporarily for OTP verification
      sessionStorage.setItem("tempPhone", phone);
      setOtpSent(true);

      // Redirect to OTP verification page
      router.push(`/auth/verify-otp?phone=${phone}`);
    } catch (err) {
      setError("Network error. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ backgroundColor: C.surfaceLow }}
    >
      {/* Logo/Header */}
      <div className="mb-8 text-center">
        <div
          className="inline-block p-3 rounded-full mb-4"
          style={{ backgroundColor: C.greenPale }}
        >
          <Phone size={32} style={{ color: C.green }} />
        </div>
        <h1 className="text-3xl font-bold mb-2" style={{ color: C.text }}>
          DairyDirect
        </h1>
        <p className="text-sm" style={{ color: C.muted }}>
          Fresh dairy delivered to your doorstep
        </p>
      </div>

      {/* Main Card */}
      <div
        className="w-full max-w-sm rounded-2xl p-6 shadow-sm"
        style={{ backgroundColor: C.white }}
      >
        <h2 className="text-2xl font-bold mb-2" style={{ color: C.text }}>
          Welcome Back
        </h2>
        <p className="text-sm mb-6" style={{ color: C.muted }}>
          Enter your phone number to continue
        </p>

        {/* Error Message */}
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

        {/* Phone Input */}
        <div className="mb-4">
          <label
            className="block text-sm font-medium mb-2"
            style={{ color: C.text }}
          >
            Phone Number
          </label>
          <div
            className="flex items-center gap-2 p-3 rounded-lg"
            style={{ backgroundColor: C.surfaceLow }}
          >
            <span style={{ color: C.muted }}>+91</span>
            <input
              type="tel"
              inputMode="numeric"
              placeholder="Enter 10-digit number"
              value={phone}
              onChange={handlePhoneChange}
              maxLength={10}
              className="flex-1 bg-transparent outline-none text-lg"
              style={{ color: C.text }}
            />
          </div>
          <p className="text-xs mt-2" style={{ color: C.faint }}>
            We'll send you a one-time password (OTP) to verify your account
          </p>
        </div>

        {/* Request OTP Button */}
        <button
          onClick={handleRequestOTP}
          disabled={loading || phone.length !== 10}
          className="w-full py-3 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition"
          style={{
            backgroundColor:
              phone.length === 10 && !loading ? C.green : C.surfaceHi,
            color: C.white,
          }}
        >
          {loading ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Sending OTP...
            </>
          ) : (
            <>
              Send OTP <ArrowRight size={18} />
            </>
          )}
        </button>

        {/* Divider */}
        <div className="my-6 flex items-center gap-2">
          <div style={{ flex: 1, height: 1, backgroundColor: C.surfaceHi }} />
          <span style={{ color: C.faint, fontSize: "0.75rem" }}>OR</span>
          <div style={{ flex: 1, height: 1, backgroundColor: C.surfaceHi }} />
        </div>

        {/* Info Box */}
        <div
          className="p-4 rounded-lg text-sm"
          style={{ backgroundColor: C.surfaceLow }}
        >
          <div className="flex gap-2 mb-2">
            <CheckCircle2
              size={18}
              style={{ color: C.green }}
              className="flex-shrink-0"
            />
            <p style={{ color: C.text }}>
              <strong>First time?</strong> We'll create your account
              automatically
            </p>
          </div>
          <div className="flex gap-2">
            <CheckCircle2
              size={18}
              style={{ color: C.green }}
              className="flex-shrink-0"
            />
            <p style={{ color: C.text }}>
              <strong>Secure:</strong> OTP valid for 5 minutes
            </p>
          </div>
        </div>

        {/* Footer Text */}
        <p className="text-xs text-center mt-6" style={{ color: C.faint }}>
          By continuing, you agree to our <br />
          <a href="#" className="underline" style={{ color: C.green }}>
            Terms of Service
          </a>{" "}
          and{" "}
          <a href="#" className="underline" style={{ color: C.green }}>
            Privacy Policy
          </a>
        </p>
      </div>
    </div>
  );
}
