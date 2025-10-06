import { NextRequest, NextResponse } from "next/server";
import { unlink } from "fs/promises";
import path from "path";
import { requireAdmin } from "@/lib/admin-utils";

export async function DELETE(request: NextRequest) {
  try {
    // Check admin authorization
    await requireAdmin();

    const { filePath } = await request.json();

    if (!filePath) {
      return NextResponse.json({ error: "ไม่พบเส้นทางไฟล์" }, { status: 400 });
    }

    // Validate file path (must be in uploads directory)
    if (!filePath.startsWith('/uploads/')) {
      return NextResponse.json({ 
        error: "ไม่สามารถลบไฟล์นอกโฟลเดอร์ uploads ได้" 
      }, { status: 400 });
    }

    // Convert to absolute path
    const fullPath = path.join(process.cwd(), "public", filePath);

    try {
      // Delete the file
      await unlink(fullPath);
      
      console.log(`File deleted successfully: ${filePath}`);

      return NextResponse.json(
        {
          message: "ลบไฟล์สำเร็จ",
          filePath: filePath,
        },
        { status: 200 }
      );
    } catch (error: any) {
      // If file doesn't exist, consider it successful
      if (error.code === 'ENOENT') {
        console.log(`File not found (already deleted): ${filePath}`);
        return NextResponse.json(
          {
            message: "ไฟล์ไม่พบ (อาจถูกลบไปแล้ว)",
            filePath: filePath,
          },
          { status: 200 }
        );
      }

      console.error("Error deleting file:", error);
      return NextResponse.json(
        { error: "เกิดข้อผิดพลาดในการลบไฟล์" },
        { status: 500 }
      );
    }
  } catch (error: any) {
    console.error("Delete file error:", error);
    
    if (error.message === "Admin access required") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์เข้าถึง" },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบไฟล์" },
      { status: 500 }
    );
  }
}