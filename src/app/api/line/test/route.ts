import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function POST(request: NextRequest) {
  console.log("🧪 LINE Test API called");

  try {
    const session = await getServerSession(authOptions);
    console.log("👤 LINE User ID:", session?.user?.lineUserId);
    console.log("📱 Full session:", JSON.stringify(session, null, 2));

    if (!session?.user?.lineUserId) {
      return NextResponse.json({
        success: false,
        error: "No LINE user ID found",
        session: session?.user || null,
        debug: {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasLineUserId: !!session?.user?.lineUserId,
          lineUserId: session?.user?.lineUserId,
        }
      });
    }

    // ตรวจสอบ environment
    const channelAccessToken = process.env.LINE_CHANNEL_ACCESS_TOKEN;
    console.log("🔑 Channel Access Token exists:", !!channelAccessToken);
    console.log("🔑 Token length:", channelAccessToken?.length || 0);

    if (!channelAccessToken) {
      return NextResponse.json({
        success: false,
        error: "LINE_CHANNEL_ACCESS_TOKEN not configured",
        debug: {
          hasToken: false,
          tokenLength: 0,
        }
      });
    }

    // สร้าง simple test message
    const testMessage = {
      type: "text",
      text: "🧪 Test message from CorgiShop\n" + 
            `เวลา: ${new Date().toLocaleString('th-TH', { timeZone: 'Asia/Bangkok' })}\n` +
            `User ID: ${session.user.lineUserId}`
    };

    console.log("📤 Sending test message to:", session.user.lineUserId);

    const payload = {
      to: session.user.lineUserId,
      messages: [testMessage],
    };

    console.log("📦 Test payload:", JSON.stringify(payload, null, 2));

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

      return NextResponse.json({
        success: false,
        error: `LINE API error: ${response.status}`,
        details: errorText,
        debug: {
          status: response.status,
          statusText: response.statusText,
          hasToken: !!channelAccessToken,
          tokenLength: channelAccessToken?.length || 0,
          lineUserId: session.user.lineUserId,
        }
      });
    }

    const result = await response.json();
    console.log("✅ Test message sent successfully:", result);

    return NextResponse.json({
      success: true,
      message: "Test message sent successfully",
      debug: {
        lineUserId: session.user.lineUserId,
        hasToken: !!channelAccessToken,
        tokenLength: channelAccessToken?.length || 0,
        apiResponse: result,
      }
    });

  } catch (error: any) {
    console.error("🚨 LINE Test API Error:", error);

    return NextResponse.json({
      success: false,
      error: "Test failed",
      details: error?.message || "Unknown error",
      debug: {
        errorType: typeof error,
        errorName: error?.name,
        errorMessage: error?.message,
        hasToken: !!process.env.LINE_CHANNEL_ACCESS_TOKEN,
      }
    }, { status: 500 });
  }
}
