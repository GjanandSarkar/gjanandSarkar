export interface ImageKitUploadResult {
  success: boolean;
  url?: string;
  fileId?: string;
  error?: string;
}

export type ImageKitFolder =
  | 'profiles'
  | 'products'
  | 'categories'
  | 'banners'
  | 'quality-reports'
  | 'claims'
  | 'sellers'
  | (string & {});

/**
 * Helper to upload an image file to ImageKit via our backend API route
 * All uploads are automatically organized under /dairydirect/{folder} hierarchy.
 */
export async function uploadImageToImageKit(
  file: File,
  folder: ImageKitFolder = 'profiles'
): Promise<ImageKitUploadResult> {
  try {
    // 1. Convert file to Base64
    const base64Data = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });

    // 2. Post to backend upload endpoint
    const response = await fetch('/api/upload/imagekit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: base64Data,
        fileName: file.name,
        folder: folder,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Image upload failed',
      };
    }

    return {
      success: true,
      url: data.url,
      fileId: data.fileId,
    };
  } catch (err: any) {
    console.error('[ImageKit Helper Error]:', err);
    return {
      success: false,
      error: err.message || 'Error processing image file for upload',
    };
  }
}
