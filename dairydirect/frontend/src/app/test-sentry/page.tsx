"use client";
import * as Sentry from "@sentry/nextjs";

export default function TestSentryPage() {
  const triggerError = () => {
    throw new Error("Frontend Sentry Test Error");
  };

  const testApiError = async () => {
    try {
      await fetch("/api/test-sentry");
    } catch (e) {
      console.error(e);
    }
  };

  const testLog = () => {
    console.log("This is a test log captured by Sentry Replay/Logs integration.");
    Sentry.captureMessage("Test manual message from frontend");
    alert("Log sent to Sentry!");
  };

  return (
    <div style={{ padding: 40, fontFamily: "sans-serif" }}>
      <h1>Sentry Testing Page</h1>
      <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
        <button
          onClick={triggerError}
          style={{ padding: "10px", background: "#ff4d4f", color: "white", border: "none", cursor: "pointer" }}
        >
          Trigger Frontend Error
        </button>
        <button
          onClick={testApiError}
          style={{ padding: "10px", background: "#1890ff", color: "white", border: "none", cursor: "pointer" }}
        >
          Trigger API Error
        </button>
        <button
          onClick={testLog}
          style={{ padding: "10px", background: "#52c41a", color: "white", border: "none", cursor: "pointer" }}
        >
          Send Test Log
        </button>
      </div>
    </div>
  );
}
