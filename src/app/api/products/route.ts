import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { requireAdmin } from '@/lib/admin-utils';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const animalType = searchParams.get('animalType');
    const productType = searchParams.get('productType');
    const search = searchParams.get('search');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const includeOutOfStock = searchParams.get('includeOutOfStock') === 'true';

    // Build where clause
    const where: any = {
      isActive: true,
    };

    // Only show products with stock unless explicitly requested
    if (!includeOutOfStock) {
      where.stock = { gt: 0 };
    }

    // Filter by category (legacy support)
    if (category) {
      where.category = category;
    }

    // Filter by animal type (new filtering)
    if (animalType) {
      where.animalType = animalType;
    }

    // Filter by product type
    if (productType) {
      where.productType = productType;
    }

    // Search functionality
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { brand: { contains: search, mode: 'insensitive' } },
        { breed: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Price range filtering
    if (minPrice || maxPrice) {
      where.price = {};
      if (minPrice) where.price.gte = parseFloat(minPrice);
      if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    const products = await prisma.product.findMany({
      where,
      include: {
        images: {
          orderBy: {
            order: 'asc',
          },
        },
        categoryRef: true, // Include category reference
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // Check admin authorization
    await requireAdmin();

    const body = await request.json();
    
    // Validate required fields
    const { name, price, category, stock } = body;
    if (!name || !price || !category || stock === undefined) {
      return NextResponse.json(
        { error: 'ข้อมูลไม่ครบถ้วน: ต้องมีชื่อ, ราคา, หมวดหมู่, และจำนวนสต็อก' },
        { status: 400 }
      );
    }

    // Validate price and stock are numbers
    if (typeof price !== 'number' || price <= 0) {
      return NextResponse.json(
        { error: 'ราคาต้องเป็นตัวเลขที่มากกว่า 0' },
        { status: 400 }
      );
    }

    if (typeof stock !== 'number' || stock < 0) {
      return NextResponse.json(
        { error: 'จำนวนสต็อกต้องเป็นตัวเลขที่มากกว่าหรือเท่ากับ 0' },
        { status: 400 }
      );
    }

    // Create the product with images
    const product = await prisma.product.create({
      data: {
        name: name.trim(),
        description: body.description?.trim() || null,
        price: price,
        salePrice: body.salePrice || null,
        discountPercent: body.discountPercent || null,
        category: category,
        categoryId: body.categoryId || null,
        stock: stock,
        productType: body.productType || 'OTHER',
        animalType: body.animalType || 'GENERAL',
        
        // Pet-specific fields
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
        
        // Vaccination tracking fields
        birthDate: body.birthDate ? new Date(body.birthDate) : null,
        firstVaccineDate: body.firstVaccineDate ? new Date(body.firstVaccineDate) : null,
        secondVaccineDate: body.secondVaccineDate ? new Date(body.secondVaccineDate) : null,
        vaccineStatus: body.vaccineStatus || null,
        vaccineNotes: body.vaccineNotes || null,
        
        // General product fields
        brand: body.brand || null,
        model: body.model || null,
        size: body.size || null,
        material: body.material || null,
        weight_grams: body.weightGrams || null,
        dimensions: body.dimensions || null,
        
        isActive: body.isActive ?? true,
        images: body.images ? {
          create: body.images.map((img: any) => ({
            imageUrl: img.imageUrl,
            altText: img.altText || null,
            isMain: img.isMain || false,
            order: img.order || 0,
          }))
        } : undefined,
      },
      include: {
        images: true,
      },
    });

    return NextResponse.json(product, { status: 201 });
  } catch (error: any) {
    console.error('Error creating product:', error);
    
    // Handle admin authorization error
    if (error.message === 'Unauthorized: Admin access required') {
      return NextResponse.json(
        { error: 'ไม่มีสิทธิ์ในการสร้างสินค้า' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: 'เกิดข้อผิดพลาดในการสร้างสินค้า' },
      { status: 500 }
    );
  }
}