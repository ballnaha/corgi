import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { requireAdmin } from "@/lib/admin-utils";

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์ banner" }, { status: 400 });
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "ไฟล์ต้องเป็นรูปภาพเท่านั้น" },
        { status: 400 }
      );
    }

    // Check file size (max 20MB for banner)
    if (file.size > 20 * 1024 * 1024) {
      return NextResponse.json(
        { error: "ไฟล์ banner ต้องมีขนาดไม่เกิน 20MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const originalName = file.name.replace(/\s+/g, "_");
    const fileExtension = path.extname(originalName);
    const baseName = path.basename(originalName, fileExtension);
    const timestamp = Date.now();
    const uniqueFilename = `${baseName}_${timestamp}${fileExtension}`;

    // Define upload directory
    const uploadDir = path.join(process.cwd(), "public", "uploads", "banners");
    
    // Create directory if it doesn't exist
    try {
      await mkdir(uploadDir, { recursive: true });
    } catch (error) {
      console.error("Error creating upload directory:", error);
    }

    const bannerUrl = `/uploads/banners/${uniqueFilename}`;
    const fullPath = path.join(uploadDir, uniqueFilename);

    try {
      // Process banner image for optimal web display
      // Recommended banner size: 1200x600 (2:1 ratio) for better mobile compatibility
      await sharp(buffer)
        .resize(1200, 600, { 
          fit: 'cover', 
          position: 'center' 
        })
        .jpeg({ 
          quality: 85,
          progressive: true 
        })
        .toFile(fullPath);

      console.log(`Banner uploaded successfully: ${bannerUrl}`);

      return NextResponse.json(
        {
          message: "อัปโหลด banner สำเร็จ",
          bannerUrl: bannerUrl,
        },
        { status: 200 }
      );
    } catch (error) {
      console.error("Error processing banner:", error);
      return NextResponse.json(
        { error: "เกิดข้อผิดพลาดในการประมวลผล banner" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Banner upload error:", error);
    
    if (error.message === "Admin access required") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปโหลด banner" },
      { status: 500 }
    );
  }
}