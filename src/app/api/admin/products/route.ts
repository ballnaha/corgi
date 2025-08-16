import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    // ตรวจสอบการ authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - User not found" },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์ admin
    if (!session.user.isAdmin && !session.user.role?.includes("ADMIN")) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    // สำหรับ dashboard stats
    if (action === "stats") {
      const [
        totalProducts,
        activeProducts,
        lowStockProducts,
        totalCategories,
      ] = await Promise.all([
        prisma.product.count(),
        prisma.product.count({ where: { isActive: true } }),
        prisma.product.count({ 
          where: { 
            stock: { lte: 5 },
            isActive: true 
          } 
        }),
        prisma.category.count(),
      ]);

      return NextResponse.json({
        success: true,
        totalProducts,
        activeProducts,
        lowStockCount: lowStockProducts,
        totalCategories,
      });
    }

    // สำหรับรายการสินค้า (ถ้าไม่ได้ระบุ action)
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");
    const search = searchParams.get("search");
    const category = searchParams.get("category");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;

    // สร้าง where clause
    const where: any = {};

    if (search) {
      where.OR = [
        {
          name: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          description: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          breed: {
            contains: search,
            mode: "insensitive",
          },
        },
      ];
    }

    if (category) {
      where.category = category;
    }

    if (status === "active") {
      where.isActive = true;
    } else if (status === "inactive") {
      where.isActive = false;
    } else if (status === "low_stock") {
      where.stock = { lte: 5 };
      where.isActive = true;
    }

    // ดึงข้อมูลสินค้าพร้อม pagination
    const [products, totalCount] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          images: {
            select: {
              id: true,
              imageUrl: true,
              altText: true,
              isMain: true,
            },
          },
          categoryRef: {
            select: {
              id: true,
              name: true,
              key: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      products,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });

  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}