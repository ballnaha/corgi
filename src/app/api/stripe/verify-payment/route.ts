import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-server";
import { prisma } from "@/lib/prisma";
import { getAuthenticatedUser } from "@/lib/auth-utils";

export async function POST(request: NextRequest) {
  try {
    console.log("=== PAYMENT VERIFICATION REQUEST ===");
    
    const authUser = await getAuthenticatedUser(request);
    if (!authUser?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { sessionId, orderNumber } = await request.json();
    console.log("Verifying payment for:", { sessionId, orderNumber });

    if (!sessionId || !orderNumber) {
      return NextResponse.json(
        { error: "Missing required parameters" },
        { status: 400 }
      );
    }

    // ตรวจสอบ session จาก Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== 'paid') {
      return NextResponse.json(
        { error: "Payment not completed" },
        { status: 400 }
      );
    }

    // หา order ก่อน แล้วค่อย update ด้วย id
    const existingOrder = await prisma.order.findFirst({
      where: { orderNumber },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // ตรวจสอบว่ามี payment notification สำหรับ session นี้แล้วหรือไม่
    const existingNotification = await prisma.paymentNotification.findFirst({
      where: {
        orderId: existingOrder.id,
        paymentSlipFileName: `stripe-session-${sessionId}`,
      },
    });

    let order;
    
    if (!existingNotification) {
      // ถ้ายังไม่มี notification ให้สร้างใหม่
      console.log(`Creating new payment notification for session: ${sessionId}`);
      
      order = await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          status: "CONFIRMED", // ใช้ค่าที่ valid ใน orders_status enum แทน PAID
          totalAmount: session.amount_total ? session.amount_total / 100 : 0,
          paymentMethod: 'credit_card',
          // เพิ่ม payment notification record
          paymentNotifications: {
            create: {
              transferAmount: session.amount_total ? (session.amount_total / 100).toString() : "0",
              transferDate: new Date(),
              transferTime: new Date().toLocaleTimeString('th-TH', { 
                hour: '2-digit', 
                minute: '2-digit', 
                hour12: false 
              }),
              paymentSlipData: `Stripe Session: ${sessionId}`,
              paymentSlipFileName: `stripe-session-${sessionId}`,
              paymentSlipMimeType: "text/plain",
              status: "APPROVED",
              note: `การชำระเงินด้วยบัตรเครดิตผ่าน Stripe\nยอดที่ชำระ: ฿${(session.amount_total ? session.amount_total / 100 : 0)}\nSession ID: ${sessionId}\nPayment Intent: ${session.payment_intent}`,
              submittedAt: new Date(),
            },
          },
        },
        include: {
          orderItems: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
            },
          },
          shippingOption: true,
          paymentNotifications: true,
        },
      });
    } else {
      // ถ้ามี notification แล้ว แค่อัปเดตสถานะ order (ถ้าจำเป็น)
      console.log(`Payment notification already exists for session: ${sessionId}`);
      
      order = await prisma.order.update({
        where: { id: existingOrder.id },
        data: {
          status: "CONFIRMED",
          totalAmount: session.amount_total ? session.amount_total / 100 : 0,
          paymentMethod: 'credit_card',
        },
        include: {
          orderItems: {
            include: {
              product: {
                include: {
                  images: true,
                },
              },
            },
          },
          shippingOption: true,
          paymentNotifications: true,
        },
      });
    }

    console.log(`Order ${orderNumber} updated to CONFIRMED via Stripe checkout (idempotent: ${!!existingNotification})`);

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        totalAmount: session.amount_total ? session.amount_total / 100 : 0,
      },
      stripeSession: {
        id: sessionId,
        paymentStatus: session.payment_status,
        customerEmail: session.customer_email,
      },
      wasAlreadyProcessed: !!existingNotification, // แจ้งให้ client ทราบว่าถูกประมวลผลแล้วหรือยัง
    });

  } catch (error: any) {
    console.error("Error verifying Stripe payment:", error);
    return NextResponse.json(
      { 
        error: "Failed to verify payment", 
        details: error?.message 
      },
      { status: 500 }
    );
  }
}
