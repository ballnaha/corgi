import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const { code, subtotal } = await request.json();

    if (!code) {
      return NextResponse.json(
        { error: "Discount code is required" },
        { status: 400 }
      );
    }

    const discountCode = await prisma.discountCode.findUnique({
      where: {
        code: code.toUpperCase(),
      },
    });

    if (!discountCode) {
      return NextResponse.json(
        { error: "รหัสส่วนลดไม่ถูกต้อง" },
        { status: 404 }
      );
    }

    if (!discountCode.isActive) {
      return NextResponse.json(
        { error: "รหัสส่วนลดไม่สามารถใช้งานได้" },
        { status: 400 }
      );
    }

    // Check validity period
    const now = new Date();
    if (discountCode.validFrom && discountCode.validFrom > now) {
      return NextResponse.json(
        { error: "รหัสส่วนลดยังไม่สามารถใช้งานได้" },
        { status: 400 }
      );
    }

    if (discountCode.validUntil && discountCode.validUntil < now) {
      return NextResponse.json(
        { error: "รหัสส่วนลดหมดอายุแล้ว" },
        { status: 400 }
      );
    }

    // Check usage limit
    if (discountCode.usageLimit && discountCode.usageCount >= discountCode.usageLimit) {
      return NextResponse.json(
        { error: "รหัสส่วนลดถูกใช้งานครบแล้ว" },
        { status: 400 }
      );
    }

    // Check minimum amount
    if (discountCode.minAmount && subtotal < Number(discountCode.minAmount)) {
      return NextResponse.json(
        { error: `ยอดซื้อขั้นต่ำ ${Number(discountCode.minAmount)} บาท` },
        { status: 400 }
      );
    }

    return NextResponse.json({
      valid: true,
      discountCode: {
        id: discountCode.id,
        code: discountCode.code,
        type: discountCode.type,
        value: Number(discountCode.value),
        description: discountCode.description,
      }
    });
  } catch (error) {
    console.error("Error validating discount code:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}