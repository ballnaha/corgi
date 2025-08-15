import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/admin-utils';

const prisma = new PrismaClient();

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'ไม่พบสินค้า' },
        { status: 404 }
      );
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการดึงข้อมูลสินค้า' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authorization
    await requireAdmin();

    const { id } = params;
    const body = await request.json();

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'ไม่พบสินค้า' },
        { status: 404 }
      );
    }

    // Update the product
    const updatedProduct = await prisma.product.update({
      where: { id },
      data: {
        name: body.name?.trim(),
        description: body.description?.trim() || null,
        price: body.price,
        salePrice: body.salePrice || null,
        discountPercent: body.discountPercent || null,
        category: body.category,
        stock: body.stock,
        gender: body.gender || null,
        age: body.age || null,
        weight: body.weight || null,
        breed: body.breed || null,
        color: body.color || null,
        location: body.location || null,
        contactInfo: body.contactInfo || null,
        healthNote: body.healthNote || null,
        vaccinated: body.vaccinated,
        certified: body.certified,
        isActive: body.isActive,
      },
      include: {
        images: true,
      },
    });

    return NextResponse.json(updatedProduct);
  } catch (error: any) {
    console.error('Error updating product:', error);

    // Handle admin authorization error
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์ในการแก้ไขสินค้า' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการแก้ไขสินค้า' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check admin authorization
    await requireAdmin();

    const { id } = params;

    // Check if product exists
    const existingProduct = await prisma.product.findUnique({
      where: { id },
      include: {
        images: true,
      },
    });

    if (!existingProduct) {
      return NextResponse.json(
        { error: 'ไม่พบสินค้า' },
        { status: 404 }
      );
    }

    // Delete related images first
    await prisma.productImage.deleteMany({
      where: { productId: id },
    });

    // Delete the product
    await prisma.product.delete({
      where: { id },
    });

    return NextResponse.json({ 
      success: true, 
      message: 'ลบสินค้าเรียบร้อยแล้ว' 
    });
  } catch (error: any) {
    console.error('Error deleting product:', error);

    // Handle admin authorization error
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์ในการลบสินค้า' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการลบสินค้า' },
      { status: 500 }
    );
  }
}