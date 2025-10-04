import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const meta = searchParams.get('meta');

    // Return distinct methods list for admin UI
    if (meta === 'methods') {
      const methods = await prisma.shippingOption.findMany({
        distinct: ['method'] as any,
        select: { method: true },
        orderBy: { method: 'asc' }
      });
      const values = methods
        .map(m => m.method)
        .filter((v): v is string => !!v)
        .filter((v, i, arr) => arr.indexOf(v) === i);
      return NextResponse.json(values);
    }

    const whereClause = includeInactive ? {} : { isActive: true };

    const shippingOptions = await prisma.shippingOption.findMany({
      where: whereClause,
      orderBy: [
        { sortOrder: 'asc' },
        { createdAt: 'asc' }
      ],
    });

    return NextResponse.json(shippingOptions);
  } catch (error) {
    console.error("Error fetching shipping options:", error);
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
      name, 
      description, 
      price, 
      estimatedDays,
      isActive = true, 
      sortOrder = 0,
      method,
      forPetsOnly,
    } = body;

    // Validate required fields
    if (!name || price === undefined) {
      return NextResponse.json(
        { error: "Name and price are required" },
        { status: 400 }
      );
    }

    // Validate price is a number
    if (typeof price !== 'number' || price < 0) {
      return NextResponse.json(
        { error: "Price must be a non-negative number" },
        { status: 400 }
      );
    }

    // Normalize numeric/string fields
    const normalizedPrice = typeof price === 'string' ? Number(price) : price;
    const normalizedSortOrder = typeof sortOrder === 'string' ? Number(sortOrder) : sortOrder;
    const normalizedEstimatedDaysStr = estimatedDays === undefined || estimatedDays === null ? undefined : String(estimatedDays);
    const normalizedForPetsOnly = typeof forPetsOnly === 'string' ? (forPetsOnly === 'true') : !!forPetsOnly;

    const shippingOption = await prisma.shippingOption.create({
      data: {
        name,
        description,
        price: normalizedPrice,
        estimatedDays: normalizedEstimatedDaysStr,
        isActive,
        sortOrder: normalizedSortOrder,
        method,
        forPetsOnly: normalizedForPetsOnly,
      },
    });

    return NextResponse.json(shippingOption, { status: 201 });
  } catch (error) {
    console.error("Error creating shipping option:", error);
    return NextResponse.json(
      { error: "Failed to create shipping option" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      id, 
      name, 
      description, 
      price, 
      estimatedDays,
      isActive, 
      sortOrder,
      method,
      forPetsOnly,
    } = body;

    // Validate required fields
    if (!id) {
      return NextResponse.json(
        { error: "ID is required" },
        { status: 400 }
      );
    }

    // Check if shipping option exists
    const existingOption = await prisma.shippingOption.findUnique({
      where: { id },
    });

    if (!existingOption) {
      return NextResponse.json(
        { error: "Shipping option not found" },
        { status: 404 }
      );
    }

    // Normalize numeric fields (accept string numbers)
    const normalizedPrice = price === undefined ? undefined : (typeof price === 'string' ? Number(price) : price);
    const normalizedEstimatedDaysStr = estimatedDays === undefined || estimatedDays === null ? undefined : String(estimatedDays);
    const normalizedForPetsOnly = forPetsOnly === undefined ? undefined : (typeof forPetsOnly === 'string' ? (forPetsOnly === 'true') : !!forPetsOnly);
    const normalizedSortOrder = sortOrder === undefined ? undefined : (typeof sortOrder === 'string' ? Number(sortOrder) : sortOrder);

    // Validate price if provided
    if (normalizedPrice !== undefined && (typeof normalizedPrice !== 'number' || isNaN(normalizedPrice) || normalizedPrice < 0)) {
      return NextResponse.json(
        { error: "Price must be a non-negative number" },
        { status: 400 }
      );
    }

    const updatedOption = await prisma.shippingOption.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(normalizedPrice !== undefined && { price: normalizedPrice }),
        ...(normalizedEstimatedDaysStr !== undefined && { estimatedDays: normalizedEstimatedDaysStr }),
        ...(isActive !== undefined && { isActive }),
        ...(normalizedSortOrder !== undefined && { sortOrder: normalizedSortOrder }),
        ...(method !== undefined && { method }),
        ...(normalizedForPetsOnly !== undefined && { forPetsOnly: normalizedForPetsOnly }),
      },
    });

    return NextResponse.json(updatedOption);
  } catch (error) {
    console.error("Error updating shipping option:", error);
    return NextResponse.json(
      { error: "Failed to update shipping option" },
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

    // Check if shipping option exists
    const existingOption = await prisma.shippingOption.findUnique({
      where: { id },
    });

    if (!existingOption) {
      return NextResponse.json(
        { error: "Shipping option not found" },
        { status: 404 }
      );
    }

    await prisma.shippingOption.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Shipping option deleted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error deleting shipping option:", error);
    return NextResponse.json(
      { error: "Failed to delete shipping option" },
      { status: 500 }
    );
  }
}