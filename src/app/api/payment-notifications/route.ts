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

    // Convert file to base64 for storage (in production, you'd upload to cloud storage)
    const bytes = await paymentSlip.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");
    const mimeType = paymentSlip.type;

    // Create payment notification record
    const paymentNotification = await prisma.paymentNotification.create({
      data: {
        orderId: order.id,
        transferAmount,
        transferDate: new Date(`${transferDate}T${transferTime}`),
        transferTime,
        note: note || null,
        paymentSlipData: base64Image,
        paymentSlipMimeType: mimeType,
        paymentSlipFileName: paymentSlip.name,
        status: "PENDING", // PENDING, APPROVED, REJECTED
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