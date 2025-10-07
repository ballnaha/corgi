import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir, unlink, access } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { requireAdmin } from "@/lib/admin-utils";
import { isLocalStorageAvailable, logStorageInfo } from "@/lib/upload-storage";

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    await requireAdmin();

    // Log storage configuration (only in development)
    if (process.env.NODE_ENV === 'development') {
      await logStorageInfo();
    }

    // Check if local storage is available
    const storageAvailable = await isLocalStorageAvailable();
    if (!storageAvailable) {
      console.error('❌ Local storage is not available. Please check permissions or use cloud storage.');
    }

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

    // Determine upload directory based on usage
    const usage = formData.get("usage") as string || "products";
    const oldImageUrl = formData.get("oldImageUrl") as string; // For deleting old image
    const isForBlog = usage === "blog";
    const isForBannerCustom = usage === "banner-custom";
    
    let uploadDir: string;
    if (isForBlog) {
      uploadDir = path.join(process.cwd(), "public", "uploads", "blog");
    } else if (isForBannerCustom) {
      uploadDir = path.join(process.cwd(), "public", "uploads", "banners");
    } else {
      uploadDir = path.join(process.cwd(), "public", "uploads", "products");
    }
    
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
    let sizes: Array<{ name: string; width: number; height: number }> = [];
    
    if (isForBlog) {
      sizes = [
        { name: "large", width: 1600, height: 900 }, // 16:9 for blog - only large
      ];
    } else if (isForBannerCustom) {
      sizes = [
        { name: "large", width: 800, height: 800 }, // Larger size for banner custom images
      ];
    } else {
      sizes = [
        { name: "large", width: 1200, height: 1200 }, // 1:1 for products
      ];
    }

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
      
      // Log successful upload in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ Saved image: ${filePath}`);
      }

      let uploadPath: string;
      if (isForBlog) {
        uploadPath = "/uploads/blog";
      } else if (isForBannerCustom) {
        uploadPath = "/uploads/banners";
      } else {
        uploadPath = "/uploads/products";
      }

      savedImages.push({
        size: size.name,
        filename: sizeFilename,
        url: `${uploadPath}/${sizeFilename}`,
        width: size.width,
        height: size.height,
      });
    }

    // Return the large image URL as the main URL for easier usage
    const mainImage = savedImages.find(img => img.size === "large") || savedImages[0];
    
    // Log upload success
    console.log(`✅ Upload successful: ${mainImage.url}`);
    
    let message: string;
    let aspectRatio: string;
    
    if (isForBlog) {
      message = 'อัปโหลดรูปภาพสำเร็จ (ขนาด 16:9)';
      aspectRatio = '16:9';
    } else if (isForBannerCustom) {
      message = 'อัปโหลดรูปภาพ Banner สำเร็จ (ขนาด 800x800px)';
      aspectRatio = '1:1';
    } else {
      message = 'อัปโหลดรูปภาพสำเร็จ';
      aspectRatio = '1:1';
    }
    
    return NextResponse.json({
      success: true,
      url: mainImage.url, // Main URL for forms
      images: savedImages,
      message: message,
      aspectRatio: aspectRatio,
    });
  } catch (error: any) {
    console.error("❌ Error uploading image:", error);
    console.error("Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code
    });

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
