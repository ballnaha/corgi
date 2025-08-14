import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
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
  console.log("📅 Request method:", request.method);
  console.log("🔗 Request URL:", request.url);
  console.log("⏰ Current time:", new Date().toISOString());
  
  try {
    console.log("Order API called");
    
    // Test return เพื่อดูว่า API ทำงานหรือไม่
    // return NextResponse.json({ test: "API is working" }, { status: 200 });
    
    const session = await getServerSession(authOptions);
    console.log("Session:", session?.user?.id ? "Found" : "Not found");
    console.log("Session user:", {
      id: session?.user?.id,
      name: session?.user?.name,
      email: session?.user?.email
    });

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized - User not found" },
        { status: 401 }
      );
    }

    // ตรวจสอบและสร้าง user ในฐานข้อมูลหากยังไม่มี
    console.log("🔍 Ensuring user exists for:", session.user);
    const user = await ensureUserExists(session.user);
    console.log("👤 User after ensureUserExists:", user);
    
    if (!user) {
      console.error("❌ Failed to ensure user exists");
      return NextResponse.json(
        { error: "Failed to create or find user in database" },
        { status: 500 }
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
    console.log("👤 Session User ID:", session.user.id);
    console.log("👤 Ensured User ID:", user.id);
    console.log("🆔 User IDs match:", session.user.id === user.id);
    
    // ใช้ user.id แทน session.user.id เพื่อความแน่ใจ
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
    
    if (error?.code) {
      console.error("Error code:", error.code);
    }
    if (error?.meta) {
      console.error("Error meta:", error.meta);
    }
    
    // ส่ง error message ที่เฉพาะเจาะจงมากขึ้น
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
      }
      
      // แสดง error message เต็ม ๆ เพื่อ debug
      console.error("Full error message:", error.message);
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
