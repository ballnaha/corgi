import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ensureUserExists } from "@/lib/user-utils";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - User not found" },
        { status: 401 }
      );
    }

    // ตรวจสอบและสร้าง user หากจำเป็น
    const user = await ensureUserExists(session.user);
    if (!user) {
      return NextResponse.json(
        { error: "Failed to validate user" },
        { status: 500 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const orderNumber = searchParams.get("orderNumber");

    const skip = (page - 1) * limit;

    // Build where clause
    // Handle both internal DB ID and LINE ID for backward compatibility
    let userId = session.user.id;
    
    // Check if user exists with current session ID
    const userCheck = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true }
    });
    
    if (!userCheck && session.user.lineUserId) {
      // If not found by ID, try to find by lineUserId
      const userByLineId = await prisma.user.findUnique({
        where: { lineUserId: session.user.lineUserId },
        select: { id: true }
      });
      
      if (userByLineId) {
        console.log("Found user by lineUserId, using internal ID:", userByLineId.id);
        userId = userByLineId.id;
      }
    }
    
    console.log("Using userId for orders search:", userId);
    
    const where: any = {
      userId: userId,
    };

    if (status) {
      where.status = status;
    }

    if (orderNumber) {
      where.orderNumber = orderNumber;
    }

    // If searching by orderNumber, return single order
    if (orderNumber) {
      console.log("Searching for order with orderNumber:", orderNumber);
      console.log("Using where clause:", where);
      
      const order = await prisma.order.findFirst({
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
            },
          },
        },
      });

      if (!order) {
        console.log("Order not found with orderNumber:", orderNumber);
        
        // Debug: ลองหา order ทั้งหมดของ user นี้
        const allUserOrders = await prisma.order.findMany({
          where: { userId: session.user.id },
          select: { id: true, orderNumber: true, createdAt: true },
          orderBy: { createdAt: 'desc' },
          take: 5
        });
        console.log("Recent orders for user:", allUserOrders);
        
        return NextResponse.json(
          { error: "Order not found", debug: { searchedOrderNumber: orderNumber, recentOrders: allUserOrders } },
          { status: 404 }
        );
      }

      return NextResponse.json({
        success: true,
        order,
      });
    }

    // Get orders with pagination
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
    console.error("Error fetching orders:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
