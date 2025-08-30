import { NextResponse, NextRequest } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get('includeInactive') === 'true';
    const sortBy = searchParams.get('sortBy') || 'sortOrder'; // sortOrder, name, createdAt
    const sortOrder = searchParams.get('sortOrder') || 'asc'; // asc, desc
    const animalType = searchParams.get('animalType');

    // Build where clause
    const where: any = {};
    
    // Filter by active status
    if (!includeInactive) {
      where.isActive = true;
    }

    // Filter by animal type
    if (animalType) {
      where.animalType = animalType;
    }

    // Build order by clause
    const orderBy: any = {};
    if (sortBy === 'sortOrder') {
      orderBy.sortOrder = sortOrder;
    } else if (sortBy === 'name') {
      orderBy.name = sortOrder;
    } else if (sortBy === 'createdAt') {
      orderBy.createdAt = sortOrder;
    } else {
      // Default sorting
      orderBy.sortOrder = 'asc';
    }

    const categories = await prisma.category.findMany({
      where,
      orderBy
    });

    return NextResponse.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { key, name, icon, description, animalType, isActive = true, sortOrder = 0 } = body;

    const category = await prisma.category.create({
      data: {
        key,
        name,
        icon,
        description,
        animalType,
        isActive,
        sortOrder
      }
    });

    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { error: 'Failed to create category' },
      { status: 500 }
    );
  }
}