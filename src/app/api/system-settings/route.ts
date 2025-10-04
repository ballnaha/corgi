import { NextRequest, NextResponse } from "next/server";
import { getSystemSetting, updateSystemSetting, initializeDepositSettings, getAllSystemSettings, getSystemSettingsByCategory, createSystemSetting } from "@/lib/system-settings";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const key = searchParams.get("key");

    if (key) {
      // ดึงการตั้งค่าเดียว
      const value = await getSystemSetting(key);
      return NextResponse.json({ key, value });
    }

    if (category) {
      // ดึงการตั้งค่าตาม category
      const settings = await getSystemSettingsByCategory(category);
      return NextResponse.json(settings);
    }

    // ดึงการตั้งค่าทั้งหมด
    const settings = await getAllSystemSettings();

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Error fetching system settings:", error);
    return NextResponse.json(
      { error: "Failed to fetch system settings" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, type, category, description } = body;

    if (!key || value === undefined) {
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

    return NextResponse.json(setting);
  } catch (error) {
    console.error("Error creating system setting:", error);
    return NextResponse.json(
      { error: "Failed to create system setting" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { key, value, type, category } = body;

    if (!key || value === undefined) {
      return NextResponse.json(
        { error: "Key and value are required" },
        { status: 400 }
      );
    }

    const success = await updateSystemSetting(key, String(value), type, category);
    
    if (!success) {
      return NextResponse.json(
        { error: "Failed to update system setting" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating system setting:", error);
    return NextResponse.json(
      { error: "Failed to update system setting" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");

    if (action === "initialize") {
      await initializeDepositSettings();
      return NextResponse.json({ message: "Deposit settings initialized" });
    }

    return NextResponse.json(
      { error: "Invalid action" },
      { status: 400 }
    );
  } catch (error) {
    console.error("Error in PATCH:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}