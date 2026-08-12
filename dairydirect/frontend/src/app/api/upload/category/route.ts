import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  // Delegate to /api/upload/image with folder='/admin/categories', role='admin', entityType='category'
  try {
    const url = new URL('/api/upload/image', request.url);
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      if (!formData.get('folder')) formData.set('folder', '/admin/categories');
      if (!formData.get('role')) formData.set('role', 'admin');
      if (!formData.get('entityType')) formData.set('entityType', 'category');

      const forwardReq = new NextRequest(url, {
        method: 'POST',
        headers: request.headers,
        body: formData,
      });
      const { POST: uploadHandler } = await import('../image/route');
      return uploadHandler(forwardReq);
    } else {
      const body = await request.json();
      body.folder = body.folder || '/admin/categories';
      body.role = body.role || 'admin';
      body.entityType = body.entityType || 'category';

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
      { success: false, error: error.message || 'Failed to upload category image' },
      { status: 500 }
    );
  }
}
