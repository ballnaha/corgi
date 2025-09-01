import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";
import { headers } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    const imagePath = params.path.join('/');
    
    // Security check: prevent directory traversal
    if (imagePath.includes('..') || imagePath.includes('\\')) {
      return new NextResponse('Forbidden', { status: 403 });
    }

    // Determine the file path
    let filePath: string;
    
    if (imagePath.startsWith('uploads/')) {
      // For uploads/products/image.jpg or uploads/blog/image.jpg
      filePath = path.join(process.cwd(), 'public', imagePath);
    } else {
      // For other images in public/images/
      filePath = path.join(process.cwd(), 'public', 'images', imagePath);
    }

    try {
      const fileBuffer = await readFile(filePath);
      
      // Determine content type based on file extension
      const ext = path.extname(imagePath).toLowerCase();
      let contentType = 'image/jpeg'; // default
      
      switch (ext) {
        case '.png':
          contentType = 'image/png';
          break;
        case '.jpg':
        case '.jpeg':
          contentType = 'image/jpeg';
          break;
        case '.gif':
          contentType = 'image/gif';
          break;
        case '.webp':
          contentType = 'image/webp';
          break;
        case '.svg':
          contentType = 'image/svg+xml';
          break;
      }

      return new NextResponse(fileBuffer, {
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
        },
      });
    } catch (fileError) {
      console.error('File not found:', filePath, fileError);
      return new NextResponse('Image not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
