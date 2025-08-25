import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type RouteParams = {
  params: Promise<{ orderId: string }>;
};

export async function POST(
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

    const { orderId } = await params;
    const body = await request.json();
    const { 
      amount, 
      paymentMethod, 
      paymentDate, 
      paymentTime, 
      note,
      autoComplete 
    } = body;

    // Validate required fields
    if (!amount || !paymentMethod || !paymentDate || !paymentTime) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่าคำสั่งซื้อมีอยู่หรือไม่
    const existingOrder = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentNotifications: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // สร้าง payment notification สำหรับการชำระแบบ manual
    const manualPayment = await prisma.paymentNotification.create({
      data: {
        orderId: orderId,
        transferAmount: Number(amount),
        transferDate: new Date(`${paymentDate}T${paymentTime}`),
        transferTime: paymentTime,
        note: `[MANUAL_PAYMENT] Method: ${paymentMethod} | Recorded by: ${session.user.displayName || session.user.name} | ${note || 'No additional note'}`,
        paymentSlipData: null, // ไม่มีสลิปสำหรับการชำระแบบ manual
        paymentSlipMimeType: null,
        paymentSlipFileName: `manual_payment_${Date.now()}`,
        submittedAt: new Date(),
      },
    });

    // คำนวณยอดเงินที่ได้รับทั้งหมด (แก้ไขการจัดการ data type)
    const allPayments = await prisma.paymentNotification.findMany({
      where: { orderId: orderId },
    });

    const totalPaid = allPayments.reduce(
      (sum, payment) => {
        // แปลง Decimal เป็น number อย่างปลอดภัย
        const amount = typeof payment.transferAmount === 'object' && payment.transferAmount !== null
          ? parseFloat(payment.transferAmount.toString())
          : Number(payment.transferAmount);
        return sum + (isNaN(amount) ? 0 : amount);
      },
      0
    );

    // แปลง totalAmount เป็น number อย่างปลอดภัย
    const orderTotal = typeof existingOrder.totalAmount === 'object' && existingOrder.totalAmount !== null
      ? parseFloat(existingOrder.totalAmount.toString())
      : Number(existingOrder.totalAmount);
    
    const isFullyPaid = totalPaid >= orderTotal;
    
    console.log('API Payment Calculation Debug:', {
      orderTotal,
      totalPaid,
      remainingAmount: orderTotal - totalPaid,
      isFullyPaid,
      allPayments: allPayments.map(p => ({
        amount: p.transferAmount,
        type: typeof p.transferAmount
      }))
    });

    // อัปเดตสถานะออเดอร์หากชำระครบแล้วและ autoComplete เป็น true
    let updatedOrder = existingOrder;
    if (autoComplete && isFullyPaid) {
      updatedOrder = await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "DELIVERED",
          adminComment: `${existingOrder.adminComment || ''}\n[${new Date().toLocaleString('th-TH')}] ได้รับการชำระเงินครบถ้วนแล้ว (${paymentMethod}: ฿${amount}) โดย ${session.user.displayName || session.user.name}`.trim(),
        },
        include: {
          paymentNotifications: true,
        },
      });
    }

    return NextResponse.json({
      success: true,
      payment: manualPayment,
      order: updatedOrder,
      totalPaid: parseFloat(totalPaid.toFixed(2)),
      remainingAmount: parseFloat(Math.max(0, orderTotal - totalPaid).toFixed(2)),
      isFullyPaid: isFullyPaid,
      debug: {
        orderTotal,
        totalPaid,
        rawCalculation: orderTotal - totalPaid
      }
    });
  } catch (error) {
    console.error("Error recording manual payment:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
