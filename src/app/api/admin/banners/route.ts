import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-utils";
import { prisma } from "@/lib/prisma";

// GET - ดึงรายการ banner ทั้งหมด
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const banners = await prisma.banner.findMany({
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json(banners);
  } catch (error: any) {
    console.error('Error fetching banners:', error);
    
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

// POST - สร้าง banner ใหม่
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    
    const { title, subtitle, imageUrl, imageAlt, background, linkUrl, isActive, sortOrder } = body;

    // Validate required fields
    if (!title || !imageUrl || !imageAlt || !background) {
      return NextResponse.json(
        { error: "กรุณากรอกข้อมูลที่จำเป็น: title, imageUrl, imageAlt, background" },
        { status: 400 }
      );
    }

    const banner = await prisma.banner.create({
      data: {
        title: title.trim(),
        subtitle: subtitle?.trim() || null,
        imageUrl: imageUrl.trim(),
        imageAlt: imageAlt.trim(),
        background: background.trim(),
        linkUrl: linkUrl?.trim() || null,
        isActive: isActive ?? true,
        sortOrder: sortOrder ?? 0,
      }
    });

    return NextResponse.json(banner, { status: 201 });
  } catch (error: any) {
    console.error('Error creating banner:', error);
    
    if (error.message === "Unauthorized: Admin access required") {
      return NextResponse.json(
        { error: "ไม่มีสิทธิ์ในการสร้าง banner" },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการสร้าง banner" },
      { status: 500 }
    );
  }
}
