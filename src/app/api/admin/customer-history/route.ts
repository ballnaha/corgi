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
    const pageParam = parseInt(searchParams.get("page") || "1");
    const limitParam = parseInt(searchParams.get("limit") || "10");
    const searchParam = searchParams.get("search");
    const statusParam = searchParams.get("status");

    const skipValue = (pageParam - 1) * limitParam;

    // สร้าง where clause สำหรับการค้นหา
    const userWhere: any = {};
    if (searchParam) {
      userWhere.OR = [
        { displayName: { contains: searchParam, mode: "insensitive" } },
        { email: { contains: searchParam, mode: "insensitive" } },
        { lineUserId: { contains: searchParam, mode: "insensitive" } },
      ];
    }

    // สร้าง order where clause สำหรับการกรองตามสถานะ
    const orderWhere: any = {};
    if (statusParam) {
      orderWhere.status = statusParam;
    }

    // ดึงข้อมูลลูกค้าที่มีออเดอร์
    const customers = await prisma.user.findMany({
      where: {
        ...userWhere,
        orders: {
          some: orderWhere,
        },
      },
      include: {
        orders: {
          where: orderWhere,
          include: {
            orderItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    category: true,
                    breed: true,
                    gender: true,
                    age: true,
                    images: {
                      select: {
                        id: true,
                        imageUrl: true,
                        altText: true,
                        isMain: true,
                      },
                      where: { isMain: true },
                      take: 1,
                    },
                  },
                },
              },
            },
          },
          orderBy: {
            updatedAt: "desc",
          },
        },
      },
      skip: skipValue,
      take: limitParam,
      orderBy: [
        {
          orders: {
            _count: "desc",
          },
        },
        {
          createdAt: "desc",
        },
      ],
    });

    // นับจำนวนลูกค้าทั้งหมด
    const totalCount = await prisma.user.count({
      where: {
        ...userWhere,
        orders: {
          some: orderWhere,
        },
      },
    });

    // แปลงข้อมูลให้เหมาะสมกับการแสดงผล
    const customerHistories = customers.map((customer) => {
      const customerOrders = customer.orders;
      const totalSpent = customerOrders.reduce(
        (sum, order) => sum + Number(order.totalAmount),
        0
      );

      return {
        userId: customer.id,
        user: {
          id: customer.id,
          displayName: customer.displayName,
          email: customer.email,
          pictureUrl: customer.pictureUrl,
        },
        orders: customerOrders,
        totalOrders: customerOrders.length,
        totalSpent: totalSpent,
      };
    });

    // คำนวณ pagination info
    const totalPages = Math.ceil(totalCount / limitParam);
    const hasNext = pageParam < totalPages;
    const hasPrev = pageParam > 1;

    return NextResponse.json({
      success: true,
      customers: customerHistories,
      pagination: {
        page: pageParam,
        limit: limitParam,
        totalCount: totalCount,
        totalPages: totalPages,
        hasNext: hasNext,
        hasPrev: hasPrev,
      },
      totalCount: totalCount,
    });
  } catch (error) {
    console.error("Error fetching customer histories:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
