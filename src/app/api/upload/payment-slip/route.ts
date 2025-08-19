import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import sharp from "sharp";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.lineUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("paymentSlip") as File;

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
    const userIdShort = session.user.id?.slice(-8) || 'user';
    const originalName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_");
    const filename = `payment_${userIdShort}_${timestamp}_${originalName}`;

    // Create upload directory if it doesn't exist
    const uploadDir = path.join(process.cwd(), "public", "uploads", "payment-slips");
    await mkdir(uploadDir, { recursive: true });

    // Process and save only large size image
    let processedBuffer = buffer;
    
    // Determine if the original file is PNG to preserve transparency
    const isPNG = file.type === 'image/png';
    const outputExt = isPNG ? '.png' : '.jpg';

    // Resize image to large size (1200x1600) using sharp
    const sharpInstance = sharp(buffer)
      .resize(1200, 1600, {
        fit: "inside", // Keep aspect ratio, fit within dimensions
        withoutEnlargement: true, // Don't enlarge small images
      });

    if (isPNG) {
      // Preserve PNG format and transparency
      processedBuffer = await sharpInstance
        .png({ quality: 90, compressionLevel: 6 })
        .toBuffer();
    } else {
      // Convert to JPEG for other formats
      processedBuffer = await sharpInstance
        .jpeg({ quality: 90 })
        .toBuffer();
    }

    // Create final filename with correct extension
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, "");
    const finalFilename = `${nameWithoutExt}_large${outputExt}`;

    const filePath = path.join(uploadDir, finalFilename);
    await writeFile(filePath, processedBuffer);

    const imageUrl = `/uploads/payment-slips/${finalFilename}`;

    return NextResponse.json({
      success: true,
      paymentSlipUrl: imageUrl,
      paymentSlipFileName: finalFilename,
      displayUrl: imageUrl, // Same as paymentSlipUrl since we only have one size
      message: "อัปโหลดรูปหลักฐานการโอนเงินสำเร็จ",
    });

  } catch (error: any) {
    console.error("Error uploading payment slip:", error);

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการอัปโหลดรูปหลักฐานการโอนเงิน" },
      { status: 500 }
    );
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
};
