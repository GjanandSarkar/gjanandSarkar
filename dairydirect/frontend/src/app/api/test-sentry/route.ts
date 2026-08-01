import { NextResponse } from "next/server";

export async function GET() {
  throw new Error("Backend Sentry Test API Error");
  return NextResponse.json({ success: true });
}
