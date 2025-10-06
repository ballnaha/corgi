import { NextRequest, NextResponse } from "next/server";
import { getStripeServer } from "@/lib/stripe-server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  let body: any = {}; // เก็บไว้สำหรับ error handling
  
  try {
    console.log("=== STRIPE CHECKOUT SESSION START ===");
    console.log("Request method:", request.method);
    console.log("Request URL:", request.url);
    console.log("Environment check:");
    console.log("  - STRIPE_SECRET_KEY exists:", !!process.env.STRIPE_SECRET_KEY);
    console.log("  - NEXTAUTH_SECRET exists:", !!process.env.NEXTAUTH_SECRET);
    console.log("  - NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
    
    // ตรวจสอบการ authentication
    console.log("Checking authentication...");
    const authUser = await getAuthenticatedUser(request);
    console.log("Auth result:", authUser ? `User ${authUser.id}` : "No auth");
    if (!authUser?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    body = await request.json();
    const { 
      orderData,
      customerInfo,
      shippingAddress,
      totalAmount,
      orderNumber
    } = body;

    // แยกข้อมูล items จาก orderData
    const { items, ...orderDataWithoutItems } = orderData || {};

    console.log("Creating Stripe checkout session for order:", orderNumber);
    console.log("Amount:", totalAmount);
    console.log("Auth user:", authUser);
    console.log("Order items:", items);

    // หา user ในฐานข้อมูล
    let user = await prisma.user.findUnique({
      where: { lineUserId: authUser.lineUserId || authUser.id }
    });
    
    if (!user) {
      user = await prisma.user.findUnique({
        where: { id: authUser.id }
      });
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found in database" },
        { status: 404 }
      );
    }

  console.log("Found user:", user.id);

  // Initialize Stripe early to catch config issues before DB work
  const stripe = getStripeServer();
    
    // บันทึก order ข้อมูลชั่วคราวเพื่อใช้หลัง payment สำเร็จ
    // Remove paymentMethodType from orderDataWithoutItems as it's not in schema
    const { paymentMethodType, ...validOrderData } = orderDataWithoutItems || {};
    
    await prisma.order.create({
      data: {
        ...validOrderData,
        // ensure payment method is captured on pre-created order
        paymentMethod: paymentMethodType || 'credit_card',
        orderNumber,
        userId: user.id, // เพิ่ม userId ที่จำเป็น
        status: "PAYMENT_PENDING", // ใช้ค่าที่ valid ใน orders_status enum
        ...(validOrderData?.paymentMethodId ? { paymentMethodId: validOrderData.paymentMethodId } : {}),
        orderItems: {
          create: items?.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            price: item.price,
          })) || [],
        },
      }
    });

    // ดึงข้อมูลสินค้าจาก database เพื่อให้ได้ชื่อสินค้า
    const productIds = items?.map((item: any) => item.productId) || [];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true, description: true }
    });

    // เตรียม line items จากสินค้าจริง
    const lineItems = items?.map((item: any) => {
      const product = products.find(p => p.id === item.productId);
      return {
        price_data: {
          currency: 'thb',
          product_data: {
            name: product?.name || `สินค้า ID: ${item.productId}`,
            description: product?.description || `จำนวน: ${item.quantity} ชิ้น`,
          },
          unit_amount: Math.round((item.price || 0) * 100), // Stripe ใช้ cents
        },
        quantity: item.quantity,
      };
    }) || [];

    // เพิ่ม shipping fee ถ้ามี
    if (orderDataWithoutItems.shippingFee && orderDataWithoutItems.shippingFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'thb',
          product_data: {
            name: 'ค่าจัดส่ง',
            description: orderDataWithoutItems.shippingMethod || 'การจัดส่ง',
          },
          unit_amount: Math.round(orderDataWithoutItems.shippingFee * 100),
        },
        quantity: 1,
      });
    }

    // หมายเหตุ: ไม่เพิ่มส่วนลดเป็น line item แยก เพราะ Stripe อาจไม่รองรับ negative amount
    // ส่วนลดจะคำนวณรวมไว้ใน totalAmount แล้ว
    // 
    // เพิ่มส่วนลดเป็น line item แยกถ้าต้องการ (อาจมีปัญหา)
    // if (orderDataWithoutItems.discountAmount && orderDataWithoutItems.discountAmount > 0) {
    //   lineItems.push({
    //     price_data: {
    //       currency: 'thb',
    //       product_data: {
    //         name: `ส่วนลด`,
    //         description: orderDataWithoutItems.discountCode ? `รหัส: ${orderDataWithoutItems.discountCode}` : 'ส่วนลดพิเศษ',
    //       },
    //       unit_amount: -Math.round(orderDataWithoutItems.discountAmount * 100), // negative for discount
    //     },
    //     quantity: 1,
    //   });
    // }

    console.log("Final line items for Stripe:", JSON.stringify(lineItems, null, 2));

    // Validate line items
    if (!lineItems || lineItems.length === 0) {
      console.error("No line items found for checkout session");
      return NextResponse.json(
        { error: "No items to checkout" },
        { status: 400 }
      );
    }

    // ตรวจสอบว่า line items มี unit_amount ที่ valid
    let calculatedTotal = 0;
    for (const item of lineItems) {
      if (!item.price_data?.unit_amount) {
        console.error("Missing unit_amount in line item:", item);
        return NextResponse.json(
          { error: "Invalid item price detected" },
          { status: 400 }
        );
      }
      if (item.price_data.unit_amount <= 0) {
        console.error("Invalid unit_amount (zero or negative) in line item:", item);
        return NextResponse.json(
          { error: "Item price must be greater than zero" },
          { status: 400 }
        );
      }
      calculatedTotal += item.price_data.unit_amount * item.quantity;
    }

    console.log("Calculated total from line items:", calculatedTotal / 100);
    console.log("Expected total amount:", totalAmount);
    
    // เตือนถ้าจำนวนเงินไม่ตรงกัน
    const expectedTotalCents = Math.round(totalAmount * 100);
    if (Math.abs(calculatedTotal - expectedTotalCents) > 1) { // tolerance 1 cent
      console.warn("Total amount mismatch:", {
        calculated: calculatedTotal / 100,
        expected: totalAmount,
        difference: (calculatedTotal - expectedTotalCents) / 100
      });
    }

    // คำนวณส่วนลดสำหรับ Stripe (ส่วนลดเฉพาะค่าสินค้า ไม่รวม FREESHIP)
    const rawDiscountAmount = Number(orderDataWithoutItems.discountAmount || 0);
    const shippingFeeForDiscount = orderDataWithoutItems.discountCode === 'FREESHIP'
      ? Number(orderDataWithoutItems.shippingFee || 0)
      : 0;
    const productDiscountAmount = Math.max(0, rawDiscountAmount - shippingFeeForDiscount);

    let discounts: any[] | undefined = undefined;
    if (productDiscountAmount > 0) {
      try {
        const coupon = await stripe.coupons.create({
          amount_off: Math.round(productDiscountAmount * 100),
          currency: 'thb',
          duration: 'once',
          name: orderDataWithoutItems.discountCode ? `ส่วนลด ${orderDataWithoutItems.discountCode}` : 'ส่วนลดคำสั่งซื้อ',
        });
        discounts = [{ coupon: coupon.id }];
        console.log('Created Stripe coupon for discount:', {
          productDiscountAmount,
          couponId: coupon.id,
        });
      } catch (couponError) {
        console.warn('Failed to create Stripe coupon, proceeding without discount:', couponError);
      }
    }

    // สร้าง Stripe Checkout Session
    const customerEmail = customerInfo?.email && String(customerInfo.email).includes('@')
      ? String(customerInfo.email)
      : undefined;
    let session;
    try {
      session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: lineItems,
        mode: 'payment',
        success_url: `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_number=${orderNumber}`,
        cancel_url: `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/checkout/cancelled`,
        ...(customerEmail ? { customer_email: customerEmail } : {}),
        // ใช้คูปองส่วนลดถ้ามี
        ...(discounts ? { discounts } : {}),
        // ปิด billing_address_collection และ shipping_address_collection
        metadata: {
          orderNumber,
          userId: authUser.id,
          customerName: customerInfo.name,
          customerEmail: customerEmail || '',
          customerPhone: customerInfo.phone,
        },
      });
    } catch (sessionError: any) {
      // บางเวอร์ชันของ API อาจไม่รองรับ discounts ที่ session-level
      const msg = sessionError?.message || '';
      const code = sessionError?.code || '';
      const type = sessionError?.type || '';
      console.warn('Primary session creation failed, retrying without discounts...', { msg, code, type });
      try {
        session = await stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: lineItems,
          mode: 'payment',
          success_url: `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_number=${orderNumber}`,
          cancel_url: `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/checkout/cancelled`,
          ...(customerEmail ? { customer_email: customerEmail } : {}),
          metadata: {
            orderNumber,
            userId: authUser.id,
            customerName: customerInfo.name,
            customerEmail: customerEmail || '',
            customerPhone: customerInfo.phone,
          },
        });
      } catch (retryError) {
        throw retryError;
      }
    }

    console.log("Checkout session created:", session.id);
    console.log("Checkout URL:", session.url);

    return NextResponse.json({
      success: true,
      sessionId: session.id,
      checkoutUrl: session.url,
    });

  } catch (error: any) {
    console.error("=== STRIPE CHECKOUT ERROR ===");
    console.error("Error type:", error?.constructor?.name);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Error type field:", error?.type);
    console.error("Error stack:", error?.stack);
    
    // Log ข้อมูลที่เกี่ยวข้อง (ใช้ try-catch เพื่อป้องกัน error)
    try {
      console.error("Request body received:", {
        hasOrderData: !!body?.orderData,
        hasCustomerInfo: !!body?.customerInfo,
        totalAmount: body?.totalAmount,
        orderNumber: body?.orderNumber,
        itemsCount: body?.orderData?.items?.length || 0
      });
    } catch (logError) {
      console.error("Error logging request body:", logError);
    }
    
    try {
      console.error("Full error object:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    } catch (stringifyError) {
      console.error("Could not stringify error:", stringifyError);
    }
    
    // Configuration error (e.g., missing STRIPE_SECRET_KEY)
    if (error?.code === 'CONFIG_ERROR') {
      console.error("❌ CONFIG_ERROR detected");
      return NextResponse.json(
        {
          error: 'Stripe is not configured',
          details: error?.message,
          hint: 'Set STRIPE_SECRET_KEY in your environment',
        },
        { status: 500 }
      );
    }

    // ตรวจสอบ error แต่ละประเภท
    if (error?.code?.startsWith('P')) {
      // Prisma error
      console.error("❌ Prisma error detected");
      return NextResponse.json(
        { 
          error: "Database error while creating order", 
          details: error?.message,
          code: error?.code
        },
        { status: 500 }
      );
    }
    
    // Stripe error
    if (error?.type) {
      console.error("❌ Stripe error detected:", error?.type);
      return NextResponse.json(
        { 
          error: "Stripe API error", 
          details: error?.message,
          type: error?.type,
          code: error?.code
        },
        { status: 500 }
      );
    }
    
    // Generic error with maximum detail
    console.error("❌ Generic error, returning detailed response");
    return NextResponse.json(
      { 
        error: "Failed to create checkout session", 
        details: error?.message || String(error) || "Unknown error occurred",
        errorType: error?.constructor?.name || typeof error,
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}
