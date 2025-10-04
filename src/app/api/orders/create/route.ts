import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";
// import { orders_status } from "@prisma/client";
import { ensureUserExists } from "@/lib/user-utils";

interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

interface CreateOrderRequest {
  // Order details
  orderNumber: string;
  totalAmount: number;
  discountAmount?: number;
  discountCode?: string;
  
  // Payment details
  paymentType: string;
  paymentMethodType?: string; // e.g., 'credit_card', 'bank_transfer', 'e_wallet', 'cash_on_delivery'
  paymentMethodId?: string;   // optional explicit PaymentMethod id
  depositAmount?: number;
  remainingAmount?: number;
  
  // Shipping details
  shippingOptionId: string;
  shippingMethod: string;
  shippingFee: number;
  
  // Customer details
  customerName: string;
  customerEmail?: string;
  customerPhone: string;
  shippingAddress: string;
  
  // Order flags
  hasPets: boolean;
  requiresDeposit: boolean;
  
  // Items
  items: OrderItem[];
}

export async function POST(request: NextRequest) {
  console.log("🚀 === ORDER API ROUTE CALLED ===");
  
  try {
    console.log("Order API called");
    
    // Debug: Test authentication first
    console.log("🔍 Testing authentication...");
    
    const authenticatedUser = await getAuthenticatedUser(request);
    console.log("Auth user:", authenticatedUser?.id ? "Found" : "Not found");
    console.log("Auth user details:", {
      id: authenticatedUser?.id,
      lineUserId: authenticatedUser?.lineUserId,
      displayName: authenticatedUser?.displayName,
      source: authenticatedUser?.source
    });

    if (!authenticatedUser?.id) {
      return NextResponse.json(
        { error: "Unauthorized - User not found" },
        { status: 401 }
      );
    }

    // ตรวจสอบและสร้าง user ในฐานข้อมูลหากยังไม่มี - ใช้ข้อมูลจาก authenticated user
    console.log("🔍 Ensuring user exists for:", authenticatedUser);
    
    // ค้นหา user ในฐานข้อมูลโดยใช้ lineUserId
    let user = await prisma.user.findUnique({
      where: { lineUserId: authenticatedUser.lineUserId || authenticatedUser.id }
    });
    
    if (!user) {
      console.log("User not found, attempting to find by ID:", authenticatedUser.id);
      user = await prisma.user.findUnique({
        where: { id: authenticatedUser.id }
      });
    }
    
    if (!user) {
      console.error("❌ User not found in database with lineUserId:", authenticatedUser.lineUserId, "or ID:", authenticatedUser.id);
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }
    console.log("✅ User confirmed exists with ID:", user.id);

    let orderData: CreateOrderRequest;
    try {
      orderData = await request.json();
      console.log("Order data received:", {
        orderNumber: orderData.orderNumber,
        itemsCount: orderData.items?.length || 0,
        totalAmount: orderData.totalAmount,
        customerName: orderData.customerName,
        shippingOptionId: orderData.shippingOptionId,
        paymentType: orderData.paymentType
      });
      console.log("Full order data:", JSON.stringify(orderData, null, 2));
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body" },
        { status: 400 }
      );
    }

    // Validate required fields
    if (!orderData.customerName || !orderData.customerPhone) {
      return NextResponse.json(
        { error: "Missing required fields: customerName and customerPhone are required" },
        { status: 400 }
      );
    }

    // Generate orderNumber if not provided or ensure uniqueness
    if (!orderData.orderNumber) {
      orderData.orderNumber = `OR${Date.now().toString().slice(-8)}`;
      console.log("Generated orderNumber:", orderData.orderNumber);
    }

    // Check if orderNumber already exists and generate a new one if needed
    let orderNumberExists = await prisma.order.findFirst({
      where: { orderNumber: orderData.orderNumber } as any
    });

    let attempts = 0;
    while (orderNumberExists && attempts < 10) {
      attempts++;
      const timestamp = Date.now().toString().slice(-8);
      const randomSuffix = Math.floor(Math.random() * 100).toString().padStart(2, '0');
      orderData.orderNumber = `OR${timestamp}${randomSuffix}`;
      
      orderNumberExists = await prisma.order.findFirst({
        where: { orderNumber: orderData.orderNumber } as any
      });
      
      console.log(`Retry ${attempts}: Generated new orderNumber:`, orderData.orderNumber);
    }

    if (orderNumberExists) {
      return NextResponse.json(
        { error: "Failed to generate unique order number after multiple attempts" },
        { status: 500 }
      );
    }

    if (!orderData.items || orderData.items.length === 0) {
      return NextResponse.json(
        { error: "Order must contain at least one item" },
        { status: 400 }
      );
    }

    // Verify that all products exist and have sufficient stock
    const productIds = orderData.items.map(item => item.productId);
    console.log("Looking up products:", productIds);
    console.log("Product IDs type check:", productIds.map(id => typeof id));
    
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: {
        id: true,
        name: true,
        stock: true,
        price: true
      }
    });
    
    console.log("Found products:", products.length);
    console.log("Product details:", products.map(p => ({ id: p.id, name: p.name, stock: p.stock })));

    if (products.length !== productIds.length) {
      const foundIds = products.map(p => p.id);
      const missingIds = productIds.filter(id => !foundIds.includes(id));
      console.error("Missing products:", missingIds);
      console.error("Requested product IDs:", productIds);
      console.error("Found product IDs:", foundIds);
      
      return NextResponse.json(
        { error: `Products not found: ${missingIds.join(', ')}. Requested: ${productIds.join(', ')}, Found: ${foundIds.join(', ')}` },
        { status: 400 }
      );
    }

    // Check stock for each item
    for (const item of orderData.items) {
      const product = products.find(p => p.id === item.productId);
      if (!product) {
        return NextResponse.json(
          { error: `Product ${item.productId} not found` },
          { status: 400 }
        );
      }
      
      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for product ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` },
          { status: 400 }
        );
      }
    }

    // Verify shipping option exists
    console.log("Looking up shipping option:", orderData.shippingOptionId);
    console.log("Shipping option ID type:", typeof orderData.shippingOptionId);
    console.log("Shipping option ID length:", orderData.shippingOptionId?.length);
    
    // ตรวจสอบว่ามี shippingOptionId หรือไม่
    if (!orderData.shippingOptionId || orderData.shippingOptionId.trim() === "") {
      console.error("Missing or empty shippingOptionId:", {
        value: orderData.shippingOptionId,
        type: typeof orderData.shippingOptionId
      });
      return NextResponse.json(
        { error: "Shipping option is required" },
        { status: 400 }
      );
    }
    
    const shippingOption = await prisma.shippingOption.findUnique({
      where: { id: orderData.shippingOptionId }
    });

    if (!shippingOption) {
      console.error("Shipping option not found:", orderData.shippingOptionId);
      
      // แสดงรายการ shipping options ที่มีอยู่
      const availableOptions = await prisma.shippingOption.findMany({
        select: { id: true, name: true }
      });
      console.log("Available shipping options:", availableOptions);
      
      return NextResponse.json(
        { error: `Shipping option not found: ${orderData.shippingOptionId}. Available options: ${availableOptions.map(o => `${o.id}:${o.name}`).join(', ')}` },
        { status: 400 }
      );
    }
    
    console.log("Found shipping option:", shippingOption.name);

    // Create order in a transaction
    console.log("Starting database transaction");
    console.log("👤 Authenticated User ID:", authenticatedUser.id);
    console.log("👤 Database User ID:", user.id);
    
    // ใช้ user.id สำหรับ order
    const userIdForOrder = user.id;
    console.log("🔑 Final User ID for order:", userIdForOrder);
    
    console.log("Final order data before transaction:", {
      orderNumber: orderData.orderNumber,
      userId: userIdForOrder,
      shippingOptionId: orderData.shippingOptionId,
      items: orderData.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      }))
    });
    
    const result = await prisma.$transaction(async (tx) => {
      // Resolve payment method from provided type or id (optional)
      let resolvedPaymentMethod: { id: string; type: string } | null = null;
      try {
        if (orderData.paymentMethodId) {
          const pm = await tx.paymentMethod.findUnique({ where: { id: orderData.paymentMethodId }, select: { id: true, type: true } });
          if (pm) resolvedPaymentMethod = pm;
        } else if (orderData.paymentMethodType) {
          const pm = await tx.paymentMethod.findFirst({ where: { type: orderData.paymentMethodType }, select: { id: true, type: true } });
          if (pm) resolvedPaymentMethod = pm;
        }
      } catch (e) {
        console.warn("Could not resolve payment method:", e);
      }
      // Create the order
      console.log("Creating order record");
      const order = await tx.order.create({
        data: {
          orderNumber: orderData.orderNumber,
          userId: userIdForOrder,
          status: "PENDING" as any,
          totalAmount: orderData.totalAmount,
          discountAmount: orderData.discountAmount || 0,
          discountCode: orderData.discountCode,
          paymentType: orderData.paymentType,
          paymentMethod: resolvedPaymentMethod?.type,
          paymentMethodId: resolvedPaymentMethod?.id,
          depositAmount: orderData.depositAmount,
          remainingAmount: orderData.remainingAmount,
          shippingOptionId: orderData.shippingOptionId,
          shippingMethod: orderData.shippingMethod,
          shippingFee: orderData.shippingFee,
          customerName: orderData.customerName,
          customerEmail: orderData.customerEmail,
          customerPhone: orderData.customerPhone,
          shippingAddress: orderData.shippingAddress,
          hasPets: orderData.hasPets,
          requiresDeposit: orderData.requiresDeposit,
        } as any,
      });

      // Create order items
      const orderItems = await Promise.all(
        orderData.items.map(item =>
          tx.orderItem.create({
            data: {
              orderId: order.id,
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
            },
          })
        )
      );

      // Update product stock
      await Promise.all(
        orderData.items.map(item =>
          tx.product.update({
            where: { id: item.productId },
            data: {
              stock: {
                decrement: item.quantity,
              },
            },
          })
        )
      );

      // Update discount code usage if applicable
      if (orderData.discountCode) {
        await tx.discountCode.updateMany({
          where: { code: orderData.discountCode },
          data: {
            usageCount: {
              increment: 1,
            },
          },
        });
      }

      return {
        order,
        orderItems,
      };
    });

    // Return the created order with items
    const orderWithItems = await prisma.order.findUnique({
      where: { id: result.order.id },
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
        // shippingOption: true,
        user: {
          select: {
            id: true,
            displayName: true,
            email: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Order created successfully",
      order: orderWithItems,
    });

  } catch (error: any) {
    console.error("=== CRITICAL ERROR IN ORDER API ===");
    console.error("Error creating order:", error);
    console.error("Error type:", typeof error);
    console.error("Error constructor:", error?.constructor?.name);
    console.error("Error stack:", error?.stack);
    
    // Try to stringify error safely
    try {
      console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (stringifyError) {
      console.error("Could not stringify error:", stringifyError);
    }
    
    if (error?.code) {
      console.error("Error code:", error.code);
    }
    if (error?.meta) {
      console.error("Error meta:", error.meta);
    }
    
    // Always return a proper error response, never empty
    let errorMessage = "Internal server error";
    let statusCode = 500;
    
    if (error instanceof Error) {
      console.error("Error details:", {
        name: error.name,
        message: error.message,
        stack: error.stack,
        cause: error.cause
      });
      
      // ตรวจสอบ Prisma error codes
      if (error.message.includes("P2002")) {
        errorMessage = "Order number already exists";
        statusCode = 409;
      } else if (error.message.includes("P2003")) {
        console.error("Foreign key constraint violation details:", error.message);
        errorMessage = "Invalid product or shipping option reference";
        statusCode = 400;
      } else if (error.message.includes("P2025")) {
        errorMessage = "Record not found";
        statusCode = 404;
      } else if (error.message.includes("connect ECONNREFUSED")) {
        errorMessage = "Database connection failed";
        statusCode = 503;
      } else {
        // Include the actual error message for debugging
        errorMessage = `Internal server error: ${error.message}`;
      }
      
      console.error("Full error message:", error.message);
    }
    
    // Make sure we ALWAYS return a proper JSON response
    try {
      return NextResponse.json(
        { 
          error: errorMessage,
          timestamp: new Date().toISOString(),
          debug: process.env.NODE_ENV === 'development' ? {
            errorType: error?.constructor?.name,
            errorMessage: error?.message
          } : undefined
        },
        { status: statusCode }
      );
    } catch (responseError) {
      console.error("Failed to create error response:", responseError);
      // Fallback response
      return new Response(
        JSON.stringify({ error: "Critical server error" }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }
  }
}
