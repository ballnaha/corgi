import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { OrderStatus } from "@/lib/order-status";
import { 
  canTransitionTo, 
  getStatusInfo, 
  getAvailableTransitions, 
  getNextRecommendedStatus 
} from "@/lib/order-status";
import { ensureUserExists, canAccessResource } from "@/lib/user-utils";

interface RouteParams {
  params: Promise<{
    orderId: string;
  }>;
}

export async function GET(request: NextRequest, context: RouteParams) {
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

    const { orderId } = await context.params;

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
        userId: session.user.id, // Ensure user can only access their own orders
      },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                breed: true,
                gender: true,
                age: true,
                price: true,
                salePrice: true,
                discountPercent: true,
                images: {
                  select: {
                    id: true,
                    imageUrl: true,
                    altText: true,
                    isMain: true,
                  },
                },
                categoryRef: {
                  select: {
                    id: true,
                    name: true,
                    key: true,
                  },
                },
              },
            },
          },
        },
        shippingOption: true,
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found or access denied" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      order,
    });

  } catch (error) {
    console.error("Error fetching order details:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest, context: RouteParams) {
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

    const { orderId } = await context.params;
    const { status } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    if (!status) {
      return NextResponse.json(
        { error: "Status is required" },
        { status: 400 }
      );
    }

    // Validate status values
    const validStatuses: OrderStatus[] = [
      "PENDING", "PAYMENT_PENDING", "CONFIRMED", "PROCESSING", 
      "SHIPPED", "DELIVERED", "CANCELLED"
    ];
    const upperCaseStatus = status.toUpperCase();
    
    if (!validStatuses.includes(upperCaseStatus as OrderStatus)) {
      return NextResponse.json(
        { error: `Invalid status value. Valid statuses: ${validStatuses.join(', ')}` },
        { status: 400 }
      );
    }

    // Check if order exists and belongs to user
    const existingOrder = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: session.user.id,
      },
      include: {
        shippingOption: true,
      },
    });

    if (!existingOrder) {
      return NextResponse.json(
        { error: "Order not found or access denied" },
        { status: 404 }
      );
    }

    // Check if status transition is allowed
    const currentStatus = existingOrder.status as OrderStatus;
    const newStatus = upperCaseStatus as OrderStatus;
    
    if (!canTransitionTo(currentStatus, newStatus)) {
      const availableTransitions = getAvailableTransitions(currentStatus);
      return NextResponse.json(
        { 
          error: `Cannot transition from ${currentStatus} to ${newStatus}. Available transitions: ${availableTransitions.join(', ')}`,
          currentStatus,
          availableTransitions
        },
        { status: 400 }
      );
    }

    // Update order status
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { status: newStatus },
      include: {
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
              },
            },
          },
        },
        shippingOption: true,
      },
    });

    return NextResponse.json({
      success: true,
      message: "Order status updated successfully",
      order: updatedOrder,
    });

  } catch (error) {
    console.error("Error updating order status:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
