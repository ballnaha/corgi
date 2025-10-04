import { Metadata } from 'next';

export const homePageMetadata: Metadata = {
  title: "Natpi & Corgi Farm and Pet Shop - ร้านขายสัตว์เลี้ยงและอุปกรณ์ครบครัน | หน้าหลัก",
  description: "ยินดีต้อนรับสู่ Natpi & Corgi Farm and Pet Shop ร้านขายลูกสุนัขคอร์กี้ สัตว์เลี้ยง และอุปกรณ์สัตว์เลี้ยงคุณภาพ พร้อมบริการครบครัน",
  keywords: [
    "สัตว์เลี้ยง",
    "ลูกสุนัขคอร์กี้", 
    "ร้านสัตว์เลี้ยง",
    "อาหารสุนัข",
    "อาหารแมว", 
    "ของเล่นสัตว์เลี้ยง",
    "pet shop thailand",
    "corgi puppies",
    "Natpi & Corgi Farm and Pet Shop",
    "พันธุ์แท้",
    "มีใบรับรอง"
  ].join(", "),
  authors: [{ name: "Natpi & Corgi Farm and Pet Shop" }],
  creator: "Natpi & Corgi Farm and Pet Shop",
  publisher: "Natpi & Corgi Farm and Pet Shop",
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
    title: "Natpi & Corgi Farm and Pet Shop - ร้านขายสัตว์เลี้ยงและอุปกรณ์ครบครัน",
    description: "ยินดีต้อนรับสู่ Natpi & Corgi Farm and Pet Shop ร้านขายลูกสุนัขคอร์กี้ สัตว์เลี้ยง และอุปกรณ์สัตว์เลี้ยงคุณภาพ พร้อมบริการครบครัน จัดส่งทั่วไทย",
    url: `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/home`,
    siteName: 'Natpi & Corgi Farm and Pet Shop',
    images: [
      {
        url: '/images/natpi_logo.png',
        width: 1200,
        height: 630,
        alt: 'Natpi & Corgi Farm and Pet Shop - ร้านขายสัตว์เลี้ยงและอุปกรณ์ครบครัน',
      },
      {
        url: '/images/icon-corgi.png',
        width: 800,
        height: 600,
        alt: 'คอร์กี้ - Natpi & Corgi Farm and Pet Shop',
      },
    ],
    locale: 'th_TH',
  },
  twitter: {
    card: 'summary_large_image',
    title: "Natpi & Corgi Farm and Pet Shop - ร้านขายสัตว์เลี้ยงและอุปกรณ์ครบครัน",
    description: "ยินดีต้อนรับสู่ Natpi & Corgi Farm and Pet Shop ร้านขายลูกสุนัขคอร์กี้ สัตว์เลี้ยง และอุปกรณ์สัตว์เลี้ยงคุณภาพ",
    images: ['/images/natpi_logo.png'],
  },
  alternates: {
    canonical: `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/home`,
  },
  other: {
    'business:type': 'Pet Store',
    'business:country': 'Thailand',
    'business:region': 'Bangkok',
    'price:currency': 'THB',
  },
};

// Structured Data JSON-LD
export const structuredData = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "Organization",
      "@id": `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/#organization`,
      "name": "Natpi & Corgi Farm and Pet Shop",
      "alternateName": "Natpi & Corgi Farm and Pet Shop",
      "description": "ร้านขายสัตว์เลี้ยงและอุปกรณ์สัตว์เลี้ยงครบครัน ด้วยความรักและใส่ใจในทุกรายละเอียด",
      "url": process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com',
      "logo": {
        "@type": "ImageObject",
        "url": `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/images/natpi_logo.png`,
        "width": 500,
        "height": 200
      },
      "sameAs": [
        "https://line.me/R/ti/p/@658jluqf"
      ]
    },
    {
      "@type": ["PetStore", "LocalBusiness"],
      "@id": `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/#localbusiness`,
      "name": "Natpi & Corgi Farm and Pet Shop",
      "description": "ร้านขายสัตว์เลี้ยงและอุปกรณ์สัตว์เลี้ยงครบครัน ด้วยความรักและใส่ใจในทุกรายละเอียด",
      "url": process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com',
      "telephone": "+66-XX-XXX-XXXX", // ใส่เบอร์จริง
      "priceRange": "฿฿",
      "currenciesAccepted": "THB",
      "paymentAccepted": "Cash, Credit Card, Bank Transfer",
      "address": {
        "@type": "PostalAddress",
        "addressCountry": "TH",
        "addressRegion": "Bangkok",
        "addressLocality": "Bangkok"
        // ใส่ที่อยู่จริง
      },
      "geo": {
        "@type": "GeoCoordinates"
        // ใส่พิกัดจริง
      },
      "openingHours": [
        "Mo-Su 09:00-18:00" // ปรับตามเวลาจริง
      ],
      "image": `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/images/natpi_logo.png`,
      "hasOfferCatalog": {
        "@type": "OfferCatalog",
        "name": "สัตว์เลี้ยงและอุปกรณ์",
        "itemListElement": [
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Product",
              "name": "ลูกสุนัขคอร์กี้",
              "category": "สัตว์เลี้ยง"
            }
          },
          {
            "@type": "Offer", 
            "itemOffered": {
              "@type": "Product",
              "name": "อาหารสัตว์เลี้ยง",
              "category": "อุปกรณ์สัตว์เลี้ยง"
            }
          },
          {
            "@type": "Offer",
            "itemOffered": {
              "@type": "Product", 
              "name": "ของเล่นสัตว์เลี้ยง",
              "category": "อุปกรณ์สัตว์เลี้ยง"
            }
          }
        ]
      }
    },
    {
      "@type": "WebSite",
      "@id": `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/#website`,
      "url": process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com',
      "name": "Natpi & Corgi Farm and Pet Shop",
      "description": "ร้านขายสัตว์เลี้ยงและอุปกรณ์สัตว์เลี้ยงครบครัน",
      "inLanguage": "th-TH",
      "potentialAction": {
        "@type": "SearchAction",
        "target": {
          "@type": "EntryPoint",
          "urlTemplate": `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/shop?search={search_term_string}`
        },
        "query-input": "required name=search_term_string"
      }
    }
  ]
};
