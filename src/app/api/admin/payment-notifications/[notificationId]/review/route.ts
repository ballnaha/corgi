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

export async function PATCH(request: NextRequest, context: RouteParams) {
  try {
    console.log("📋 PATCH payment notification review API called");
    console.log("Request URL:", request.url);

    // Await params in Next.js 15+
    const params = await context.params;
    console.log("Notification ID:", params.notificationId);

    const session = await getServerSession(authOptions);
    console.log("Session user:", session?.user?.id);

    // ตรวจสอบว่าผู้ใช้ login แล้วและเป็น admin
    if (!session?.user?.id) {
      console.log("❌ Unauthorized - No session");
      return NextResponse.json(
        { error: "Unauthorized - Please login" },
        { status: 401 }
      );
    }

    // ตรวจสอบสิทธิ์ admin - ใช้ lineUserId แทน id
    const user = await prisma.user.findUnique({
      where: { lineUserId: session.user.id },
      select: { isAdmin: true, role: true, displayName: true, email: true }
    });

    console.log("User admin status:", { isAdmin: user?.isAdmin, role: user?.role, user: user?.displayName });

    if (!user?.isAdmin || user.role !== 'ADMIN') {
      console.log("❌ Forbidden - Not admin");
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const { notificationId } = params;

    if (!notificationId) {
      console.log("❌ Missing notification ID");
      return NextResponse.json(
        { error: "Payment notification ID is required" },
        { status: 400 }
      );
    }

    // รับข้อมูลจาก request body
    const { status, reviewNote } = await request.json();

    if (!status || !['APPROVED', 'REJECTED'].includes(status)) {
      console.log("❌ Invalid status:", status);
      return NextResponse.json(
        { error: "Status must be either APPROVED or REJECTED" },
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
      amount: paymentNotification.transferAmount,
      currentStatus: paymentNotification.status
    });

    // ตรวจสอบว่ายังไม่ได้ review หรือไม่
    if (paymentNotification.reviewedAt) {
      console.log("❌ Already reviewed at:", paymentNotification.reviewedAt);
      return NextResponse.json(
        { error: "Payment notification has already been reviewed" },
        { status: 400 }
      );
    }

    // อัปเดต payment notification พร้อม review info
    console.log("📝 Updating payment notification review...");
    const updatedNotification = await prisma.paymentNotification.update({
      where: { id: notificationId },
      data: {
        status: status as any,
        reviewedAt: new Date(),
        reviewedBy: user.displayName || user.email || session.user.id,
        reviewNote: reviewNote?.trim() || null,
      },
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

    // หาก approve และเป็นการชำระที่ทำให้ออเดอร์ครบ ให้อัปเดตสถานะออเดอร์
    if (status === 'APPROVED') {
      console.log("✅ Payment approved, checking if order is fully paid...");
      
      // คำนวณยอดรวมที่ approve แล้ว
      const approvedPayments = await prisma.paymentNotification.findMany({
        where: {
          orderId: paymentNotification.orderId,
          status: 'APPROVED'
        }
      });

      const totalApprovedAmount = approvedPayments.reduce((sum, payment) => {
        return sum + Number(payment.transferAmount);
      }, 0);

      const orderTotal = Number(paymentNotification.order.totalAmount);

      console.log("💰 Payment summary:", {
        orderTotal,
        totalApprovedAmount,
        isFullyPaid: totalApprovedAmount >= orderTotal
      });

      // หากชำระครบแล้ว ให้เปลี่ยนสถานะเป็น CONFIRMED
      if (totalApprovedAmount >= orderTotal) {
        await prisma.order.update({
          where: { id: paymentNotification.orderId },
          data: { status: 'CONFIRMED' }
        });
        console.log("🎉 Order status updated to CONFIRMED - payment complete!");
      }
    }

    console.log(`✅ Admin ${user.displayName || user.email} reviewed payment notification ${notificationId} as ${status}`);

    return NextResponse.json({
      success: true,
      message: `Payment notification ${status.toLowerCase()} successfully`,
      reviewedNotification: {
        id: updatedNotification.id,
        orderId: updatedNotification.orderId,
        orderNumber: updatedNotification.order.orderNumber,
        transferAmount: updatedNotification.transferAmount,
        status: updatedNotification.status,
        reviewedAt: updatedNotification.reviewedAt,
        reviewedBy: updatedNotification.reviewedBy,
        reviewNote: updatedNotification.reviewNote,
        customerName: updatedNotification.order.user.displayName,
      }
    });

  } catch (error) {
    console.error("❌ Error reviewing payment notification:", error);
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
