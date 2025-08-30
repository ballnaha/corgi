import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-utils';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    const category = await prisma.blogCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบหมวดหมู่' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: category
    });

  } catch (error) {
    console.error('Error fetching blog category:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการโหลดข้อมูล' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    // Check if category exists
    const existingCategory = await prisma.blogCategory.findUnique({
      where: { id }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบหมวดหมู่' },
        { status: 404 }
      );
    }

    // Validate required fields
    const { name, slug, description, color, isActive, sortOrder } = body;

    if (!name || !slug) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกชื่อหมวดหมู่และ slug' },
        { status: 400 }
      );
    }

    // Check slug uniqueness (excluding current category)
    if (slug !== existingCategory.slug) {
      const slugExists = await prisma.blogCategory.findUnique({
        where: { slug }
      });
      if (slugExists) {
        return NextResponse.json(
          { success: false, error: 'Slug นี้ถูกใช้งานแล้ว' },
          { status: 400 }
        );
      }
    }

    // Update the category
    const updatedCategory = await prisma.blogCategory.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        color,
        isActive,
        sortOrder
      },
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedCategory,
      message: 'อัปเดตหมวดหมู่เรียบร้อยแล้ว'
    });

  } catch (error) {
    console.error('Error updating blog category:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตหมวดหมู่' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Check if category exists
    const existingCategory = await prisma.blogCategory.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            posts: true
          }
        }
      }
    });

    if (!existingCategory) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบหมวดหมู่' },
        { status: 404 }
      );
    }

    // Check if category has posts
    if (existingCategory._count.posts > 0) {
      return NextResponse.json(
        { success: false, error: `ไม่สามารถลบได้ เนื่องจากมีบทความ ${existingCategory._count.posts} บทความในหมวดหมู่นี้` },
        { status: 400 }
      );
    }

    // Delete the category
    await prisma.blogCategory.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'ลบหมวดหมู่เรียบร้อยแล้ว'
    });

  } catch (error) {
    console.error('Error deleting blog category:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการลบหมวดหมู่' },
      { status: 500 }
    );
  }
}
