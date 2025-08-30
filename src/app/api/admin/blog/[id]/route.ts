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

    const post = await prisma.blogPost.findUnique({
      where: { id },
      include: {
        category: true,
        authorUser: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบบทความ' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: post
    });

  } catch (error) {
    console.error('Error fetching blog post:', error);
    
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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบบทความ' },
        { status: 404 }
      );
    }

    // Prepare update data
    const updateData: any = {};

    // Handle each field that can be updated
    if (body.title !== undefined) updateData.title = body.title;
    if (body.slug !== undefined) {
      // Check slug uniqueness if changing
      if (body.slug !== existingPost.slug) {
        const slugExists = await prisma.blogPost.findUnique({
          where: { slug: body.slug }
        });
        if (slugExists) {
          return NextResponse.json(
            { success: false, error: 'Slug นี้ถูกใช้งานแล้ว' },
            { status: 400 }
          );
        }
      }
      updateData.slug = body.slug;
    }
    if (body.excerpt !== undefined) updateData.excerpt = body.excerpt;
    if (body.content !== undefined) updateData.content = body.content;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.categoryId !== undefined) {
      // Verify category exists
      const category = await prisma.blogCategory.findUnique({
        where: { id: body.categoryId }
      });
      if (!category) {
        return NextResponse.json(
          { success: false, error: 'ไม่พบหมวดหมู่ที่เลือก' },
          { status: 400 }
        );
      }
      updateData.categoryId = body.categoryId;
    }
    if (body.author !== undefined) updateData.author = body.author;
    if (body.isPublished !== undefined) {
      updateData.isPublished = body.isPublished;
      // Set publishedAt when publishing for the first time
      if (body.isPublished && !existingPost.publishedAt) {
        updateData.publishedAt = new Date();
      }
    }

    if (body.tags !== undefined) {
      updateData.tags = Array.isArray(body.tags) ? JSON.stringify(body.tags) : body.tags;
    }
    if (body.seoTitle !== undefined) updateData.seoTitle = body.seoTitle;
    if (body.seoDescription !== undefined) updateData.seoDescription = body.seoDescription;
    if (body.publishedAt !== undefined) updateData.publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;

    // Update the post
    const updatedPost = await prisma.blogPost.update({
      where: { id },
      data: updateData,
      include: {
        category: true,
        authorUser: {
          select: {
            id: true,
            displayName: true
          }
        }
      }
    });

    return NextResponse.json({
      success: true,
      data: updatedPost,
      message: 'อัปเดตบทความเรียบร้อยแล้ว'
    });

  } catch (error) {
    console.error('Error updating blog post:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการอัปเดตบทความ' },
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

    // Check if post exists
    const existingPost = await prisma.blogPost.findUnique({
      where: { id }
    });

    if (!existingPost) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบบทความ' },
        { status: 404 }
      );
    }

    // Delete the post
    await prisma.blogPost.delete({
      where: { id }
    });

    return NextResponse.json({
      success: true,
      message: 'ลบบทความเรียบร้อยแล้ว'
    });

  } catch (error) {
    console.error('Error deleting blog post:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการลบบทความ' },
      { status: 500 }
    );
  }
}
