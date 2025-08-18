import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET - ดึงรายการ banner ที่ active สำหรับแสดงผล
export async function GET() {
  try {
    const banners = await prisma.banner.findMany({
      where: {
        isActive: true
      },
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'desc' }
      ],
      select: {
        id: true,
        title: true,
        subtitle: true,
        imageUrl: true,
        imageAlt: true,
        background: true,
        linkUrl: true,
        sortOrder: true,
      }
    });

    return NextResponse.json(banners);
  } catch (error: any) {
    console.error('Error fetching public banners:', error);

    return NextResponse.json(
      { error: "เกิดข้อผิดพลาดในการดึงข้อมูล banner" },
      { status: 500 }
    );
  }
}
