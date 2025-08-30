import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-utils';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const category = searchParams.get('category') || '';
    const published = searchParams.get('published');


    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { excerpt: { contains: search, mode: 'insensitive' } },
        { author: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (category) {
      where.categoryId = category;
    }

    if (published !== null && published !== undefined) {
      where.isPublished = published === 'true';
    }



    // Get total count
    const total = await prisma.blogPost.count({ where });

    // Get posts with pagination
    const posts = await prisma.blogPost.findMany({
      where,
      include: {
        category: {
          select: {
            id: true,
            name: true,
            color: true
          }
        },
        authorUser: {
          select: {
            id: true,
            displayName: true
          }
        }
      },
      orderBy: [

        { createdAt: 'desc' }
      ],
      skip,
      take: limit
    });

    return NextResponse.json({
      success: true,
      data: {
        posts,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching admin blog posts:', error);
    
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

export async function POST(request: NextRequest) {
  try {
    await requireAdmin();

    const body = await request.json();
    const {
      title,
      slug,
      excerpt,
      content,
      imageUrl,
      categoryId,
      author,
      isPublished = false,

      tags = [],
      seoTitle,
      seoDescription,
      publishedAt
    } = body;

    // Validate required fields
    if (!title || !content || !categoryId) {
      return NextResponse.json(
        { success: false, error: 'กรุณากรอกข้อมูลให้ครบถ้วน' },
        { status: 400 }
      );
    }

    // Generate slug if not provided
    let finalSlug = slug;
    if (!finalSlug) {
      finalSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9ก-ฮ\s]/g, '')
        .replace(/\s+/g, '-')
        .substring(0, 100);
    }

    // Check slug uniqueness
    const existingPost = await prisma.blogPost.findUnique({
      where: { slug: finalSlug }
    });

    if (existingPost) {
      finalSlug = `${finalSlug}-${Date.now()}`;
    }

    // Verify category exists
    const category = await prisma.blogCategory.findUnique({
      where: { id: categoryId }
    });

    if (!category) {
      return NextResponse.json(
        { success: false, error: 'ไม่พบหมวดหมู่ที่เลือก' },
        { status: 400 }
      );
    }

    // Create blog post
    const post = await prisma.blogPost.create({
      data: {
        title,
        slug: finalSlug,
        excerpt,
        content,
        imageUrl,
        categoryId,
        author: author || 'แอดมิน',
        isPublished,

        tags: tags.length > 0 ? JSON.stringify(tags) : null,
        seoTitle,
        seoDescription,
        publishedAt: isPublished && publishedAt ? new Date(publishedAt) : (isPublished ? new Date() : null)
      },
      include: {
        category: true
      }
    });

    return NextResponse.json({
      success: true,
      data: post,
      message: 'สร้างบทความเรียบร้อยแล้ว'
    });

  } catch (error) {
    console.error('Error creating blog post:', error);
    
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      return NextResponse.json(
        { success: false, error: 'ไม่มีสิทธิ์เข้าถึง' },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'เกิดข้อผิดพลาดในการสร้างบทความ' },
      { status: 500 }
    );
  }
}
