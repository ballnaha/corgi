import { NextResponse } from 'next/server';
import { BlogCategory } from '@/types';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    // Get categories from database
    const categories = await prisma.blogCategory.findMany({
      where: {
        isActive: true
      },
      orderBy: {
        sortOrder: 'asc'
      }
    });

    // Transform to match BlogCategory type
    const transformedCategories: BlogCategory[] = categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description || undefined,
      color: category.color || undefined
    }));

    return NextResponse.json({
      success: true,
      data: transformedCategories
    });
  } catch (error) {
    console.error('Error fetching blog categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
