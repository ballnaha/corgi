import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export function slugify(name: string): string {
  // Keep Unicode letters (L), marks (M) for combining accents, and numbers (N)
  // Replace other chars with '-'; trim leading/trailing '-'
  const base = name
    .toLowerCase()
    .normalize('NFC')
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, '-')
    .replace(/(^-|-$)+/g, '');
  return base;
}

export function generateSlug(name: string, id: string): string {
  const s = slugify(name);
  // If name cannot be slugified (e.g., becomes empty), fallback to id-only
  return s ? `${s}-${id}` : id;
}

export async function findProductBySlug(slug: string) {
  try {
    // Extract ID from slug (assuming format: "product-name-id")
    const normalized = slug.trim();
    const parts = normalized.split('-');
    const id = parts[parts.length - 1];
    if (!id) {
      return null;
    }
    
    const product = await prisma.product.findFirst({
      where: {
        id: id,
        isActive: true,
      },
      include: {
        images: {
          orderBy: {
            order: 'asc',
          },
        },
      },
    });

    return product;
  } catch (error) {
    console.error('Error finding product by slug:', error);
    return null;
  }
}

export async function getAllProducts() {
  try {
    const products = await prisma.product.findMany({
      where: {
        isActive: true,
      },
      include: {
        images: {
          orderBy: {
            order: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return products;
  } catch (error) {
    console.error('Error fetching products:', error);
    return [];
  }
}