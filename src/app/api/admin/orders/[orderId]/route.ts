import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ orderId: string }>;
};

export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { orderId } = await params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        paymentNotifications: true,
        user: true,
        shippingOption: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Check if user is admin or the order owner
    const isAdmin = session.user.isAdmin || session.user.role === "ADMIN";
    const isOwner = session.user.id === order.userId;

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      );
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const session = await getServerSession(authOptions);

    // ตรวจสอบการ authentication
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - User not found" },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์ admin จาก session โดยตรง
    const isAdmin = session.user.isAdmin || session.user.role === 'ADMIN';
    if (!isAdmin) {
      console.log("❌ Forbidden - Not admin");
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { orderId } = await params;

    // ตรวจสอบว่าออเดอร์มีอยู่หรือไม่
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: true,
          },
        },
        paymentNotifications: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // เก็บข้อมูลสำหรับ debug และ response
    const orderItemsCount = existingOrder.orderItems.length;
    const restoredItems: { productId: string; productName: string; quantity: number; restoredStock: number }[] = [];

    // ดำเนินการใน transaction เพื่อความปลอดภัย
    await prisma.$transaction(async (tx) => {
      // 1. คืน stock ของสินค้าทั้งหมดในออเดอร์
      for (const orderItem of existingOrder.orderItems) {
        const currentProduct = await tx.product.findUnique({
          where: { id: orderItem.productId },
          select: { id: true, name: true, stock: true },
        });

        if (currentProduct) {
          const newStock = (currentProduct.stock || 0) + orderItem.quantity;
          
          await tx.product.update({
            where: { id: orderItem.productId },
            data: { stock: newStock },
          });

          restoredItems.push({
            productId: currentProduct.id,
            productName: currentProduct.name,
            quantity: orderItem.quantity,
            restoredStock: newStock,
          });
        }
      }

      // 2. ลบ payment notifications ที่เกี่ยวข้อง
      await tx.paymentNotification.deleteMany({
        where: { orderId: orderId },
      });

      // 3. ลบ order items
      await tx.orderItem.deleteMany({
        where: { orderId: orderId },
      });

      // 4. ลบออเดอร์
      await tx.order.delete({
        where: { id: orderId },
      });
    });

    console.log('Order deleted successfully:', {
      orderId,
      deletedBy: session.user.displayName || session.user.name,
      restoredItems,
    });

    return NextResponse.json({
      success: true,
      message: "Order deleted successfully and stock restored",
      deletedOrderId: orderId,
      restoredItems: restoredItems.length,
      stockRestoration: restoredItems,
    });

  } catch (error) {
    console.error("Error deleting order:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
