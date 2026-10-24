import { NextResponse } from 'next/server';
import ImageKit from '@imagekit/nodejs';
import { extractTokenFromRequest, verifyAccessToken } from '@/lib/auth/jwt';
import { getAdminSupabase } from '@/lib/supabase/admin';
import { getAuthUser } from '@/lib/api/auth-middleware';

export async function POST(request: Request) {
  try {
    // 1. Extract & verify user authentication (supports JWT, Supabase bearer, cookies)
    const token = extractTokenFromRequest(request);
    let userId: string | null = null;

    if (token) {
      const payload = await verifyAccessToken(token);
      if (payload?.userId) userId = payload.userId;
    }

    if (!userId) {
      const authHeader = request.headers.get('authorization');
      if (authHeader?.startsWith('Bearer ')) {
        const candidateToken = authHeader.substring(7);
        try {
          const supabase = getAdminSupabase();
          const { data: { user } } = await supabase.auth.getUser(candidateToken);
          if (user) userId = user.id;
        } catch (e) {
          // Token verification fallback failed
        }
      }
    }

    // Universal auth user fallback
    if (!userId) {
      try {
        const authUser = await getAuthUser(request);
        if (authUser?.userId) userId = authUser.userId;
      } catch (e) {
        // Fallback failed
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized. Please log in.' }, { status: 401 });
    }

    // 2. Parse request body (supports both multipart/form-data and JSON)
    const contentType = request.headers.get('content-type') || '';
    let filePayload: string | null = null;
    let fileName: string | undefined;
    let folder = '/returns_evidence';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const fileEntry = formData.get('file');
      fileName = (formData.get('fileName') as string) || undefined;
      const folderParam = formData.get('folder');
      if (folderParam) folder = String(folderParam);

      if (fileEntry instanceof File) {
        const arrayBuffer = await fileEntry.arrayBuffer();
        filePayload = Buffer.from(arrayBuffer).toString('base64');
        if (!fileName) fileName = fileEntry.name;
      } else if (typeof fileEntry === 'string') {
        filePayload = fileEntry;
      }
    } else {
      const body = await request.json().catch(() => null);
      if (body) {
        filePayload = body.file || null;
        fileName = body.fileName;
        if (body.folder) folder = body.folder;
      }
    }

    if (!filePayload) {
      return NextResponse.json({ error: 'Image file content is required.' }, { status: 400 });
    }

    const file = filePayload;

    // 3. Get ImageKit Private Key
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;

    if (!privateKey) {
      console.error('[ImageKit Error] IMAGEKIT_PRIVATE_KEY environment variable is not set.');
      return NextResponse.json({
        error: 'ImageKit configuration missing. Please set IMAGEKIT_PRIVATE_KEY in your environment variables (.env.local).'
      }, { status: 500 });
    }

    // 4. Initialize ImageKit SDK
    const imagekit = new ImageKit({
      privateKey: privateKey,
    });

    // 5. Clean & normalize folder path under /dairydirect hierarchy
    let targetFolder = folder ? String(folder).trim() : 'profiles';
    if (!targetFolder.startsWith('/')) {
      targetFolder = `/${targetFolder}`;
    }
    if (!targetFolder.startsWith('/dairydirect')) {
      targetFolder = `/dairydirect${targetFolder}`;
    }

    const safeFileName = fileName || `file_${userId}_${Date.now()}.png`;

    // 6. Upload to ImageKit
    const uploadResponse = await imagekit.files.upload({
      file: file, // base64 string or binary URL
      fileName: safeFileName,
      folder: targetFolder,
      useUniqueFileName: true,
    });

    if (!uploadResponse || !uploadResponse.url) {
      return NextResponse.json({ error: 'Failed to obtain upload URL from ImageKit' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: uploadResponse.url,
      fileId: uploadResponse.fileId,
      name: uploadResponse.name,
    });

  } catch (error: any) {
    console.error('[ImageKit API Upload Error]:', error);
    return NextResponse.json({
      error: error.message || 'Failed to upload image to ImageKit'
    }, { status: 500 });
  }
}
