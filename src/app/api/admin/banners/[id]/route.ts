import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-utils";
import { prisma } from "@/lib/prisma";

// GET - ดึง banner ตาม ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const banner = await prisma.banner.findUnique({
      where: { id: params.id }
    });

    if (!banner) {
      return NextResponse.json(
        { error: "ไม่พบ banner ที่ระบุ" },
        { status: 404 }
      );
    }

    return NextResponse.json(banner);
  } catch (error: any) {
    console.error('Error fetching banner:', error);
    
    if (error.message === "Unauthorized: Admin access required") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการเข้าถึง" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล banner" },
      { status: 500 }
    );
  }
}

// PATCH - อัปเดต banner
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    const body = await request.json();
    
    const { title, subtitle, imageUrl, imageAlt, background, linkUrl, isActive, sortOrder } = body;

    // ตรวจสอบว่า banner มีอยู่จริง
    const existingBanner = await prisma.banner.findUnique({
      where: { id: params.id }
    });

    if (!existingBanner) {
      return NextResponse.json(
        { error: "ไม่พบ banner ที่ระบุ" },
        { status: 404 }
      );
    }

    // อัปเดตเฉพาะฟิลด์ที่ส่งมา
    const updateData: any = {};
    
    if (title !== undefined) updateData.title = title.trim();
    if (subtitle !== undefined) updateData.subtitle = subtitle?.trim() || null;
    if (imageUrl !== undefined) updateData.imageUrl = imageUrl.trim();
    if (imageAlt !== undefined) updateData.imageAlt = imageAlt.trim();
    if (background !== undefined) updateData.background = background.trim();
    if (linkUrl !== undefined) updateData.linkUrl = linkUrl?.trim() || null;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (sortOrder !== undefined) updateData.sortOrder = sortOrder;

    const banner = await prisma.banner.update({
      where: { id: params.id },
      data: updateData
    });

    return NextResponse.json(banner);
  } catch (error: any) {
    console.error('Error updating banner:', error);
    
    if (error.message === "Unauthorized: Admin access required") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการแก้ไข banner" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการแก้ไข banner" },
      { status: 500 }
    );
  }
}

// DELETE - ลบ banner
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();

    // ตรวจสอบว่า banner มีอยู่จริง
    const existingBanner = await prisma.banner.findUnique({
      where: { id: params.id }
    });

    if (!existingBanner) {
      return NextResponse.json(
        { error: "ไม่พบ banner ที่ระบุ" },
        { status: 404 }
      );
    }

    await prisma.banner.delete({
      where: { id: params.id }
    });

    return NextResponse.json(
      { message: "ลบ banner สำเร็จ" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error deleting banner:', error);
    
    if (error.message === "Unauthorized: Admin access required") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการลบ banner" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการลบ banner" },
      { status: 500 }
    );
  }
}
