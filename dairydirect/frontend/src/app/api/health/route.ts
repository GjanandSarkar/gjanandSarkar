import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/db';

export async function GET() {
  try {
    const start = Date.now();
    
    // Perform a lightweight database query to ensure connection is alive
    const { error } = await supabaseAdmin.from('products').select('id').limit(1);
    
    const latency = Date.now() - start;

    if (error) {
      return NextResponse.json({ status: 'error', error: error.message }, { status: 503 });
    }

    return NextResponse.json({ 
      status: 'ok', 
      timestamp: new Date().toISOString(),
      database_latency_ms: latency
    });
  } catch (error: any) {
    return NextResponse.json({ status: 'error', error: error.message }, { status: 500 });
  }
}
