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
    const inferredPaymentMethod = 'bank_transfer';
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

    // Generate standardized filename for database storage BEFORE upload
    const currentDate = new Date();
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const date = String(currentDate.getDate()).padStart(2, '0');
    const dateString = `${year}_${month}_${date}`;
    
    // Get file extension from original filename
    const fileExtension = paymentSlip.name ? paymentSlip.name.split('.').pop() : 'jpg';
    const standardFileName = `payment-slip-${orderNumber}-${dateString}.${fileExtension}`;

    // Upload payment slip image to folder with standard filename
    const uploadFormData = new FormData();
    uploadFormData.append("paymentSlip", paymentSlip);
    uploadFormData.append("customFileName", standardFileName);

    const uploadResponse = await fetch(`${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/api/upload/payment-slip`, {
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

    console.log("Generated standard filename for DB:", standardFileName, "length:", standardFileName.length);
    console.log("Actual file saved as:", uploadResult.paymentSlipFileName);

    // Truncate only fields that might vary in length
    const truncateString = (str: string | null | undefined, maxLength: number = 255): string | null => {
      if (!str) return null;
      if (typeof str !== 'string') return String(str).substring(0, maxLength);
      return str.length > maxLength ? str.substring(0, maxLength) : str;
    };

    const truncatedMimeType = truncateString(paymentSlip.type, 100);
    const truncatedNote = truncateString(note, 500);

    // Create payment notification record with file path instead of base64
    console.log("=== PREPARING PAYMENT NOTIFICATION DATA ===");
    console.log("Upload API returned filename:", uploadResult.paymentSlipFileName, "length:", uploadResult.paymentSlipFileName?.length);
    console.log("Our standard filename:", standardFileName, "length:", standardFileName.length);
    console.log("Original mimetype:", paymentSlip.type, "length:", paymentSlip.type?.length);
    console.log("Truncated mimetype:", truncatedMimeType, "length:", truncatedMimeType?.length);
    console.log("Original note:", note, "length:", note?.length);
    console.log("Truncated note:", truncatedNote, "length:", truncatedNote?.length);
    
    // Final validation before database insert - standard filename should always be short
    if (standardFileName.length > 100) {
      console.error("CRITICAL: Standard filename too long!", standardFileName.length);
      throw new Error(`Standard filename too long: ${standardFileName.length} characters`);
    }
    
    if (truncatedMimeType && truncatedMimeType.length > 100) {
      console.error("CRITICAL: MimeType still too long after truncation!", truncatedMimeType.length);
      throw new Error(`MimeType still too long: ${truncatedMimeType.length} characters`);
    }
    
    // Create standardized URL path using our standard filename
    const standardSlipUrl = `/uploads/payment-slips/${standardFileName}`;
    
    console.log("Creating payment notification with data:", {
      orderId: order.id,
      transferAmount: transferAmount.toString(),
      transferDate: `${transferDate}T${transferTime}:00`,
      transferTime,
      originalUploadUrl: uploadResult.paymentSlipUrl, // Original file location
      standardSlipUrl: standardSlipUrl, // Standardized URL
      paymentSlipMimeType: truncatedMimeType,
      paymentSlipFileName: standardFileName,
      note: truncatedNote,
    });

    const paymentNotification = await prisma.paymentNotification.create({
      data: {
        orderId: order.id,
        transferAmount: transferAmount.toString(),
        transferDate: new Date(`${transferDate}T${transferTime}:00`),
        transferTime,
        note: truncatedNote || null,
        paymentSlipData: standardSlipUrl, // Use standard URL path
        paymentSlipMimeType: truncatedMimeType,
        paymentSlipFileName: standardFileName,
        submittedAt: new Date(),
      },
    });

    // Update order status to indicate payment notification received
    await prisma.order.update({
      where: { id: order.id },
      data: {
        status: "PAYMENT_PENDING" as any,
        paymentMethod: inferredPaymentMethod,
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