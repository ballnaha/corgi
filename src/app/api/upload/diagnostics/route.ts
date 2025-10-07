import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-utils";
import { isLocalStorageAvailable, isServerless, getUploadDir } from "@/lib/upload-storage";
import { access, constants } from "fs/promises";
import path from "path";

export async function GET(request: NextRequest) {
  try {
    // Check admin authorization
    await requireAdmin();

    const diagnostics = {
      timestamp: new Date().toISOString(),
      environment: {
        nodeEnv: process.env.NODE_ENV,
        isServerless: isServerless(),
        platform: process.platform,
        cwd: process.cwd(),
      },
      storage: {
        localStorageAvailable: await isLocalStorageAvailable(),
        uploadDirs: {} as Record<string, any>,
      },
      recommendations: [] as string[],
    };

    // Check each upload directory
    const dirs = ['products', 'blog', 'banners', 'payment-slips'] as const;
    
    for (const dir of dirs) {
      const uploadDir = getUploadDir(dir);
      const dirInfo: any = {
        path: uploadDir,
        exists: false,
        writable: false,
        readable: false,
      };

      try {
        await access(uploadDir, constants.F_OK);
        dirInfo.exists = true;

        try {
          await access(uploadDir, constants.R_OK);
          dirInfo.readable = true;
        } catch {}

        try {
          await access(uploadDir, constants.W_OK);
          dirInfo.writable = true;
        } catch {}
      } catch {
        dirInfo.exists = false;
      }

      diagnostics.storage.uploadDirs[dir] = dirInfo;
    }

    // Generate recommendations
    if (diagnostics.environment.isServerless) {
      diagnostics.recommendations.push(
        "⚠️ You are running in a serverless environment. File uploads will NOT persist.",
        "Recommended: Use cloud storage (Vercel Blob, Cloudinary, S3)"
      );
    }

    if (!diagnostics.storage.localStorageAvailable) {
      diagnostics.recommendations.push(
        "❌ Local storage is not available or writable",
        "Check directory permissions: chmod -R 755 public/uploads",
        "Check directory ownership: chown -R [web-server-user] public/uploads"
      );
    }

    for (const [dir, info] of Object.entries(diagnostics.storage.uploadDirs)) {
      if (!info.exists) {
        diagnostics.recommendations.push(
          `❌ Directory missing: ${dir} - Run: mkdir -p public/uploads/${dir}`
        );
      } else if (!info.writable) {
        diagnostics.recommendations.push(
          `❌ Directory not writable: ${dir} - Run: chmod 755 public/uploads/${dir}`
        );
      }
    }

    if (diagnostics.recommendations.length === 0) {
      diagnostics.recommendations.push("✅ All systems operational!");
    }

    return NextResponse.json(diagnostics, { status: 200 });
  } catch (error: any) {
    console.error("Error in upload diagnostics:", error);

    if (error.message === "Unauthorized: Admin access required") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการเข้าถึง" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาด", details: error.message },
      { status: 500 }
    );
  }
}
