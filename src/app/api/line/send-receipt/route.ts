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
  // สร้าง items สำหรับแสดงในใบเสร็จแบบมืออาชีพ
  const itemBoxes = data.items.map((item, index) => ({
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: `${index + 1}. ${item.productName}`,
            size: "sm",
            color: "#2C3E50",
            weight: "bold",
            wrap: true
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: `${item.quantity} ชิ้น`,
                size: "xs",
                color: "#7F8C8D",
                flex: 1
              },
              {
                type: "text",
                text: `@ ฿${item.price.toLocaleString()}`,
                size: "xs",
                color: "#7F8C8D",
                align: "end"
              }
            ],
            margin: "xs"
          }
        ],
        flex: 1
      },
      {
        type: "text",
        text: `฿${item.total.toLocaleString()}`,
        size: "md",
        color: "#E74C3C",
        weight: "bold",
        align: "end"
      }
    ],
    margin: index === 0 ? "lg" : "md",
    paddingBottom: "sm",
    paddingAll: "sm",
    backgroundColor: index % 2 === 0 ? "#FFFFFF" : "#F8F9FA",
    cornerRadius: "4px"
  }));

  // สร้าง summary section
  const summaryItems = [
    {
      label: "ยอดรวมสินค้า",
      value: `฿${data.subtotal.toLocaleString()}`,
      color: "#2C3E50"
    },
    {
      label: "ค่าจัดส่ง",
      value: data.shippingFee > 0 ? `฿${data.shippingFee.toLocaleString()}` : "ฟรี",
      color: "#2C3E50"
    }
  ];

  if (data.discountAmount > 0) {
    summaryItems.push({
      label: "ส่วนลด",
      value: `-฿${data.discountAmount.toLocaleString()}`,
      color: "#27AE60"
    });
  }

  const summaryBoxes = summaryItems.map(item => ({
    type: "box",
    layout: "horizontal",
    contents: [
      {
        type: "text",
        text: item.label,
        size: "sm",
        color: "#7F8C8D",
        flex: 1
      },
      {
        type: "text",
        text: item.value,
        size: "sm",
        color: item.color,
        align: "end",
        weight: "bold"
      }
    ],
    margin: "sm"
  }));

  // Payment information
  const paymentInfo = data.paymentType === "DEPOSIT_PAYMENT" ? [
    {
      type: "separator",
      margin: "lg",
      color: "#E8E8E8"
    },
    {
      type: "box",
      layout: "vertical",
      contents: [
        {
          type: "text",
          text: "💳 ข้อมูลการชำระเงิน",
          size: "md",
          color: "#2C3E50",
          weight: "bold"
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "มัดจำ (20%)",
              size: "sm",
              color: "#E74C3C",
              flex: 1
            },
            {
              type: "text",
              text: `฿${data.depositAmount?.toLocaleString()}`,
              size: "sm",
              color: "#E74C3C",
              weight: "bold",
              align: "end"
            }
          ],
          margin: "md"
        },
        {
          type: "box",
          layout: "horizontal",
          contents: [
            {
              type: "text",
              text: "คงเหลือ",
              size: "sm",
              color: "#7F8C8D",
              flex: 1
            },
            {
              type: "text",
              text: `฿${data.remainingAmount?.toLocaleString()}`,
              size: "sm",
              color: "#7F8C8D",
              align: "end"
            }
          ],
          margin: "sm"
        }
      ],
      margin: "lg",
      paddingAll: "md",
      backgroundColor: "#FEF9E7",
      cornerRadius: "8px"
    }
  ] : [];

  return {
    type: "flex",
    altText: `🧾 ใบเสร็จ CorgiShop #${data.orderNumber}`,
    contents: {
      type: "bubble",
      size: "giga",
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        contents: [
          // Professional Header
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "🐕",
                size: "xxl",
                color: "#FF6B35",
                flex: 0
              },
              {
                type: "box",
                layout: "vertical",
                contents: [
                  {
                    type: "text",
                    text: "CorgiShop",
                    size: "xl",
                    color: "#2C3E50",
                    weight: "bold"
                  },
                  {
                    type: "text",
                    text: "Pet Store & Accessories",
                    size: "xs",
                    color: "#7F8C8D"
                  }
                ],
                flex: 1,
                margin: "md"
              }
            ],
            paddingAll: "lg",
            backgroundColor: "#F8F9FA",
            cornerRadius: "12px"
          },

          // Receipt Title
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "🧾 ใบเสร็จรับเงิน",
                size: "lg",
                color: "#2C3E50",
                weight: "bold",
                align: "center"
              },
              {
                type: "text",
                text: `เลขที่: ${data.orderNumber}`,
                size: "sm",
                color: "#34495E",
                align: "center",
                margin: "xs"
              },
              {
                type: "text",
                text: new Date().toLocaleString('th-TH', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                  hour: '2-digit',
                  minute: '2-digit'
                }),
                size: "xs",
                color: "#95A5A6",
                align: "center",
                margin: "xs"
              }
            ],
            margin: "lg"
          },

          // Customer Information
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "👤 ข้อมูลลูกค้า",
                size: "md",
                color: "#2C3E50",
                weight: "bold"
              },
              {
                type: "text",
                text: data.customerName,
                size: "sm",
                color: "#34495E",
                margin: "sm"
              },
              ...(data.customerPhone ? [{
                type: "text",
                text: `📞 ${data.customerPhone}`,
                size: "xs",
                color: "#7F8C8D",
                margin: "xs"
              }] : []),
              ...(data.shippingAddress ? [{
                type: "text",
                text: `📍 ${data.shippingAddress}`,
                size: "xs",
                color: "#7F8C8D",
                margin: "xs",
                wrap: true
              }] : [])
            ],
            paddingAll: "md",
            backgroundColor: "#EBF5FB",
            cornerRadius: "8px",
            margin: "lg"
          },

          // Separator
          {
            type: "separator",
            color: "#E8E8E8"
          },

          // Items Header
          {
            type: "text",
            text: "🛍️ รายการสินค้า",
            size: "md",
            color: "#2C3E50",
            weight: "bold",
            margin: "lg"
          },

          // Items List
          ...itemBoxes,

          // Separator
          {
            type: "separator",
            margin: "lg",
            color: "#E8E8E8"
          },

          // Summary Section
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "💰 สรุปยอดชำระ",
                size: "md",
                color: "#2C3E50",
                weight: "bold"
              },
              ...summaryBoxes,
              {
                type: "separator",
                margin: "md",
                color: "#E8E8E8"
              },
              {
                type: "box",
                layout: "horizontal",
                contents: [
                  {
                    type: "text",
                    text: "ยอดรวมทั้งสิ้น",
                    size: "lg",
                    color: "#2C3E50",
                    weight: "bold",
                    flex: 1
                  },
                  {
                    type: "text",
                    text: `฿${data.total.toLocaleString()}`,
                    size: "xl",
                    color: "#E74C3C",
                    weight: "bold",
                    align: "end"
                  }
                ],
                margin: "md",
                paddingAll: "md",
                backgroundColor: "#FDF2E9",
                cornerRadius: "8px"
              }
            ]
          },

          // Payment Information (if deposit)
          ...paymentInfo,

          // Shipping Information
          {
            type: "box",
            layout: "vertical",
            contents: [
              {
                type: "text",
                text: "🚚 การจัดส่ง",
                size: "md",
                color: "#2C3E50",
                weight: "bold"
              },
              {
                type: "text",
                text: data.shippingMethod,
                size: "sm",
                color: "#34495E",
                margin: "sm"
              }
            ],
            margin: "lg",
            paddingAll: "md",
            backgroundColor: "#E8F8F5",
            cornerRadius: "8px"
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        contents: [
          {
            type: "text",
            text: "🐾 ขอบคุณที่ใช้บริการ CorgiShop",
            size: "sm",
            color: "#FF6B35",
            align: "center",
            weight: "bold"
          },
          {
            type: "text",
            text: "สนใจสินค้าเพิ่มเติม กลับมาใหม่ได้เสมอนะคะ",
            size: "xs",
            color: "#95A5A6",
            align: "center",
            margin: "sm"
          },
          {
            type: "text",
            text: `สร้างเมื่อ ${new Date().toLocaleString('th-TH')}`,
            size: "xxs",
            color: "#BDC3C7",
            align: "center",
            margin: "md"
          }
        ],
        spacing: "sm",
        paddingAll: "lg"
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