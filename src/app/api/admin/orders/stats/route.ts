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

    const [todayOrders, todayRevenue, todayDeliveredRevenue, todayPaymentNotifications] = await Promise.all([
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
      // รายได้จาก DELIVERED orders วันนี้
      prisma.order.aggregate({
        where: {
          createdAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
          status: "DELIVERED" as any,
        },
        _sum: {
          totalAmount: true,
        },
      }),
      // รายได้จาก payment notifications วันนี้ (orders ที่ไม่ใช่ DELIVERED)
      prisma.paymentNotification.aggregate({
        where: {
          submittedAt: {
            gte: startOfDay,
            lt: endOfDay,
          },
          order: {
            status: {
              in: ["CONFIRMED", "PROCESSING", "SHIPPED"] as any
            }
          }
        },
        _sum: {
          transferAmount: true,
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

    // คำนวณรายได้จริง: 
    // 1. สำหรับ DELIVERED orders = totalAmount เต็ม (ถือว่าจ่ายครบแล้ว)
    // 2. สำหรับ orders อื่นๆ = ยอดจาก payment notifications
    
    const [deliveredOrdersRevenue, nonDeliveredPayments] = await Promise.all([
      // รายได้จาก DELIVERED orders (นับ totalAmount เต็ม)
      prisma.order.aggregate({
        where: {
          status: "DELIVERED" as any
        },
        _sum: {
          totalAmount: true,
        },
      }),
      // รายได้จาก payment notifications ของ orders ที่ไม่ใช่ DELIVERED
      prisma.paymentNotification.aggregate({
        where: {
          order: {
            status: {
              in: ["CONFIRMED", "PROCESSING", "SHIPPED"] as any
            }
          }
        },
        _sum: {
          transferAmount: true,
        },
      })
    ]);

    // คำนวณค่าต่างๆ สำหรับการแสดงผล
    const expectedRevenue = Number(totalRevenueResult._sum.totalAmount || 0);
    
    // รายได้จริง = รายได้จาก DELIVERED orders + รายได้จาก payment notifications ของ orders อื่นๆ
    const deliveredRevenue = Number(deliveredOrdersRevenue._sum.totalAmount || 0);
    const paymentNotificationRevenue = Number(nonDeliveredPayments._sum.transferAmount || 0);
    const actualRevenue = deliveredRevenue + paymentNotificationRevenue;
    
    const pendingRevenue = Math.max(0, expectedRevenue - actualRevenue);

    const todayExpectedRevenue = Number(todayRevenue._sum.totalAmount || 0);
    
    // รายได้จริงวันนี้ = รายได้จาก DELIVERED orders วันนี้ + รายได้จาก payment notifications วันนี้
    const todayDeliveredRevenueNum = Number(todayDeliveredRevenue._sum.totalAmount || 0);
    const todayPaymentNotificationsRevenueNum = Number(todayPaymentNotifications._sum.transferAmount || 0);
    const todayActualRevenueNum = todayDeliveredRevenueNum + todayPaymentNotificationsRevenueNum;

    return NextResponse.json({
      success: true,
      stats: {
        // สถิติรวม
        totalOrders,
        totalRevenue: actualRevenue, // แสดงรายได้จริงที่ได้รับ
        expectedRevenue: expectedRevenue, // รายได้ที่คาดหวัง (ราคาสินค้าเต็ม)
        pendingRevenue: pendingRevenue, // ยอดค้างรับ
        actionRequiredCount,
        
        // รายละเอียดการคำนวณรายได้
        revenueBreakdown: {
          deliveredOrdersRevenue: deliveredRevenue, // รายได้จาก orders ที่ส่งมอบแล้ว
          paymentNotificationsRevenue: paymentNotificationRevenue, // รายได้จาก payment notifications
        },
        
        // สถิติวันนี้
        todayOrders,
        todayRevenue: todayActualRevenueNum, // รายได้จริงวันนี้
        todayExpectedRevenue: todayExpectedRevenue, // รายได้คาดหวังวันนี้
        
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
