import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

const IMAGEKIT_PRIVATE_KEY = process.env.IMAGEKIT_PRIVATE_KEY || 'private_MvcOlskPCF+H+NKn9TfD+lhFZso=';

export async function GET(request: NextRequest) {
  try {
    const token = crypto.randomUUID();
    const expire = Math.floor(Date.now() / 1000) + 1800; // 30 minutes
    const signature = crypto
      .createHmac('sha1', IMAGEKIT_PRIVATE_KEY)
      .update(token + expire)
      .digest('hex');

    return NextResponse.json({
      token,
      expire,
      signature,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to generate ImageKit auth params' },
      { status: 500 }
    );
  }
}
