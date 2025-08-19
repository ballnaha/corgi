import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.lineUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();

    const orderNumber = formData.get("orderNumber") as string;
    const transferAmount = parseFloat(formData.get("transferAmount") as string);
    const transferDate = formData.get("transferDate") as string;
    const transferTime = formData.get("transferTime") as string;
    const note = formData.get("note") as string;
    const paymentSlip = formData.get("paymentSlip") as File;

    // Debug logging
    console.log("Payment notification data:", {
      orderNumber,
      transferAmount,
      transferDate,
      transferTime,
      hasPaymentSlip: !!paymentSlip,
      paymentSlipName: paymentSlip?.name,
    });

    // Validate required fields
    if (
      !orderNumber ||
      !transferAmount ||
      isNaN(transferAmount) ||
      transferAmount <= 0 ||
      !transferDate ||
      !transferTime ||
      !paymentSlip
    ) {
      return NextResponse.json(
        { error: "Missing required fields or invalid amount" },
        { status: 400 }
      );
    }

    // Find the order by orderNumber
    const order = await prisma.order.findFirst({
      where: { orderNumber },
      include: { user: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check if user owns this order
    if (order.user.lineUserId !== session.user.lineUserId) {
      return NextResponse.json(
        { error: "Unauthorized to access this order" },
        { status: 403 }
      );
    }

    // Upload payment slip image to folder
    const uploadFormData = new FormData();
    uploadFormData.append("paymentSlip", paymentSlip);

    const uploadResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/upload/payment-slip`, {
      method: "POST",
      headers: {
        // Don't set Content-Type header, let fetch handle it for FormData
        'Cookie': request.headers.get('cookie') || '', // Pass session cookies
      },
      body: uploadFormData,
    });

    if (!uploadResponse.ok) {
      const uploadError = await uploadResponse.text();
      console.error("Failed to upload payment slip:", uploadError);
      return NextResponse.json(
        { error: "Failed to upload payment slip image" },
        { status: 500 }
      );
    }

    const uploadResult = await uploadResponse.json();
    console.log("Payment slip uploaded successfully:", uploadResult);

    // Create payment notification record with file path instead of base64
    const paymentNotification = await prisma.paymentNotification.create({
      data: {
        orderId: order.id,
        transferAmount,
        transferDate: new Date(`${transferDate}T${transferTime}`),
        transferTime,
        note: note || null,
        paymentSlipData: uploadResult.paymentSlipUrl, // Store file URL instead of base64
        paymentSlipMimeType: paymentSlip.type,
        paymentSlipFileName: uploadResult.paymentSlipFileName,

        submittedAt: new Date(),
      },
    });

    // Update order status to indicate payment notification received
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAYMENT_PENDING" as any,
      },
    });

    // Send LINE notification to admins
    try {
      console.log("🔔 Sending admin LINE notification...");
      
      const adminNotificationData = {
        type: "PAYMENT_NOTIFICATION" as const,
        orderNumber: order.orderNumber || `#${order.id.slice(-8).toUpperCase()}`,
        customerName: order.customerName || order.user.displayName || "ลูกค้า",
        transferAmount: Number(transferAmount),
        transferDate: `${transferDate}T${transferTime}`,
        submittedAt: new Date().toISOString(),
        paymentSlipUrl: uploadResult.paymentSlipUrl,
        displayUrl: uploadResult.displayUrl,
      };

      const adminNotifyResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/api/line/notify-admin`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(adminNotificationData),
      });

      if (adminNotifyResponse.ok) {
        const result = await adminNotifyResponse.json();
        console.log("✅ Admin notification sent successfully:", result.message);
      } else {
        const error = await adminNotifyResponse.text();
        console.warn("⚠️ Failed to send admin notification:", error);
      }
    } catch (adminNotifyError) {
      console.warn("⚠️ Admin notification failed (non-critical):", adminNotifyError);
      // Don't fail the main payment notification if admin notification fails
    }

    return NextResponse.json({
      success: true,
      message: "Payment notification submitted successfully",
      paymentNotificationId: paymentNotification.id,
    });
  } catch (error) {
    console.error("Payment notification error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}