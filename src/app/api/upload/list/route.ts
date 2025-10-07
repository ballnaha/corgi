import { NextRequest, NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    
    const result: any = {
      timestamp: new Date().toISOString(),
      uploadsPath: uploadsDir,
      directories: {},
      totalFiles: 0,
      totalSize: 0,
    };

    // Check each subdirectory
    const subdirs = ['products', 'blog', 'banners', 'payment-slips'];
    
    for (const subdir of subdirs) {
      const dirPath = path.join(uploadsDir, subdir);
      
      try {
        const files = await readdir(dirPath);
        const fileDetails = [];
        let dirSize = 0;

        for (const file of files) {
          if (file === '.gitkeep') continue;
          
          const filePath = path.join(dirPath, file);
          const stats = await stat(filePath);
          
          fileDetails.push({
            name: file,
            size: stats.size,
            sizeKB: (stats.size / 1024).toFixed(2),
            created: stats.birthtime,
            modified: stats.mtime,
            url: `/uploads/${subdir}/${file}`,
          });
          
          dirSize += stats.size;
          result.totalFiles++;
        }

        result.directories[subdir] = {
          path: dirPath,
          fileCount: fileDetails.length,
          totalSize: dirSize,
          totalSizeKB: (dirSize / 1024).toFixed(2),
          totalSizeMB: (dirSize / 1024 / 1024).toFixed(2),
          files: fileDetails.slice(0, 10), // Show first 10 files
        };
        
        result.totalSize += dirSize;
      } catch (error: any) {
        result.directories[subdir] = {
          error: error.message,
          exists: false,
        };
      }
    }

    result.totalSizeKB = (result.totalSize / 1024).toFixed(2);
    result.totalSizeMB = (result.totalSize / 1024 / 1024).toFixed(2);

    return NextResponse.json(result, { status: 200 });
  } catch (error: any) {
    console.error("Error listing uploads:", error);
    return NextResponse.json(
      { 
        error: "เกิดข้อผิดพลาด", 
        details: error.message,
        cwd: process.cwd(),
      },
      { status: 500 }
    );
  }
}
