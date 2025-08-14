import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { 
  getStatusInfo, 
  getAvailableTransitions, 
  getNextRecommendedStatus,
  getStatusProgress
} from "@/lib/order-status";
import { ensureUserExists } from "@/lib/user-utils";

interface RouteParams {
  params: {
    orderId: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - User not found" },
        { status: 401 }
      );
    }

    // ตรวจสอบและสร้าง user หากจำเป็น
    const user = await ensureUserExists(session.user);
    if (!user) {
      return NextResponse.json(
        { error: "Failed to validate user" },
        { status: 500 }
      );
    }

    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Get order details
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        shippingOption: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or access denied" },
        { status: 404 }
      );
    }

    const currentStatus = order.status as OrderStatus;
    const statusInfo = getStatusInfo(currentStatus);
    const availableTransitions = getAvailableTransitions(currentStatus);
    const progress = getStatusProgress(currentStatus);
    
    // Get next recommended status
    const nextRecommendedStatus = getNextRecommendedStatus(currentStatus, {
      requiresDeposit: order.requiresDeposit || false,
      shippingMethod: order.shippingMethod || "",
      paymentType: order.paymentType || "FULL_PAYMENT"
    });

    // Get transition options with their info
    const transitionOptions = availableTransitions.map(status => ({
      status,
      info: getStatusInfo(status)
    }));

    return NextResponse.json({
      success: true,
      order: {
        id: order.id,
        orderNumber: order.orderNumber,
        currentStatus,
        statusInfo,
        progress,
        nextRecommendedStatus,
        availableTransitions,
        transitionOptions,
        orderDetails: {
          requiresDeposit: order.requiresDeposit || false,
          shippingMethod: order.shippingMethod || "",
          paymentType: order.paymentType || "FULL_PAYMENT",
          totalAmount: Number(order.totalAmount),
          createdAt: order.createdAt
        }
      }
    });

  } catch (error) {
    console.error("Error fetching order status info:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
