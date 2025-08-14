import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

interface OrderItem {
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface ReceiptData {
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  customerPhone?: string;
  items: OrderItem[];
  subtotal: number;
  shippingFee: number;
  discountAmount: number;
  total: number;
  paymentType: "FULL_PAYMENT" | "DEPOSIT_PAYMENT";
  depositAmount?: number;
  remainingAmount?: number;
  shippingMethod: string;
  shippingAddress?: string;
}

export async function POST(request: NextRequest) {
  console.log("🚀 LINE API called");
  
  try {
    const session = await getServerSession(authOptions);
    console.log("👤 LINE User ID:", session?.user?.lineUserId);

    if (!session?.user?.lineUserId) {
      console.error("❌ No LINE user ID found in session");
      console.log("Session user:", session?.user);
      
      // ถ้าไม่มี LINE login ให้ skip การส่ง LINE message
      return NextResponse.json(
        { 
          success: false, 
          message: "LINE messaging requires LINE login",
          skipLine: true 
        },
        { status: 200 }
      );
    }

    console.log("📝 Parsing receipt data...");
    const receiptData: ReceiptData = await request.json();
    console.log("📊 Receipt data:", {
      orderNumber: receiptData.orderNumber,
      customerName: receiptData.customerName,
      total: receiptData.total,
      itemsCount: receiptData.items?.length
    });

    // สร้าง flex message สำหรับใบเสร็จ
    console.log("🔧 Creating flex message...");
    const flexMessage = createReceiptFlexMessage(receiptData);
    console.log("✅ Flex message created successfully");

    // ตรวจสอบว่ามี LINE_CHANNEL_ACCESS_TOKEN หรือไม่
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    
    if (!channelAccessToken) {
      console.warn("LINE_CHANNEL_ACCESS_TOKEN is not configured. Skipping LINE message.");
      return NextResponse.json({ 
        success: false, 
        message: "LINE messaging is not configured",
        skipLine: true 
      });
    }

    // ส่ง message ไปยัง LINE user
    console.log("🚀 Calling sendLineMessage...");
    const lineResponse = await sendLineMessage(session.user.lineUserId, flexMessage);
    console.log("📨 sendLineMessage completed");

    return NextResponse.json({ success: true, message: "Receipt sent to LINE successfully" });
  } catch (error: any) {
    console.error("🚨 LINE API Error:", error);
    console.error("Error type:", typeof error);
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    
    // ถ้าเป็น configuration error ให้ return skipLine
    if (error?.message === "LINE_API_NOT_CONFIGURED" || 
        error?.message?.includes("Authentication failed") ||
        error?.message?.includes("LINE_CHANNEL_ACCESS_TOKEN is not configured")) {
      console.warn("LINE API is not properly configured. Skipping LINE message.");
      return NextResponse.json(
        { 
          success: false, 
          message: "LINE messaging is not configured properly",
          skipLine: true 
        },
        { status: 200 }
      );
    }
    
    return NextResponse.json(
      { error: "Failed to send LINE receipt", details: error?.message },
      { status: 500 }
    );
  }
}

function createReceiptFlexMessage(data: ReceiptData) {
  // สร้าง items สำหรับแสดงในใบเสร็จแบบ minimal
  const itemBoxes = data.items.map((item, index) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "text",
        text: `${item.productName} x${item.quantity}`,
        size: "sm",
        color: "#333333",
        wrap: true
      },
      {
        type: "text",
        text: `฿${item.total.toLocaleString()}`,
        size: "sm",
        color: "#333333",
        weight: "bold",
        align: "end"
      }
    ],
    margin: index === 0 ? "md" : "sm"
  }));

  // คำนวณยอดที่ต้องจ่าย
  const finalAmount = data.paymentType === "DEPOSIT_PAYMENT" 
    ? data.depositAmount || 0
    : data.total;

  return {
    type: "flex",
    altText: `🧾 ใบเสร็จ CorgiShop #${data.orderNumber}`,
    contents: {
      type: "bubble",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          // Simple Header
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "🐕 CorgiShop",
                size: "lg",
                color: "#FF6B35",
                weight: "bold",
                align: "center"
              },
              {
                type: "text",
                text: `ใบเสร็จ #${data.orderNumber}`,
                size: "sm",
                color: "#666666",
                align: "center",
                margin: "sm"
              }
            ]
          },

          // Separator
          {
            type: "separator",
            margin: "lg"
          },

          // Customer Info (Minimal)
          {
            type: "text",
            text: `ลูกค้า: ${data.customerName}`,
            size: "sm",
            color: "#666666",
            margin: "md"
          },

          // Items List (Minimal)
          ...itemBoxes,

          // Separator
          {
            type: "separator",
            margin: "lg"
          },

          // Payment Amount (Highlighted)
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: data.paymentType === "DEPOSIT_PAYMENT" 
                  ? "💳 ยอดชำระมัดจำ (20%)" 
                  : "💰 ยอดที่ต้องชำระ",
                size: "md",
                color: "#333333",
                weight: "bold",
                align: "center"
              },
              {
                type: "text",
                text: `฿${finalAmount.toLocaleString()}`,
                size: "xxl",
                color: "#FF6B35",
                weight: "bold",
                align: "center",
                margin: "md"
              },
              ...(data.paymentType === "DEPOSIT_PAYMENT" ? [{
                type: "text",
                text: `ยอดคงเหลือ: ฿${data.remainingAmount?.toLocaleString()} (ชำระเมื่อรับสินค้า)`,
                size: "sm",
                color: "#666666",
                align: "center",
                margin: "sm"
              }] : [])
            ],
            paddingAll: "lg",
            backgroundColor: "#F8F9FA",
            cornerRadius: "8px",
            margin: "lg"
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "ขอบคุณที่ใช้บริการ 🐾",
            size: "sm",
            color: "#999999",
            align: "center"
          }
        ],
        paddingAll: "md"
      }
    }
  };
}

async function sendLineMessage(lineUserId: string, message: any) {
  console.log("📤 Sending LINE message to:", lineUserId);
  
  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
  
  if (!channelAccessToken) {
    console.error("❌ LINE_CHANNEL_ACCESS_TOKEN is not configured");
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not configured");
  }

  console.log("🔑 Using channel access token:", channelAccessToken ? "✅ Found" : "❌ Missing");
  
  const payload = {
    to: lineUserId,
    messages: [message],
  };
  
  console.log("📦 LINE API payload:", JSON.stringify(payload, null, 2));

  try {
    const response = await fetch("https://api.line.me/v2/bot/message/push", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("📡 LINE API response status:", response.status);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ LINE API error response:", errorText);
      
      // ถ้าเป็น authentication error ให้ถือว่าเป็น configuration issue
      if (response.status === 401) {
        console.warn("LINE API authentication failed - likely due to invalid or missing access token");
        throw new Error("LINE_API_NOT_CONFIGURED");
      }
      
      throw new Error(`LINE API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log("✅ LINE message sent successfully:", result);
    return response;
    
  } catch (error) {
    console.error("🚨 Error in sendLineMessage:", error);
    throw error;
  }
}