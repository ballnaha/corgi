import { MetadataRoute } from 'next'
import { PrismaClient } from '@prisma/client'
import { generateSlug } from '@/lib/products'

const prisma = new PrismaClient()

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://whatdadog.com' 
  : 'http://red1.theredpotion.com'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${BASE_URL}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `${BASE_URL}/home`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/shop`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/auth/signin`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
    },
    {
      url: `${BASE_URL}/checkout`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/favorites`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/profile`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.5,
    },
  ]

  try {
    // Dynamic product pages
    const products = await prisma.product.findMany({
      where: {
        isActive: true
      },
      select: {
        id: true,
        name: true,
        updatedAt: true
      }
    })

    const productPages: MetadataRoute.Sitemap = products.map(product => ({
      url: `${BASE_URL}/product/${generateSlug(product.name, product.id)}`,
      lastModified: product.updatedAt || new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    }))

    // Dynamic blog pages
    const blogPosts = await prisma.blogPost.findMany({
      where: {
        publishedAt: {
          lte: new Date()
        }
      },
      select: {
        slug: true,
        updatedAt: true
      }
    })

    const blogPages: MetadataRoute.Sitemap = blogPosts.map(post => ({
      url: `${BASE_URL}/blog/${post.slug}`,
      lastModified: post.updatedAt || new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    }))

    // Combine all pages
    const allPages = [...staticPages, ...productPages, ...blogPages]

    await prisma.$disconnect()

    return allPages

  } catch (error) {
    console.error('Error generating sitemap:', error)
    await prisma.$disconnect()
    
    // Return static pages if database fails
    return staticPages
  }
}
