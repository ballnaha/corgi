import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

interface RouteParams {
  params: Promise<{
    notificationId: string;
  }>;
}

export async function DELETE(request: NextRequest, context: RouteParams) {
  try {
    console.log("🗑️ DELETE payment notification API called");
    console.log("Request URL:", request.url);

    // Await params in Next.js 15+
    const params = await context.params;
    console.log("Notification ID:", params.notificationId);

    const session = await getServerSession(authOptions);
    console.log("Session user:", {
      id: session?.user?.id,
      lineUserId: session?.user?.lineUserId,
      isAdmin: session?.user?.isAdmin,
      role: session?.user?.role
    });

    // ตรวจสอบว่าผู้ใช้ login แล้วและเป็น admin
    if (!session?.user?.id) {
      console.log("❌ Unauthorized - No session");
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์ admin - ใช้ข้อมูลจาก session โดยตรง
    if (!session.user.isAdmin && !session.user.role?.includes("ADMIN")) {
      console.log("❌ Forbidden - Not admin", {
        isAdmin: session.user.isAdmin,
        role: session.user.role
      });
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    console.log("✅ Admin access granted");


    const { notificationId } = params;

    if (!notificationId) {
      console.log("❌ Missing notification ID");
      return NextResponse.json(
        { error: "Payment notification ID is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Finding payment notification:", notificationId);

    // ตรวจสอบว่า payment notification มีอยู่จริง
    const paymentNotification = await prisma.paymentNotification.findUnique({
      where: { id: notificationId },
      include: {
        order: {
          include: {
            user: {
              select: {
                id: true,
                displayName: true,
                email: true,
              }
            }
          }
        }
      }
    });

    if (!paymentNotification) {
      console.log("❌ Payment notification not found");
      return NextResponse.json(
        { error: "Payment notification not found" },
        { status: 404 }
      );
    }

    console.log("✅ Payment notification found:", {
      id: paymentNotification.id,
      orderId: paymentNotification.orderId,
      amount: paymentNotification.transferAmount
    });

    // ลบ payment notification
    console.log("🗑️ Deleting payment notification...");
    await prisma.paymentNotification.delete({
      where: { id: notificationId }
    });

    console.log(`✅ Admin ${session.user.email} deleted payment notification ${notificationId} for order ${paymentNotification.order.orderNumber}`);

    return NextResponse.json({
      success: true,
      message: "Payment notification deleted successfully",
      deletedNotification: {
        id: paymentNotification.id,
        orderId: paymentNotification.orderId,
        orderNumber: paymentNotification.order.orderNumber,
        transferAmount: paymentNotification.transferAmount,
        transferDate: paymentNotification.transferDate,
        customerName: paymentNotification.order.user.displayName,
      }
    });

  } catch (error) {
    console.error("❌ Error deleting payment notification:", error);
    return NextResponse.json(
      { 
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
