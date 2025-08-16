import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/lib/order-status";

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

    // นับจำนวนคำสั่งซื้อแต่ละสถานะ (ตาม schema)
    const [
      pendingCount,
      paymentPendingCount,
      confirmedCount,
      processingCount,
      shippedCount,
      deliveredCount,
      cancelledCount,
      totalOrders,
    ] = await Promise.all([
      prisma.order.count({ where: { status: "PENDING" as any } }),
      prisma.order.count({ where: { status: "PAYMENT_PENDING" as any } }),
      prisma.order.count({ where: { status: "CONFIRMED" as any } }),
      prisma.order.count({ where: { status: "PROCESSING" as any } }),
      prisma.order.count({ where: { status: "SHIPPED" as any } }),
      prisma.order.count({ where: { status: "DELIVERED" as any } }),
      prisma.order.count({ where: { status: "CANCELLED" as any } }),
      prisma.order.count(),
    ]);

    // คำนวณคำสั่งซื้อที่ต้องดำเนินการ (pending + payment_pending + confirmed)
    const actionRequiredCount = pendingCount + paymentPendingCount + confirmedCount;

    // สถานะที่นับเป็นรายได้ (ไม่รวม PENDING, PAYMENT_PENDING, CANCELLED)
    const validRevenueStatuses = ["CONFIRMED", "PROCESSING", "SHIPPED", "DELIVERED"];

    // ยอดขายวันนี้
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

    const [todayOrders, todayRevenue] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
        },
      }),
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
          status: {
            in: validRevenueStatuses as any,
          },
        },
        _sum: {
          totalAmount: true,
        },
      }),
    ]);

    // คำนวณ total revenue จากคำสั่งซื้อที่ไม่ใช่ PENDING, PAYMENT_PENDING, CANCELLED
    const totalRevenueResult = await prisma.order.aggregate({
      where: {
        status: {
          in: validRevenueStatuses as any
        }
      },
      _sum: {
        totalAmount: true,
      },
    });

    return NextResponse.json({
      success: true,
      stats: {
        // สถิติรวม
        totalOrders,
        totalRevenue: totalRevenueResult._sum.totalAmount || 0,
        actionRequiredCount,
        
        // สถิติวันนี้
        todayOrders,
        todayRevenue: todayRevenue._sum.totalAmount || 0,
        
        // สถิติแต่ละสถานะ (ตาม schema)
        statusCounts: {
          pending: pendingCount,
          paymentPending: paymentPendingCount,
          confirmed: confirmedCount,
          processing: processingCount,
          shipped: shippedCount,
          delivered: deliveredCount,
          cancelled: cancelledCount,
        },
      },
    });

  } catch (error) {
    console.error("Error fetching order stats:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
