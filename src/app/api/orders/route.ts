import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ensureUserExists } from "@/lib/user-utils";
import { getAuthenticatedUser } from "@/lib/auth-utils";

export async function GET(request: NextRequest) {
  console.log("🚀 === ORDERS API ROUTE CALLED ===");
  console.log("🔗 Request URL:", request.url);
  
  try {
    // Parse URL parameters once
    const { searchParams } = new URL(request.url);
    const orderNumber = searchParams.get("orderNumber");
    
    // Log orderNumber search if present
    if (orderNumber) {
      console.log("Searching for orderNumber:", orderNumber);
    }
    
    // Support both NextAuth and SimpleAuth
    const authUser = await getAuthenticatedUser(request);
    
    if (!authUser?.id) {
      console.log('❌ Orders API: No authenticated user found');
      return NextResponse.json(
        { error: "Unauthorized - User not found" },
        { status: 401 }
      );
    }

    console.log(`✅ Orders API: User ${authUser.id} authenticated via ${authUser.source}`);

    // ค้นหา user ในฐานข้อมูล
    let user = await prisma.user.findUnique({
      where: { lineUserId: authUser.lineUserId || authUser.id }
    });
    
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: authUser.id }
      });
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");

    const skip = (page - 1) * limit;
    
    console.log("Using userId for orders search:", user.id);
    
    const where: any = {
      userId: user.id,
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
          paymentNotifications: {
            select: {
              id: true,
              transferAmount: true,
              transferDate: true,
              status: true,
              submittedAt: true,
              paymentSlipData: true,
              paymentSlipMimeType: true,
              paymentSlipFileName: true,
              createdAt: true,
            },
          },
          shippingOption: {
            select: {
              id: true,
              name: true,
              method: true,
            },
          },
          paymentMethodRef: {
            select: {
              id: true,
              name: true,
              type: true,
              description: true,
              icon: true,
            },
          },
        },
      });

      if (!order) {
        console.log("Order not found with orderNumber:", orderNumber);
        
        // Debug: ลองหา order ทั้งหมดของ user นี้
        const allUserOrders = await prisma.order.findMany({
          where: { userId: authUser.id },
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
          paymentNotifications: {
            select: {
              id: true,
              transferAmount: true,
              transferDate: true,
              status: true,
              submittedAt: true,
              paymentSlipData: true,
              paymentSlipMimeType: true,
              paymentSlipFileName: true,
              createdAt: true,
            },
          },
          shippingOption: {
            select: {
              id: true,
              name: true,
              method: true,
            },
          },
          paymentMethodRef: {
            select: {
              id: true,
              name: true,
              type: true,
              description: true,
              icon: true,
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

  } catch (error: any) {
    console.error("=== CRITICAL ERROR IN ORDERS API ===");
    console.error("Error fetching orders:", error);
    console.error("Error type:", typeof error);
    console.error("Error constructor:", error?.constructor?.name);
    console.error("Error stack:", error?.stack);
    console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    
    return NextResponse.json(
      { error: "Internal server error", details: error?.message },
      { status: 500 }
    );
  }
}
