import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe-server";
import { prisma } from "@/lib/prisma";
import { headers } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get("stripe-signature");

    if (!signature) {
      console.error("No Stripe signature found");
      return NextResponse.json(
        { error: "No signature" },
        { status: 400 }
      );
    }

    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.error("STRIPE_WEBHOOK_SECRET is not configured");
      return NextResponse.json(
        { error: "Webhook secret not configured" },
        { status: 500 }
      );
    }

    // ตรวจสอบ webhook signature
    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    );

    console.log("=== STRIPE WEBHOOK RECEIVED ===");
    console.log("Event type:", event.type);
    console.log("Event ID:", event.id);
    console.log("Event data object type:", typeof event.data.object);
    console.log("Event data object keys:", Object.keys(event.data.object));
    
    // จัดการ event ต่างๆ
    switch (event.type) {
      case 'payment_intent.succeeded':
        console.log("Processing payment success...");
        await handlePaymentSuccess(event.data.object as any);
        break;
      
      case 'payment_intent.payment_failed':
        console.log("Processing payment failure...");
        await handlePaymentFailed(event.data.object as any);
        break;
      
      case 'checkout.session.completed':
        console.log("Processing checkout session completed...");
        await handleCheckoutSessionCompleted(event.data.object as any);
        break;
      
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error("Stripe webhook error:", error.message);
    return NextResponse.json(
      { error: "Webhook handler failed" },
      { status: 400 }
    );
  }
}

async function handlePaymentSuccess(paymentIntent: any) {
  try {
    console.log("=== PAYMENT SUCCESS HANDLER ===");
    console.log("Payment Intent ID:", paymentIntent.id);
    console.log("Payment Intent metadata:", paymentIntent.metadata);
    console.log("Payment Intent amount:", paymentIntent.amount);
    
    const orderNumber = paymentIntent.metadata?.orderNumber;
    
    if (!orderNumber) {
      console.error("No orderNumber in payment intent metadata");
      return;
    }
    
    // หา order ก่อน แล้วค่อย update ด้วย id
    const existingOrder = await prisma.order.findFirst({
      where: { orderNumber },
    });

    if (!existingOrder) {
      console.error("Order not found:", orderNumber);
      return;
    }

    // อัปเดต order status เป็น CONFIRMED  
    const order = await prisma.order.update({
      where: { id: existingOrder.id },
      data: {
        status: "CONFIRMED", // ใช้ CONFIRMED แทน PAID
        // หมายเหตุ: ไม่มี paymentMethod หรือ stripePaymentIntentId field ใน Order model
      },
    });

    // ตรวจสอบว่ามี payment notification สำหรับ Payment Intent นี้แล้วหรือไม่
    const existingNotification = await prisma.paymentNotification.findFirst({
      where: {
        orderId: order.id,
        paymentSlipFileName: `stripe-payment-${paymentIntent.id}`,
      },
    });

    // สร้าง payment notification record เฉพาะเมื่อยังไม่มี
    if (!existingNotification) {
      await prisma.paymentNotification.create({
        data: {
          orderId: order.id,
          transferAmount: (paymentIntent.amount / 100).toString(), // Convert back from cents
          transferDate: new Date(),
          transferTime: new Date().toTimeString().slice(0, 5),
          paymentSlipData: null, // ไม่มีสลิปสำหรับบัตรเครดิต
          paymentSlipFileName: `stripe-payment-${paymentIntent.id}`,
          status: "APPROVED",
          submittedAt: new Date(),
          note: `ชำระด้วยบัตรเครดิตผ่าน Stripe - Payment Intent: ${paymentIntent.id}`,
        },
      });
      console.log("✅ New payment notification created for:", paymentIntent.id);
    } else {
      console.log("⚠️ Payment notification already exists for:", paymentIntent.id);
    }

    console.log("Order updated successfully:", orderNumber);

    // ส่ง LINE notification เฉพาะเมื่อสร้าง notification ใหม่
    if (!existingNotification) {
      await sendLineNotification(order);
    } else {
      console.log("⚠️ Skipping LINE notification - already sent for this payment");
    }

  } catch (error) {
    console.error("Error handling payment success:", error);
  }
}

// ฟังก์ชันส่ง LINE notification
async function sendLineNotification(order: any) {
  try {
    console.log("🚀 [WEBHOOK] ส่งใบเสร็จไปยัง LINE API...");
    console.log("🚀 [WEBHOOK] Order ID:", order.id);
    console.log("🚀 [WEBHOOK] Order Number:", order.orderNumber);
    
    // ดึงข้อมูล order items พร้อม product details
    const orderWithItems = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        orderItems: {
          include: {
            product: true
          }
        }
      }
    });

    if (!orderWithItems) {
      console.error("❌ [WEBHOOK] Order not found for LINE notification:", order.id);
      return;
    }
    
    console.log("✅ [WEBHOOK] Order found with", orderWithItems.orderItems.length, "items");
    
    // เตรียมข้อมูลใบเสร็จสำหรับ LINE
    const receiptData = {
      orderNumber: orderWithItems.orderNumber,
      customerName: orderWithItems.customerName,
      customerEmail: orderWithItems.customerEmail,
      customerPhone: orderWithItems.customerPhone,
      items: orderWithItems.orderItems?.map((item: any) => ({
        productName: item.product?.name || `สินค้า ID: ${item.productId}`,
        quantity: item.quantity,
        price: parseFloat(item.price.toString()),
        total: parseFloat(item.price.toString()) * item.quantity
      })) || [],
      subtotal: orderWithItems.orderItems?.reduce((sum: number, item: any) => 
        sum + (parseFloat(item.price.toString()) * item.quantity), 0) || 0,
      shippingFee: parseFloat(orderWithItems.shippingFee?.toString() || "0"),
      discountAmount: parseFloat(orderWithItems.discountAmount?.toString() || "0"),
      total: parseFloat(orderWithItems.totalAmount.toString()), // total รวมค่าส่งแล้ว
      paymentType: "FULL_PAYMENT", // บัตรเครดิตชำระเต็มจำนวนเสมอ
      depositAmount: 0,
      remainingAmount: 0,
      shippingMethod: orderWithItems.shippingMethod || "ไม่ระบุ",
      shippingAddress: orderWithItems.shippingAddress || "ไม่ระบุ",
      orderStatus: "CONFIRMED", // สถานะหลังชำระเงิน Stripe สำเร็จ
      paymentMethod: "บัตรเครดิต (Stripe)"
    };

    const lineResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/api/line/send-receipt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-webhook-source": "stripe",
      },
      body: JSON.stringify(receiptData),
    });

    console.log("📡 [WEBHOOK] LINE API response status:", lineResponse.status);

    if (lineResponse.ok) {
      const lineResult = await lineResponse.json();
      console.log("✅ [WEBHOOK] LINE Response:", lineResult);
      if (lineResult.success) {
        console.log("✅ [WEBHOOK] Receipt sent to LINE successfully");
      } else if (lineResult.skipLine) {
        console.warn("⚠️ [WEBHOOK] LINE messaging is not configured");
      }
    } else {
      const errorText = await lineResponse.text();
      console.error("❌ [WEBHOOK] Failed to send receipt to LINE:", errorText);
    }
  } catch (lineError) {
    console.error("❌ [WEBHOOK] LINE API error:", lineError);
    // LINE error ไม่ควรหยุดการทำงานของ webhook
  }
}

async function handleCheckoutSessionCompleted(session: any) {
  try {
    console.log("=== CHECKOUT SESSION COMPLETED ===");
    console.log("Session ID:", session.id);
    console.log("Session metadata:", session.metadata);
    console.log("Payment Intent ID:", session.payment_intent);
    console.log("Payment Status:", session.payment_status);
    
    // ตรวจสอบว่าการชำระเงินสำเร็จหรือไม่
    if (session.payment_status !== 'paid') {
      console.log("Payment not completed yet, status:", session.payment_status);
      return;
    }
    
    const orderNumber = session.metadata?.orderNumber;
    
    if (!orderNumber) {
      console.error("No orderNumber in checkout session metadata");
      return;
    }
    
    // หา order ก่อน แล้วค่อย update ด้วย id
    const existingOrder = await prisma.order.findFirst({
      where: { orderNumber },
    });

    if (!existingOrder) {
      console.error("Order not found:", orderNumber);
      return;
    }

    // อัปเดต order status เป็น CONFIRMED  
    const order = await prisma.order.update({
      where: { id: existingOrder.id },
      data: {
        status: "CONFIRMED", // ใช้ CONFIRMED แทน PAID
      },
    });

    // ตรวจสอบว่ามี payment notification สำหรับ Session นี้แล้วหรือไม่
    const existingNotification = await prisma.paymentNotification.findFirst({
      where: {
        orderId: order.id,
        paymentSlipFileName: `stripe-session-${session.id}`,
      },
    });

    // สร้าง payment notification record เฉพาะเมื่อยังไม่มี
    if (!existingNotification) {
      const amountInTHB = session.amount_total / 100; // Convert from satang to THB
      
      await prisma.paymentNotification.create({
        data: {
          orderId: order.id,
          transferAmount: amountInTHB.toString(),
          transferDate: new Date(),
          transferTime: new Date().toTimeString().slice(0, 5),
          paymentSlipData: null, // ไม่มีสลิปสำหรับบัตรเครดิต
          paymentSlipFileName: `stripe-session-${session.id}`,
          status: "APPROVED",
          submittedAt: new Date(),
          note: `ชำระด้วยบัตรเครดิตผ่าน Stripe - Session: ${session.id}, Payment Intent: ${session.payment_intent}`,
        },
      });
      console.log("✅ New payment notification created for session:", session.id);
    } else {
      console.log("⚠️ Payment notification already exists for session:", session.id);
    }

    console.log("Order updated successfully:", orderNumber);

    // ส่ง LINE notification เฉพาะเมื่อสร้าง notification ใหม่
    if (!existingNotification) {
      await sendLineNotification(order);
    } else {
      console.log("⚠️ Skipping LINE notification - already sent for this session");
    }

  } catch (error) {
    console.error("Error handling checkout session completed:", error);
  }
}

async function handlePaymentFailed(paymentIntent: any) {
  try {
    console.log("Payment failed:", paymentIntent.id);
    
    const orderNumber = paymentIntent.metadata.orderNumber;
    
    // หา order ก่อน แล้วค่อย update ด้วย id
    const existingOrder = await prisma.order.findFirst({
      where: { orderNumber },
    });

    if (!existingOrder) {
      console.error("Order not found:", orderNumber);
      return;
    }

    // อัปเดต order status เป็น PAYMENT_FAILED
    await prisma.order.update({
      where: { id: existingOrder.id },
      data: {
        status: "CANCELLED", // ใช้ CANCELLED แทน PAYMENT_FAILED
        // หมายเหตุ: ไม่มี paymentMethod หรือ stripePaymentIntentId field ใน Order model
      },
    });

    console.log("Order marked as payment failed:", orderNumber);

  } catch (error) {
    console.error("Error handling payment failure:", error);
  }
}
