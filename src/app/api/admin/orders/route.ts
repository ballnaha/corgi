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
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const search = searchParams.get("search");
    const date = searchParams.get("date");

    const skip = (page - 1) * limit;

    // สร้าง where clause
    const where: any = {};

    // กรองตามสถานะ
    if (status) {
      where.status = status;
    }

    // กรองตามการค้นหา (ชื่อลูกค้า, หมายเลขคำสั่งซื้อ, เบอร์โทร)
    if (search) {
      where.OR = [
        {
          orderNumber: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          customerName: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          customerPhone: {
            contains: search,
          },
        },
        {
          customerEmail: {
            contains: search,
            mode: "insensitive",
          },
        },
        {
          user: {
            OR: [
              {
                displayName: {
                  contains: search,
                  mode: "insensitive",
                },
              },
              {
                email: {
                  contains: search,
                  mode: "insensitive",
                },
              },
            ],
          },
        },
      ];
    }

    // กรองตามวันที่
    if (date) {
      const startDate = new Date(date);
      const endDate = new Date(date);
      endDate.setDate(endDate.getDate() + 1);

      where.createdAt = {
        gte: startDate,
        lt: endDate,
      };
    }

    // ดึงข้อมูลคำสั่งซื้อพร้อม pagination
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
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
                  price: true,
                  salePrice: true,
                  discountPercent: true,
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
              },
            },
          },
          shippingOption: {
            select: {
              id: true,
              name: true,
              method: true,
              price: true,
            },
          },
          user: {
            select: {
              id: true,
              displayName: true,
              email: true,
              lineUserId: true,
              pictureUrl: true,
            },
          },
          paymentNotifications: {
            select: {
              id: true,
              transferAmount: true,
              transferDate: true,
              paymentSlipData: true,
              paymentSlipMimeType: true,
              paymentSlipFileName: true,
              submittedAt: true,
            },
            orderBy: {
              submittedAt: 'desc',
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        skip,
        take: limit,
      }),
      prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      success: true,
      orders,
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
    console.error("Error fetching admin orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
