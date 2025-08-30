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

    // Determine upload directory based on usage (check if it's for blog)
    const usage = formData.get("usage") as string || "products";
    const oldImageUrl = formData.get("oldImageUrl") as string; // For deleting old image
    const isForBlog = usage === "blog";
    
    const uploadDir = path.join(process.cwd(), "public", "uploads", isForBlog ? "blog" : "products");
    await mkdir(uploadDir, { recursive: true });

    // Delete old image if provided
    if (oldImageUrl && oldImageUrl.startsWith('/uploads/')) {
      try {
        const oldImagePath = path.join(process.cwd(), "public", oldImageUrl);
        await access(oldImagePath); // Check if file exists
        await unlink(oldImagePath); // Delete the file
        console.log(`Deleted old image: ${oldImagePath}`);
      } catch (error) {
        console.log(`Could not delete old image: ${oldImageUrl}`, error);
        // Continue even if deletion fails
      }
    }

    // Process and save images with appropriate aspect ratios
    // For blog, only save large image (1600x900)
    const sizes = isForBlog ? [
      { name: "large", width: 1600, height: 900 }, // 16:9 for blog - only large
    ] : [
      { name: "large", width: 1200, height: 1200 }, // 1:1 for products
    ];

    const savedImages = [];

    for (const size of sizes) {
      let processedBuffer: Buffer = Buffer.from(buffer);
      let sizeFilename = filename;

      // Determine if the original file is PNG to preserve transparency
      const isPNG = file.type === 'image/png';
      const outputExt = isPNG ? '.png' : '.jpg';

      if (size.width && size.height) {
        // Resize image using sharp
        const sharpInstance = sharp(buffer)
          .resize(size.width, size.height, {
            fit: "cover",
            position: "center",
          });

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

        // Add size suffix to filename with correct extension
        const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
        sizeFilename = `${nameWithoutExt}_${size.name}${outputExt}`;
      } else {
        // For original, just optimize without resizing
        if (isPNG) {
          processedBuffer = await sharp(buffer)
            .png({ quality: 90, compressionLevel: 6 })
            .toBuffer();
        } else {
          processedBuffer = await sharp(buffer)
            .jpeg({ quality: 90 })
            .toBuffer();
        }
        
        // Update filename extension if needed
        sizeFilename = filename.replace(/\.[^/.]+$/, outputExt);
      }

      const filePath = path.join(uploadDir, sizeFilename);
      await writeFile(filePath, processedBuffer);

      savedImages.push({
        size: size.name,
        filename: sizeFilename,
        url: `/uploads/${isForBlog ? "blog" : "products"}/${sizeFilename}`,
        width: size.width,
        height: size.height,
      });
    }

    // Return the large image URL as the main URL for easier usage
    const mainImage = savedImages.find(img => img.size === "large") || savedImages[0];
    
    return NextResponse.json({
      success: true,
      url: mainImage.url, // Main URL for blog forms
      images: savedImages,
      message: `อัปโหลดรูปภาพสำเร็จ${isForBlog ? ' (ขนาด 16:9)' : ''}`,
      aspectRatio: isForBlog ? '16:9' : '1:1',
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
