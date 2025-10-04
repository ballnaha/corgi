import { NextRequest, NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "Stripe webhook endpoint is accessible",
    timestamp: new Date().toISOString(),
    webhookUrl: `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/api/stripe/webhook`,
  });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.text();
    console.log("=== WEBHOOK TEST RECEIVED ===");
    console.log("Headers:", Object.fromEntries(request.headers.entries()));
    console.log("Body length:", body.length);
    console.log("Body preview:", body.substring(0, 200));
    
    return NextResponse.json({ 
      received: true, 
      message: "Test webhook received successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Webhook test error:", error);
    return NextResponse.json(
      { error: "Test webhook failed" }, 
      { status: 400 }
    );
  }
}
