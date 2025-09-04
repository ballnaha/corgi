import { NextRequest, NextResponse } from "next/server";
import { readFile } from "fs/promises";
import path from "path";

interface RouteParams {
  params: Promise<{ path: string[] }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  const resolvedParams = await params;
  try {
    const imagePath = resolvedParams.path.join('/');
    
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

      return new NextResponse(fileBuffer as unknown as BodyInit, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'X-Content-Type-Options': 'nosniff',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET',
        },
      });
    } catch (fileError) {
      console.error('File not found:', filePath, fileError);
      
      // Try alternative file paths for blog images
      if (imagePath.includes('blog/')) {
        try {
          // Try with different extensions
          const basePath = filePath.replace(/\.[^/.]+$/, '');
          const extensions = ['.jpg', '.jpeg', '.png', '.webp'];
          
          for (const ext of extensions) {
            try {
              const altPath = basePath + ext;
              const altBuffer = await readFile(altPath);
              const contentType = ext === '.png' ? 'image/png' : 'image/jpeg';
              
              return new NextResponse(altBuffer as unknown as BodyInit, {
                status: 200,
                headers: {
                  'Content-Type': contentType,
                  'Cache-Control': 'public, max-age=31536000, immutable',
                  'X-Content-Type-Options': 'nosniff',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET',
                },
              });
            } catch {
              continue;
            }
          }
        } catch {
          // Ignore alternative path attempts
        }
      }
      
      return new NextResponse('Image not found', { status: 404 });
    }
  } catch (error) {
    console.error('Error serving image:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
