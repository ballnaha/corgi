import { NextRequest, NextResponse } from "next/server";
import { getSystemSetting, updateSystemSetting, initializeDepositSettings, getAllSystemSettings, getSystemSettingsByCategory, createSystemSetting } from "@/lib/system-settings";

export async function GET(request: NextRequest) {
  try {
    console.log("📥 GET /api/system-settings");
    
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const key = searchParams.get("key");

    console.log(`🔍 Query params:`, { category, key });

    if (key) {
      // ดึงการตั้งค่าเดียว
      const value = await getSystemSetting(key);
      console.log(`✅ Retrieved setting: ${key} = ${value}`);
      return NextResponse.json({ key, value });
    }

    if (category) {
      // ดึงการตั้งค่าตาม category
      const settings = await getSystemSettingsByCategory(category);
      console.log(`✅ Retrieved ${settings.length} settings for category: ${category}`);
      return NextResponse.json(settings);
    }

    // ดึงการตั้งค่าทั้งหมด
    const settings = await getAllSystemSettings();
    console.log(`✅ Retrieved all ${settings.length} settings`);

    return NextResponse.json(settings);
  } catch (error: any) {
    console.error("❌ Error fetching system settings:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return NextResponse.json(
      { 
        error: "Failed to fetch system settings",
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log("📥 POST /api/system-settings");
    
    const body = await request.json();
    console.log("📦 Request body:", body);
    
    const { key, value, type, category, description } = body;

    if (!key || value === undefined) {
      console.error("❌ Validation error: Missing key or value");
      return NextResponse.json(
        { error: "Key and value are required" },
        { status: 400 }
      );
    }

    const setting = await createSystemSetting(
      key,
      String(value),
      type || "string",
      category || "general",
      description
    );

    console.log("✅ Setting created successfully:", setting);
    return NextResponse.json(setting);
  } catch (error: any) {
    console.error("❌ Error creating system setting:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      { 
        error: "Failed to create system setting",
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    console.log("📥 PUT /api/system-settings");
    
    const body = await request.json();
    console.log("📦 Request body:", body);
    
    const { key, value, type, category } = body;

    if (!key || value === undefined) {
      console.error("❌ Validation error: Missing key or value");
      return NextResponse.json(
        { error: "Key and value are required" },
        { status: 400 }
      );
    }

    console.log(`🔄 Attempting to update: ${key} = ${value}`);
    const success = await updateSystemSetting(key, String(value), type, category);
    
    if (!success) {
      console.error(`❌ Update failed for key: ${key}`);
      return NextResponse.json(
        { error: "Failed to update system setting" },
        { status: 500 }
      );
    }

    console.log(`✅ Successfully updated: ${key}`);
    return NextResponse.json({ success: true, key, value });
  } catch (error: any) {
    console.error("❌ Error updating system setting:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
      meta: error.meta,
    });
    return NextResponse.json(
      { 
        error: "Failed to update system setting",
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    console.log("📥 PATCH /api/system-settings");
    
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    console.log(`🔍 Action: ${action}`);

    if (action === "initialize") {
      await initializeDepositSettings();
      console.log("✅ Deposit settings initialized");
      return NextResponse.json({ message: "Deposit settings initialized" });
    }

    console.error(`❌ Invalid action: ${action}`);
    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error: any) {
    console.error("❌ Error in PATCH:", error);
    console.error("❌ Error details:", {
      message: error.message,
      stack: error.stack,
      code: error.code,
    });
    return NextResponse.json(
      { 
        error: "Failed to process request",
        message: error.message,
        details: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}