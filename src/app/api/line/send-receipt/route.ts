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
          skipLine: true,
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
      itemsCount: receiptData.items?.length,
    });

    // สร้าง flex message สำหรับใบเสร็จ
    console.log("🔧 Creating flex message...");
    const flexMessage = createReceiptFlexMessage(receiptData);
    console.log("✅ Flex message created successfully");
    
    // Validate flex message
    try {
      validateFlexMessage(flexMessage);
      console.log("✅ Flex message validation passed");
    } catch (validationError) {
      console.error("❌ Flex message validation failed:", validationError);
      // Fall back to simple text message
      const simpleMessage = {
        type: "text",
        text: `🔔 การแจ้งเตือนการสั่งซื้อ\n` +
              `คำสั่งซื้อ: #${receiptData.orderNumber}\n` +
              `ลูกค้า: ${receiptData.customerName}\n` +
              `ยอดเงิน: ฿${receiptData.total.toLocaleString()}\n` +
              `กรุณาเข้าดูรายละเอียดและแจ้งชำระเงินที่: https://corgi.theredpotion.com/profile`
      };
      
      console.log("🔄 Using fallback text message");
      const lineResponse = await sendLineMessage(session.user.lineUserId, simpleMessage);
      console.log("📨 Fallback message sent with status:", lineResponse.status);
      
      return NextResponse.json({
        success: true,
        message: "Receipt sent to LINE successfully (fallback text)",
      });
    }

    // ตรวจสอบว่ามี LINE_CHANNEL_ACCESS_TOKEN หรือไม่
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!channelAccessToken) {
      console.warn(
        "LINE_CHANNEL_ACCESS_TOKEN is not configured. Skipping LINE message."
      );
      return NextResponse.json({
        success: false,
        message: "LINE messaging is not configured",
        skipLine: true,
      });
    }

    // ส่ง message ไปยัง LINE user
    console.log("🚀 Calling sendLineMessage...");
    console.log("🎯 Target LINE User ID:", session.user.lineUserId);
    console.log("📏 Flex message size:", JSON.stringify(flexMessage).length, "characters");
    
    const lineResponse = await sendLineMessage(
      session.user.lineUserId,
      flexMessage
    );
    console.log("📨 sendLineMessage completed with status:", lineResponse.status);

    return NextResponse.json({
      success: true,
      message: "Receipt sent to LINE successfully",
    });
  } catch (error: any) {
    console.error("🚨 LINE API Error:", error);
    console.error("Error type:", typeof error);
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);

    // ถ้าเป็น configuration error ให้ return skipLine
    if (
      error?.message === "LINE_API_NOT_CONFIGURED" ||
      error?.message?.includes("Authentication failed") ||
      error?.message?.includes("LINE_CHANNEL_ACCESS_TOKEN is not configured")
    ) {
      console.warn(
        "LINE API is not properly configured. Skipping LINE message."
      );
      return NextResponse.json(
        {
          success: false,
          message: "LINE messaging is not configured properly",
          skipLine: true,
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

function validateFlexMessage(message: any) {
  // Basic validation for flex message structure
  if (!message || typeof message !== 'object') {
    throw new Error('Message must be an object');
  }
  
  if (message.type !== 'flex') {
    throw new Error('Message type must be flex');
  }
  
  if (!message.contents || typeof message.contents !== 'object') {
    throw new Error('Contents must be an object');
  }
  
  if (message.contents.type !== 'bubble') {
    throw new Error('Contents type must be bubble');
  }
  
  if (!message.altText || typeof message.altText !== 'string') {
    throw new Error('altText must be a string');
  }
  
  // Check if message size is reasonable (LINE has limits)
  const messageSize = JSON.stringify(message).length;
  if (messageSize > 80000) { // 80KB limit for detailed flex message
    throw new Error(`Message too large: ${messageSize} characters`);
  }
  
  // Additional validations for flex message contents
  if (message.contents?.body?.contents && Array.isArray(message.contents.body.contents)) {
    const bodyContents = message.contents.body.contents;
    if (bodyContents.length > 50) { // Reasonable limit for body contents
      throw new Error(`Too many body contents: ${bodyContents.length}`);
    }
  }
  
  console.log(`✅ Flex message validation passed (${messageSize} characters)`);
}

function createReceiptFlexMessage(data: ReceiptData) {
  // คำนวณยอดที่ต้องจ่าย
  const finalAmount =
    data.paymentType === "DEPOSIT_PAYMENT"
      ? data.depositAmount || 0
      : data.total;

  // สร้าง detailed flex message พร้อมรายละเอียดครบถ้วน
  const itemsToShow = data.items.slice(0, 5); // แสดงสูงสุด 5 รายการ
  const remainingItems = data.items.length - itemsToShow.length;

  return {
    type: "flex",
    altText: `🔔 รอชำระเงิน ฿${finalAmount.toLocaleString()} - What Da Dog Pet Shop`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🐕 What Da Dog Pet Shop",
            weight: "bold",
            color: "#ffffff",
            size: "lg",
            align: "center"
          },
          {
            type: "text",
            text: "ร้านขายสัตว์เลี้ยงและอุปกรณ์คุณภาพ",
            color: "#ffffff",
            size: "xs",
            align: "center",
            margin: "sm"
          }
        ],
        paddingAll: "20px",
        backgroundColor: "#FF6B35",
        spacing: "sm"
      },
      body: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🔔 การแจ้งเตือนการสั่งซื้อ",
            weight: "bold",
            color: "#FF6B35",
            size: "lg",
            margin: "md"
          },
          {
            type: "separator",
            margin: "lg"
          },
          // Order Information Section
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: [
              {
                type: "text",
                text: "📋 ข้อมูลคำสั่งซื้อ",
                weight: "bold",
                color: "#333333",
                size: "md",
                margin: "sm"
              },
              {
                type: "box",
                layout: "horizontal",
                margin: "md",
                contents: [
                  {
                    type: "text",
                    text: "หมายเลขคำสั่งซื้อ:",
                    size: "sm",
                    color: "#555555",
                    flex: 3
                  },
                  {
                    type: "text",
                    text: `#${data.orderNumber}`,
                    size: "sm",
                    color: "#111111",
                    weight: "bold",
                    align: "end",
                    flex: 2
                  }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                margin: "sm",
                contents: [
                  {
                    type: "text",
                    text: "ชื่อลูกค้า:",
                    size: "sm",
                    color: "#555555",
                    flex: 3
                  },
                  {
                    type: "text",
                    text: data.customerName,
                    size: "sm",
                    color: "#111111",
                    align: "end",
                    wrap: true,
                    flex: 2
                  }
                ]
              },
              ...(data.customerPhone ? [{
                type: "box",
                layout: "horizontal",
                margin: "sm",
                contents: [
                  {
                    type: "text",
                    text: "เบอร์โทร:",
                    size: "sm",
                    color: "#555555",
                    flex: 3
                  },
                  {
                    type: "text",
                    text: data.customerPhone,
                    size: "sm",
                    color: "#111111",
                    align: "end",
                    flex: 2
                  }
                ]
              }] : []),
              {
                type: "box",
                layout: "horizontal",
                margin: "sm",
                contents: [
                  {
                    type: "text",
                    text: "การจัดส่ง:",
                    size: "sm",
                    color: "#555555",
                    flex: 3
                  },
                  {
                    type: "text",
                    text: data.shippingMethod,
                    size: "sm",
                    color: "#111111",
                    align: "end",
                    wrap: true,
                    flex: 2
                  }
                ]
              },
              {
                type: "box",
                layout: "horizontal",
                margin: "sm",
                contents: [
                  {
                    type: "text",
                    text: "วันที่สั่งซื้อ:",
                    size: "sm",
                    color: "#555555",
                    flex: 3
                  },
                  {
                    type: "text",
                    text: new Date().toLocaleDateString('th-TH', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      timeZone: 'Asia/Bangkok'
                    }),
                    size: "sm",
                    color: "#111111",
                    align: "end",
                    flex: 2
                  }
                ]
              }
            ]
          },
          {
            type: "separator",
            margin: "lg"
          },
          // Items Section
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: [
              {
                type: "text",
                text: `🛍️ รายการสินค้า (${data.items.length} รายการ)`,
                weight: "bold",
                color: "#333333",
                size: "md",
                margin: "sm"
              },
              ...itemsToShow.map((item, index) => ({
                type: "box",
                layout: "horizontal",
                margin: "md",
                contents: [
                  {
                    type: "text",
                    text: `${index + 1}. ${item.productName}`,
                    size: "sm",
                    color: "#333333",
                    flex: 4,
                    wrap: true
                  },
                  {
                    type: "text",
                    text: `x${item.quantity}`,
                    size: "sm",
                    color: "#666666",
                    align: "center",
                    flex: 1
                  },
                  {
                    type: "text",
                    text: `฿${item.total.toLocaleString()}`,
                    size: "sm",
                    color: "#111111",
                    weight: "bold",
                    align: "end",
                    flex: 2
                  }
                ]
              })),
              ...(remainingItems > 0 ? [{
                type: "text",
                text: `... และอีก ${remainingItems} รายการ`,
                size: "xs",
                color: "#999999",
                margin: "sm",
                style: "italic"
              }] : [])
            ]
          },
          {
            type: "separator",
            margin: "lg"
          },
          // Payment Summary Section
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: [
              {
                type: "text",
                text: "💰 สรุปการชำระเงิน",
                weight: "bold",
                color: "#333333",
                size: "md",
                margin: "sm"
              },
              {
                type: "box",
                layout: "horizontal",
                margin: "md",
                contents: [
                  {
                    type: "text",
                    text: "ราคาสินค้า:",
                    size: "sm",
                    color: "#555555",
                    flex: 1
                  },
                  {
                    type: "text",
                    text: `฿${data.subtotal.toLocaleString()}`,
                    size: "sm",
                    color: "#111111",
                    align: "end",
                    flex: 1
                  }
                ]
              },
              ...(data.shippingFee > 0 ? [{
                type: "box",
                layout: "horizontal",
                margin: "sm",
                contents: [
                  {
                    type: "text",
                    text: "ค่าจัดส่ง:",
                    size: "sm",
                    color: "#555555",
                    flex: 1
                  },
                  {
                    type: "text",
                    text: `฿${data.shippingFee.toLocaleString()}`,
                    size: "sm",
                    color: "#111111",
                    align: "end",
                    flex: 1
                  }
                ]
              }] : [{
                type: "box",
                layout: "horizontal",
                margin: "sm",
                contents: [
                  {
                    type: "text",
                    text: "ค่าจัดส่ง:",
                    size: "sm",
                    color: "#555555",
                    flex: 1
                  },
                  {
                    type: "text",
                    text: "ฟรี!",
                    size: "sm",
                    color: "#06C755",
                    weight: "bold",
                    align: "end",
                    flex: 1
                  }
                ]
              }]),
              ...(data.discountAmount > 0 ? [{
                type: "box",
                layout: "horizontal",
                margin: "sm",
                contents: [
                  {
                    type: "text",
                    text: "ส่วนลด:",
                    size: "sm",
                    color: "#555555",
                    flex: 1
                  },
                  {
                    type: "text",
                    text: `-฿${data.discountAmount.toLocaleString()}`,
                    size: "sm",
                    color: "#FF6B35",
                    weight: "bold",
                    align: "end",
                    flex: 1
                  }
                ]
              }] : []),
              {
                type: "separator",
                margin: "md"
              },
              {
                type: "box",
                layout: "horizontal",
                margin: "md",
                contents: [
                  {
                    type: "text",
                    text: data.paymentType === "DEPOSIT_PAYMENT" ? "💳 ยอดมัดจำ:" : "💳 ยอดรวมทั้งสิ้น:",
                    size: "md",
                    color: "#111111",
                    weight: "bold",
                    flex: 1
                  },
                  {
                    type: "text",
                    text: `฿${finalAmount.toLocaleString()}`,
                    size: "xl",
                    color: "#FF6B35",
                    weight: "bold",
                    align: "end",
                    flex: 1
                  }
                ]
              },
              ...(data.paymentType === "DEPOSIT_PAYMENT" && data.remainingAmount ? [{
                type: "box",
                layout: "horizontal",
                margin: "sm",
                contents: [
                  {
                    type: "text",
                    text: "💰 ยอดคงเหลือ (ชำระเมื่อรับสินค้า):",
                    size: "sm",
                    color: "#FF9800",
                    weight: "bold",
                    flex: 1,
                    wrap: true
                  },
                  {
                    type: "text",
                    text: `฿${data.remainingAmount.toLocaleString()}`,
                    size: "lg",
                    color: "#FF9800",
                    weight: "bold",
                    align: "end",
                    flex: 1
                  }
                ]
              }] : [])
            ]
          },
          {
            type: "separator",
            margin: "lg"
          },
          // Status Section
          {
            type: "box",
            layout: "vertical",
            margin: "lg",
            contents: [
              {
                type: "text",
                text: "📋 สถานะคำสั่งซื้อ",
                weight: "bold",
                color: "#333333",
                size: "md"
              },
              {
                type: "text",
                text: "⏳ รอการชำระเงิน",
                size: "md",
                color: "#FF6B35",
                weight: "bold",
                margin: "sm"
              },
              {
                type: "text",
                text: "กรุณาชำระเงินตามจำนวนที่ระบุและแจ้งการชำระเงินผ่านระบบภายใน 24 ชั่วโมง",
                size: "xs",
                color: "#666666",
                wrap: true,
                margin: "sm"
              }
            ]
          }
        ],
        paddingAll: "20px",
        spacing: "sm"
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "button",
            action: {
              type: "uri",
              label: "ดูรายละเอียดและแจ้งชำระเงิน 💳",
              uri: process.env.NEXTAUTH_URL || "https://corgi.theredpotion.com" || "https://red1.theredpotion.com"
            },
            style: "primary",
            color: "#06C755",
            height: "sm"
          }
        ],
        paddingAll: "20px",
        spacing: "sm"
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

  console.log(
    "🔑 Using channel access token:",
    channelAccessToken ? "✅ Found" : "❌ Missing"
  );

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
        Authorization: `Bearer ${channelAccessToken}`,
      },
      body: JSON.stringify(payload),
    });

    console.log("📡 LINE API response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ LINE API error response:", errorText);

      // ถ้าเป็น authentication error ให้ถือว่าเป็น configuration issue
      if (response.status === 401) {
        console.warn(
          "LINE API authentication failed - likely due to invalid or missing access token"
        );
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
