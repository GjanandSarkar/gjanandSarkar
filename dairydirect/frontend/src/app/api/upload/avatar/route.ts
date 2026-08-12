import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const url = new URL('/api/upload/image', request.url);
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      if (!formData.get('entityType')) formData.set('entityType', 'avatar');
      if (!formData.get('category')) formData.set('category', 'avatars');

      const forwardReq = new NextRequest(url, {
        method: 'POST',
        headers: request.headers,
        body: formData,
      });
      const { POST: uploadHandler } = await import('../image/route');
      return uploadHandler(forwardReq);
    } else {
      const body = await request.json();
      body.entityType = body.entityType || 'avatar';
      body.category = body.category || 'avatars';

      const forwardReq = new NextRequest(url, {
        method: 'POST',
        headers: request.headers,
        body: JSON.stringify(body),
      });
      const { POST: uploadHandler } = await import('../image/route');
      return uploadHandler(forwardReq);
    }
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to upload avatar' },
      { status: 500 }
    );
  }
}
