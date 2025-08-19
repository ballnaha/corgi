import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

interface AdminNotificationData {
  type: "PAYMENT_NOTIFICATION";
  orderNumber: string;
  customerName: string;
  transferAmount: number;
  transferDate: string;
  submittedAt: string;
  paymentSlipUrl?: string;
  displayUrl?: string;
}

export async function POST(request: NextRequest) {
  console.log("🔔 Admin LINE notification API called");

  try {
    const notificationData: AdminNotificationData = await request.json();
    console.log("📥 Notification data:", notificationData);

    // ดึงรายการ admin users
    const allAdminUsers = await prisma.user.findMany({
      where: {
        OR: [
          { isAdmin: true },
          { role: "ADMIN" }
        ]
      },
      select: {
        id: true,
        lineUserId: true,
        displayName: true,
        email: true,
      }
    });

    // กรองเฉพาะที่มี lineUserId ที่ไม่ใช่ string ว่าง
    const adminUsers = allAdminUsers.filter(user => 
      user.lineUserId && user.lineUserId.trim() !== ""
    );

    console.log(`👥 Found ${adminUsers.length} admin users with LINE IDs`);

    if (adminUsers.length === 0) {
      console.warn("⚠️ No admin users with LINE IDs found");
      return NextResponse.json({
        success: false,
        message: "No admin users found",
      });
    }

    // ตรวจสอบว่ามี LINE_CHANNEL_ACCESS_TOKEN หรือไม่
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    if (!channelAccessToken) {
      console.warn("LINE_CHANNEL_ACCESS_TOKEN is not configured. Skipping admin notification.");
      return NextResponse.json({
        success: false,
        message: "LINE messaging is not configured",
        skipLine: true,
      });
    }

    // สร้าง messages สำหรับ admin (text + image)
    const messages: any[] = [];
    
    // เพิ่ม Flex Message
    const adminFlexMessage = createAdminNotificationMessage(notificationData);
    messages.push(adminFlexMessage);
    
    // เพิ่มรูปหลักฐานการโอนเงิน (ถ้ามี)
    if (notificationData.displayUrl) {
      const fullImageUrl = notificationData.displayUrl.startsWith('http') 
        ? notificationData.displayUrl 
        : `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}${notificationData.displayUrl}`;
        
      const imageMessage = {
        type: "image",
        originalContentUrl: fullImageUrl,
        previewImageUrl: fullImageUrl,
      };
      messages.push(imageMessage);
    }

    // ส่ง notification ไปยัง admin users ทุกคน
    const notificationPromises = adminUsers.map(async (admin) => {
      try {
        console.log(`📤 Sending notification to admin: ${admin.displayName} (${admin.lineUserId})`);
        
        // ส่งทีละ message เพื่อให้แน่ใจว่าส่งสำเร็จ
        const responses = [];
        for (const message of messages) {
          const response = await sendLineMessage(admin.lineUserId!, message);
          responses.push(response);
        }
        
        return {
          adminId: admin.id,
          adminName: admin.displayName,
          lineUserId: admin.lineUserId,
          success: true,
          messageCount: responses.length,
          status: responses.map(r => r.status),
        };
      } catch (error) {
        console.error(`❌ Failed to send to ${admin.displayName}:`, error);
        return {
          adminId: admin.id,
          adminName: admin.displayName,
          lineUserId: admin.lineUserId,
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
        };
      }
    });

    const results = await Promise.all(notificationPromises);
    const successCount = results.filter(r => r.success).length;
    
    console.log(`✅ Successfully sent to ${successCount}/${adminUsers.length} admins`);

    return NextResponse.json({
      success: true,
      message: `Admin notification sent to ${successCount}/${adminUsers.length} admins`,
      results,
    });

  } catch (error: any) {
    console.error("🚨 Admin notification error:", error);
    return NextResponse.json(
      { error: "Failed to send admin notification", details: error?.message },
      { status: 500 }
    );
  }
}

function createAdminNotificationMessage(data: AdminNotificationData) {
  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('th-TH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return {
    type: "flex",
    altText: `🔔 แจ้งชำระเงิน - คำสั่งซื้อ ${data.orderNumber}`,
    contents: {
      type: "bubble",
      header: {
        type: "box",
        layout: "vertical",
        backgroundColor: "#FF9800",
        paddingAll: "20px",
        contents: [
          {
            type: "text",
            text: "🔔 แจ้งชำระเงิน",
            weight: "bold",
            color: "#FFFFFF",
            size: "xl",
            align: "center"
          },
          {
            type: "text",
            text: "มีลูกค้าแจ้งชำระเงินแล้ว",
            color: "#FFFFFF",
            size: "sm",
            align: "center",
            margin: "sm"
          }
        ]
      },
      body: {
        type: "box",
        layout: "vertical",
        spacing: "md",
        paddingAll: "20px",
        contents: [
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "คำสั่งซื้อ:",
                weight: "bold",
                color: "#666666",
                flex: 1
              },
              {
                type: "text",
                text: data.orderNumber,
                weight: "bold",
                color: "#FF9800",
                flex: 2,
                wrap: true
              }
            ]
          },
          {
            type: "separator"
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "ลูกค้า:",
                weight: "bold",
                color: "#666666",
                flex: 1
              },
              {
                type: "text",
                text: data.customerName,
                color: "#333333",
                flex: 2,
                wrap: true
              }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "จำนวนเงิน:",
                weight: "bold",
                color: "#666666",
                flex: 1
              },
              {
                type: "text",
                text: `฿${data.transferAmount.toLocaleString()}`,
                weight: "bold",
                color: "#4CAF50",
                flex: 2
              }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "วันที่โอน:",
                weight: "bold",
                color: "#666666",
                flex: 1
              },
              {
                type: "text",
                text: formatDate(data.transferDate),
                color: "#333333",
                flex: 2,
                wrap: true
              }
            ]
          },
          {
            type: "box",
            layout: "horizontal",
            contents: [
              {
                type: "text",
                text: "วันที่แจ้ง:",
                weight: "bold",
                color: "#666666",
                flex: 1
              },
              {
                type: "text",
                text: formatDate(data.submittedAt),
                color: "#333333",
                flex: 2,
                wrap: true
              }
            ]
          }
        ]
      },
      footer: {
        type: "box",
        layout: "vertical",
        spacing: "sm",
        paddingAll: "20px",
        contents: [
          {
            type: "button",
            style: "primary",
            height: "sm",
            action: {
              type: "uri",
              label: "ดูรายละเอียด",
              uri: `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/admin/orders`
            },
            color: "#FF9800"
          },
          {
            type: "text",
            text: "กรุณาตรวจสอบและอนุมัติการชำระเงิน",
            color: "#666666",
            size: "xs",
            align: "center",
            margin: "sm"
          }
        ]
      }
    }
  };
}

async function sendLineMessage(lineUserId: string, message: any) {
  console.log("📤 Sending LINE message to admin:", lineUserId);

  const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;

  if (!channelAccessToken) {
    console.error("❌ LINE_CHANNEL_ACCESS_TOKEN is not configured");
    throw new Error("LINE_CHANNEL_ACCESS_TOKEN is not configured");
  }

  const payload = {
    to: lineUserId,
    messages: [message],
  };

  console.log("📦 LINE API payload for admin:", JSON.stringify(payload, null, 2));

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

      if (response.status === 401) {
        console.warn("LINE API authentication failed - likely due to invalid or missing access token");
        throw new Error("LINE_API_NOT_CONFIGURED");
      }

      throw new Error(`LINE API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    console.log("✅ Admin LINE message sent successfully:", result);
    return response;
  } catch (error) {
    console.error("🚨 Error in sendLineMessage for admin:", error);
    throw error;
  }
}
