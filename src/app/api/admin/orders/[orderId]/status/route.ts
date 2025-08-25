import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/lib/order-status";

interface RouteParams {
  params: Promise<{
    orderId: string;
  }>;
}

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    // ตรวจสอบการ authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - User not found" },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์ admin - ใช้ lineUserId แทน id
    const user = await prisma.user.findUnique({
      where: { lineUserId: session.user.id },
      select: { isAdmin: true, role: true, displayName: true }
    });

    if (!user?.isAdmin || user.role !== 'ADMIN') {
      console.log("❌ Forbidden - Not admin");
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { orderId } = await context.params;
    const body = await request.json();
    const { status, adminComment } = body;

    // ตรวจสอบว่า status ที่ส่งมาถูกต้อง (ตาม schema)
    const validStatuses: OrderStatus[] = [
      "PENDING", "PAYMENT_PENDING", "CONFIRMED", "PROCESSING", 
      "SHIPPED", "DELIVERED", "CANCELLED"
    ];
    
    if (!status || !validStatuses.includes(status as OrderStatus)) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าคำสั่งซื้อมีอยู่หรือไม่
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true, status: true },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // อัปเดตสถานะคำสั่งซื้อ และบันทึก admin comment
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        status: status as any, // ใช้ any เพื่อหลีกเลี่ยงปัญหา type ชั่วคราว
        adminComment: adminComment?.trim() || null, // บันทึก admin comment
        updatedAt: new Date(),
      } as any,
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
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
            pictureUrl: true,
          },
        },
      },
    });

    // Admin comment จะถูกบันทึกไว้ใน order แล้ว
    console.log("✅ Order status updated successfully with admin comment");

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });

  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest, context: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    // ตรวจสอบการ authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - User not found" },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์ admin - ใช้ lineUserId แทน id
    const user = await prisma.user.findUnique({
      where: { lineUserId: session.user.id },
      select: { isAdmin: true, role: true, displayName: true }
    });

    if (!user?.isAdmin || user.role !== 'ADMIN') {
      console.log("❌ Forbidden - Not admin");
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { orderId } = await context.params;

    // ดึงข้อมูลคำสั่งซื้อ
    const order = await prisma.order.findUnique({
      where: { id: orderId },
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
            pictureUrl: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });

  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
