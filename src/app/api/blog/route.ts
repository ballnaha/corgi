import { NextRequest, NextResponse } from 'next/server';
import { BlogPost, BlogCategory } from '@/types';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');

    const limit = searchParams.get('limit');
    const search = searchParams.get('search');

    // Build where clause
    const where: any = {
      isPublished: true
    };

    // Filter by category
    if (category) {
      where.category = {
        slug: category
      };
    }



    // Search filter
    if (search) {
      const searchLower = search.toLowerCase();
      where.OR = [
        {
          title: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          excerpt: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          content: {
            contains: search,
            mode: 'insensitive'
          }
        }
      ];
    }

    // Get posts from database
    const posts = await prisma.blogPost.findMany({
      where,
      include: {
        category: true
      },
      orderBy: {
        publishedAt: 'desc'
      },
      take: limit ? parseInt(limit) : undefined
    });

    // Transform to match BlogPost type
    const transformedPosts: BlogPost[] = posts.map(post => ({
      id: post.id,
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt || '',
      content: post.content,
      imageUrl: post.imageUrl,
      category: {
        id: post.category.id,
        name: post.category.name,
        slug: post.category.slug,
        description: post.category.description || undefined,
        color: post.category.color || undefined
      },
      author: post.author,
      publishedAt: post.publishedAt?.toISOString() || new Date().toISOString(),
      updatedAt: post.updatedAt.toISOString(),
      tags: post.tags ? JSON.parse(post.tags) : []
    }));

    return NextResponse.json({
      success: true,
      data: transformedPosts,
      total: transformedPosts.length
    });

  } catch (error) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog posts' },
      { status: 500 }
    );
  }
}
