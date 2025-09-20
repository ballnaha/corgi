import { MetadataRoute } from 'next'

const BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://whatdadog.com' 
  : 'http://corgi.theredpotion.com'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/debug/',
          '/test-*',
          '/liff/',
          '/auth/',
          '/unauthorized/',
          '/payment-notification/',
        ],
      },
      {
        userAgent: 'Googlebot',
        allow: '/',
        disallow: [
          '/api/',
          '/admin/',
          '/debug/',
          '/test-*',
          '/liff/',
          '/auth/',
          '/unauthorized/',
          '/payment-notification/',
        ],
      },
    ],
    sitemap: `${BASE_URL}/sitemap.xml`,
    host: BASE_URL,
  }
}
