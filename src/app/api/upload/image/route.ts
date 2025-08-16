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

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    await mkdir(uploadDir, { recursive: true });

    // Process and save only large size with 3:4 aspect ratio
    const sizes = [
      { name: "large", width: 1200, height: 1200 }, 
    ];

    const savedImages = [];

    for (const size of sizes) {
      let processedBuffer = buffer;
      let sizeFilename = filename;

      if (size.width && size.height) {
        // Resize image using sharp
        processedBuffer = await sharp(buffer)
          .resize(size.width, size.height, {
            fit: "cover",
            position: "center",
          })
          .jpeg({ quality: 85 })
          .toBuffer();

        // Add size suffix to filename
        const ext = path.extname(filename);
        const nameWithoutExt = filename.replace(ext, "");
        sizeFilename = `${nameWithoutExt}_${size.name}${ext}`;
      } else {
        // For original, just optimize without resizing
        processedBuffer = await sharp(buffer).jpeg({ quality: 90 }).toBuffer();
      }

      const filePath = path.join(uploadDir, sizeFilename);
      await writeFile(filePath, processedBuffer);

      savedImages.push({
        size: size.name,
        filename: sizeFilename,
        url: `/uploads/products/${sizeFilename}`,
        width: size.width,
        height: size.height,
      });
    }

    return NextResponse.json({
      success: true,
      images: savedImages,
      message: "อัปโหลดรูปภาพสำเร็จ",
    });
  } catch (error: any) {
    console.error("Error uploading image:", error);

    // Handle admin authorization error
    if (error.message === "Unauthorized: Admin access required") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการอัปโหลดรูปภาพ" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
