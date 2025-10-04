import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const meta = searchParams.get('meta');

    // Return discount types meta (for admin UI)
    if (meta === 'types') {
      const types = [
        { value: 'PERCENTAGE', label: 'เปอร์เซ็นต์ (%)' },
        { value: 'FIXED_AMOUNT', label: 'จำนวนเงินคงที่ (บาท)' },
      ];
      return NextResponse.json(types);
    }

    const whereClause = includeInactive ? {} : { isActive: true };

    const discountCodes = await prisma.discountCode.findMany({
      where: whereClause,
      orderBy: [
        { createdAt: 'desc' }
      ],
    });

    return NextResponse.json(discountCodes);
  } catch (error) {
    console.error("Error fetching discount codes:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      code, 
      type, 
      value, 
      minAmount,
      description,
      isActive = true, 
      validFrom,
      validUntil,
      usageLimit
    } = body;

    // Validate required fields
    if (!code || !type || value === undefined || !description) {
      return NextResponse.json(
        { error: "Code, type, value, and description are required" },
        { status: 400 }
      );
    }

    // Validate type
    const validTypes = ["PERCENTAGE", "FIXED_AMOUNT"];
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
        { status: 400 }
      );
    }

    // Validate value
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (typeof numValue !== 'number' || isNaN(numValue) || numValue <= 0) {
      return NextResponse.json(
        { error: "Value must be a positive number" },
        { status: 400 }
      );
    }

    // Validate minAmount if provided
    if (minAmount !== undefined && minAmount !== null) {
      const numMinAmount = typeof minAmount === 'string' ? parseFloat(minAmount) : minAmount;
      if (typeof numMinAmount !== 'number' || isNaN(numMinAmount) || numMinAmount < 0) {
        return NextResponse.json(
          { error: "Minimum amount must be a non-negative number" },
          { status: 400 }
        );
      }
    }

    // Validate percentage type
    if (type === "PERCENTAGE" && value > 100) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100%" },
        { status: 400 }
      );
    }

    // Check if code already exists
    const existingCode = await prisma.discountCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (existingCode) {
      return NextResponse.json(
        { error: "Discount code already exists" },
        { status: 400 }
      );
    }

    const discountCode = await prisma.discountCode.create({
      data: {
        code: code.toUpperCase(),
        type,
        value: numValue,
        minAmount: minAmount !== undefined && minAmount !== null ? 
          (typeof minAmount === 'string' ? parseFloat(minAmount) : minAmount) : null,
        description,
        isActive,
        validFrom: validFrom ? new Date(validFrom) : null,
        validUntil: validUntil ? new Date(validUntil) : null,
        usageLimit,
      },
    });

    // แปลง type ให้ตรงกับหน้า frontend
    const transformedDiscountCode = {
      ...discountCode,
      type: discountCode.type === "PERCENTAGE" ? "percentage" : "fixed"
    };

    return NextResponse.json(transformedDiscountCode, { status: 201 });
  } catch (error) {
    console.error("Error creating discount code:", error);
    return NextResponse.json(
      { error: "Failed to create discount code" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("PUT request body:", JSON.stringify(body, null, 2)); // Debug log
    
    const { 
      id, 
      code, 
      type, 
      value, 
      minAmount,
      description,
      isActive, 
      validFrom,
      validUntil,
      usageLimit
    } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    // Check if discount code exists
    const existingCode = await prisma.discountCode.findUnique({
      where: { id },
    });

    if (!existingCode) {
      return NextResponse.json(
        { error: "Discount code not found" },
        { status: 404 }
      );
    }

    // Validate type if provided
    if (type) {
      const validTypes = ["PERCENTAGE", "FIXED_AMOUNT"];
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
          { status: 400 }
        );
      }
    }

    // Validate value if provided and not null/undefined
    if (value !== undefined && value !== null) {
      // Convert to number if it's a string
      const numValue = typeof value === 'string' ? parseFloat(value) : value;
      if (typeof numValue !== 'number' || isNaN(numValue) || numValue <= 0) {
        console.log("Value validation failed:", { value, numValue, type: typeof value }); // Debug log
        return NextResponse.json(
          { error: "Value must be a positive number" },
          { status: 400 }
        );
      }
    }

    // Validate minAmount if provided
    if (minAmount !== undefined && minAmount !== null) {
      // Convert to number if it's a string
      const numMinAmount = typeof minAmount === 'string' ? parseFloat(minAmount) : minAmount;
      if (typeof numMinAmount !== 'number' || isNaN(numMinAmount) || numMinAmount < 0) {
        console.log("MinAmount validation failed:", { minAmount, numMinAmount, type: typeof minAmount }); // Debug log
        return NextResponse.json(
          { error: "Minimum amount must be a non-negative number" },
          { status: 400 }
        );
      }
    }

    // Validate percentage type
    if (type === "PERCENTAGE" && value !== undefined && value > 100) {
      return NextResponse.json(
        { error: "Percentage discount cannot exceed 100%" },
        { status: 400 }
      );
    }

    // Check if code already exists (excluding current record)
    if (code && code !== existingCode.code) {
      const codeExists = await prisma.discountCode.findFirst({
        where: { 
          code: code.toUpperCase(),
          id: { not: id }
        },
      });

      if (codeExists) {
        return NextResponse.json(
          { error: "Discount code already exists" },
          { status: 400 }
        );
      }
    }

    const updateData: any = {};
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (type !== undefined) updateData.type = type;
    if (value !== undefined && value !== null) {
      updateData.value = typeof value === 'string' ? parseFloat(value) : value;
    }
    if (minAmount !== undefined && minAmount !== null) {
      updateData.minAmount = typeof minAmount === 'string' ? parseFloat(minAmount) : minAmount;
    }
    if (description !== undefined) updateData.description = description;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (validFrom !== undefined) updateData.validFrom = validFrom ? new Date(validFrom) : null;
    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null;
    if (usageLimit !== undefined) updateData.usageLimit = usageLimit;

    const updatedCode = await prisma.discountCode.update({
      where: { id },
      data: updateData,
    });

    // แปลง type ให้ตรงกับหน้า frontend
    const transformedUpdatedCode = {
      ...updatedCode,
      type: updatedCode.type === "PERCENTAGE" ? "percentage" : "fixed"
    };

    return NextResponse.json(transformedUpdatedCode);
  } catch (error) {
    console.error("Error updating discount code:", error);
    return NextResponse.json(
      { error: "Failed to update discount code" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    // Check if discount code exists
    const existingCode = await prisma.discountCode.findUnique({
      where: { id },
    });

    if (!existingCode) {
      return NextResponse.json(
        { error: "Discount code not found" },
        { status: 404 }
      );
    }

    await prisma.discountCode.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Discount code deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting discount code:", error);
    return NextResponse.json(
      { error: "Failed to delete discount code" },
      { status: 500 }
    );
  }
}