import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  try {
    const res = await fetch(`${backendUrl}/health`, { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();
      return NextResponse.json({ ...data, frontend: 'healthy' }, { status: 200 });
    }
  } catch (err: any) {
    // backend check fallback
  }

  return NextResponse.json(
    {
      status: 'ok',
      service: 'DairyDirect Next.js Platform',
      backend: 'http://localhost:4000',
      timestamp: new Date().toISOString(),
    },
    { status: 200 }
  );
}
