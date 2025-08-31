import { NextRequest, NextResponse } from 'next/server';
import { BlogPost } from '@/types';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;

    if (!slug) {
      return NextResponse.json(
        { success: false, error: 'Slug is required' },
        { status: 400 }
      );
    }

    // Find post by slug
    const post = await prisma.blogPost.findFirst({
      where: {
        slug: slug,
        isPublished: true
      },
      include: {
        category: true
      }
    });

    if (!post) {
      return NextResponse.json(
        { success: false, error: 'Blog post not found' },
        { status: 404 }
      );
    }



    // Transform to match BlogPost type
    const transformedPost: BlogPost = {
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
    };

    return NextResponse.json({
      success: true,
      data: transformedPost
    });

  } catch (error) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch blog post' },
      { status: 500 }
    );
  }
}
