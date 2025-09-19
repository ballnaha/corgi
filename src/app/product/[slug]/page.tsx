import { Metadata } from "next";
import ProductPageClient from "./ProductPageClient";
import Script from "next/script";

interface Props {
  params: Promise<{ slug: string }>;
}

// ฟังก์ชันสำหรับ fetch ข้อมูล product สำหรับ SEO
async function getProduct(slug: string) {
  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com';
    const response = await fetch(`${baseUrl}/api/products/slug/${slug}`, {
      next: { revalidate: 60 } // Revalidate every 60 seconds
    });

    if (!response.ok) {
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error('Error fetching product for SEO:', error);
    return null;
  }
}

// Generate dynamic metadata for SEO
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProduct(slug);

  if (!product) {
    return {
      title: 'Product Not Found | Natpi & Corgi Farm and Pet Shop',
      description: 'The requested product could not be found.',
    };
  }

  const title = `${product.name} | Natpi & Corgi Farm and Pet Shop - ร้านขายสัตว์เลี้ยงและอุปกรณ์`;
  const description = product.description 
    ? `${product.description.slice(0, 160)}...`
    : `ซื้อ ${product.name} ราคา ฿${product.price.toLocaleString()} จาก Natpi & Corgi Farm and Pet Shop ร้านขายสัตว์เลี้ยงและอุปกรณ์คุณภาพ`;

  const imageUrl = product.imageUrl || product.image || '/images/natpi_logo.png';
  const productUrl = `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/product/${slug}`;

  return {
    title,
    description,
    keywords: [
      product.name,
      product.category,
      'สัตว์เลี้ยง',
      'อุปกรณ์สัตว์เลี้ยง',
      'ร้านสัตว์เลี้ยง',
      'Natpi & Corgi Farm and Pet Shop',
      'คอร์กี้',
      'Corgi',
      product.category === 'dogs' ? 'สุนัข' : '',
      product.category === 'cats' ? 'แมว' : '',
      product.category === 'birds' ? 'นก' : '',
      'ซื้อออนไลน์'
    ].filter(Boolean).join(', '),
    authors: [{ name: 'Natpi & Corgi Farm and Pet Shop' }],
    creator: 'Natpi & Corgi Farm and Pet Shop',
    publisher: 'Natpi & Corgi Farm and Pet Shop',
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        'max-video-preview': -1,
        'max-image-preview': 'large',
        'max-snippet': -1,
      },
    },
    openGraph: {
      type: 'website',
      title,
      description,
      url: productUrl,
      siteName: 'Natpi & Corgi Farm and Pet Shop',
      images: [
        {
          url: imageUrl,
          width: 800,
          height: 600,
          alt: product.name,
        },
        {
          url: imageUrl,
          width: 1200,
          height: 630,
          alt: product.name,
        },
      ],
      locale: 'th_TH',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [imageUrl],
      creator: '',
      site: '',
    },
    alternates: {
      canonical: productUrl,
    },
    other: {
      'product:price:amount': product.price.toString(),
      'product:price:currency': 'THB',
      'product:availability': product.stock > 0 ? 'in stock' : 'out of stock',
      'product:condition': 'new',
      'product:brand': 'Natpi & Corgi Farm and Pet Shop',
      'product:category': product.category,
    },
  };
}

export default async function ProductDetailPage({ params }: Props) {
  const { slug } = await params;
  const product = await getProduct(slug);

  // Generate JSON-LD structured data
  const jsonLd = product ? {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    description: product.description || `${product.name} from Natpi & Corgi Farm and Pet Shop`,
    image: product.imageUrl || product.image,
    brand: {
      '@type': 'Brand',
      name: 'Natpi & Corgi Farm and Pet Shop'
    },
    category: product.category,
    offers: {
      '@type': 'Offer',
      price: product.price,
      priceCurrency: 'THB',
      availability: product.stock > 0 ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
      url: `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/product/${slug}`,
      seller: {
        '@type': 'Organization',
        name: 'Natpi & Corgi Farm and Pet Shop',
        url: process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'
      }
    },

  } : null;

  return (
    <>
      {jsonLd && (
        <Script
          id="product-structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
      )}
      <ProductPageClient />
    </>
  );
}
