import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink, access } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { requireAdmin } from "@/lib/admin-utils";

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    await requireAdmin();

    const formData = await request.formData();
    const file = formData.get("image") as File;
    const oldImageUrl = formData.get("oldImageUrl") as string; // For deleting old image

    if (!file) {
      return NextResponse.json({ error: "ไม่พบไฟล์รูปภาพ" }, { status: 400 });
    }

    // Check file type
    if (!file.type.startsWith("image/")) {
      return NextResponse.json(
        { error: "ไฟล์ต้องเป็นรูปภาพเท่านั้น" },
        { status: 400 }
      );
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "ไฟล์รูปภาพต้องมีขนาดไม่เกิน 10MB" },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create unique filename
    const timestamp = Date.now();
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `${timestamp}_${originalName}`;

    // Create blog upload directory
    const uploadDir = path.join(process.cwd(), "public", "uploads", "blog");
    await mkdir(uploadDir, { recursive: true });

    // Delete old image if provided
    if (oldImageUrl && oldImageUrl.startsWith('/uploads/')) {
      try {
        const oldImagePath = path.join(process.cwd(), "public", oldImageUrl);
        await access(oldImagePath); // Check if file exists
        await unlink(oldImagePath); // Delete the file
        console.log(`Deleted old blog image: ${oldImagePath}`);
      } catch (error) {
        console.log(`Could not delete old blog image: ${oldImageUrl}`, error);
        // Continue even if deletion fails
      }
    }

    // Process and save large image only (1600x900 - 16:9 aspect ratio)
    const size = { name: "large", width: 1600, height: 900 };

    // Determine if the original file is PNG to preserve transparency
    const isPNG = file.type === 'image/png';
    const outputExt = isPNG ? '.png' : '.jpg';

    // Resize image using sharp
    const sharpInstance = sharp(buffer)
      .resize(size.width, size.height, {
        fit: "cover",
        position: "center",
      });

    let processedBuffer: Buffer;
    if (isPNG) {
      // Preserve PNG format and transparency
      processedBuffer = await sharpInstance
        .png({ quality: 85, compressionLevel: 6 })
        .toBuffer();
    } else {
      // Convert to JPEG for other formats
      processedBuffer = await sharpInstance
        .jpeg({ quality: 85 })
        .toBuffer();
    }

    // Create filename with size suffix and correct extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    const sizeFilename = `${nameWithoutExt}_${size.name}${outputExt}`;

    const filePath = path.join(uploadDir, sizeFilename);
    await writeFile(filePath, processedBuffer);

    const imageInfo = {
      size: size.name,
      filename: sizeFilename,
      url: `/uploads/blog/${sizeFilename}`,
      width: size.width,
      height: size.height,
    };

    return NextResponse.json({
      success: true,
      url: imageInfo.url, // Main URL for blog forms
      image: imageInfo,
      message: "อัปโหลดรูปภาพบล็อกเรียบร้อย (ขนาด 16:9)",
      aspectRatio: "16:9",
    });
  } catch (error: any) {
    console.error("Error uploading blog image:", error);

    // Handle admin authorization error
    if (error.message === "Unauthorized: Admin access required") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการอัปโหลดรูปภาพ" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพบล็อก" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
