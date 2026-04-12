"use client";

import React from "react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f4f4ed" }}>
      {children}
    </div>
  );
}
