import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Skip middleware completely for static assets, uploads, and SEO files
  if (request.nextUrl.pathname.startsWith('/uploads/') ||
      request.nextUrl.pathname.startsWith('/images/') ||
      request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.startsWith('/api/') ||
      request.nextUrl.pathname === '/sitemap.xml' ||
      request.nextUrl.pathname === '/robots.txt' ||
      request.nextUrl.pathname.match(/\.(png|jpg|jpeg|gif|webp|svg|ico|css|js|woff|woff2|ttf|eot)$/)) {
    return NextResponse.next();
  }
  
  // Skip middleware completely for blog routes (make them fully public like /home)
  if (request.nextUrl.pathname.startsWith('/blog')) {
    return NextResponse.next();
  }
  
  // Define public routes that should always be accessible
  const publicRoutes = [
    '/api/',
    '/_next/',
    '/auth/',
    '/images/',
    '/uploads/',
    '/product/',
    '/shop',
    '/home',
    '/checkout',
    '/profile',
    '/favorites',
    '/line-test',
    '/debug',
    '/test-order',
    '/payment-notification',
    '/order-success',
    '/sitemap.xml',
    '/robots.txt',
    '/unauthorized',
    '/',
    '/liff',
    '/favicon.ico'
  ];

  // Check if current path is a public route
  const isPublicRoute = publicRoutes.some(route => {
    if (route === '/') {
      return request.nextUrl.pathname === '/';
    }
    // For routes like /blog, /shop, etc., check if the path starts with the route
    if (route.endsWith('/')) {
      return request.nextUrl.pathname.startsWith(route);
    }
    // For exact paths and paths with sub-routes
    return request.nextUrl.pathname === route || request.nextUrl.pathname.startsWith(route + '/');
  });

  // Always allow access to public routes
  if (isPublicRoute) {
    // For LIFF-specific routes, add detection header
    const userAgent = request.headers.get('user-agent') || '';
    const isLineApp = userAgent.includes('Line/') && 
                     (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone'));
    
    const isLiffUrl = request.nextUrl.href.includes('liff.line.me') || 
                     request.nextUrl.href.includes('liff-web.line.me') ||
                     request.nextUrl.searchParams.has('liff');
    
    const isFromLiff = isLineApp || isLiffUrl;
    
    if (isFromLiff) {
      const response = NextResponse.next();
      response.headers.set('x-liff-environment', 'true');
      return response;
    }
    
    return NextResponse.next();
  }

  // Admin routes protection - let client-side handle auth for admin routes
  if (request.nextUrl.pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  // Check if request is from LIFF for protected routes
  const userAgent = request.headers.get('user-agent') || '';
  const isLineApp = userAgent.includes('Line/') && 
                   (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone'));
  
  const isLiffUrl = request.nextUrl.href.includes('liff.line.me') || 
                   request.nextUrl.href.includes('liff-web.line.me') ||
                   request.nextUrl.searchParams.has('liff');
  
  const isFromLiff = isLineApp || isLiffUrl;
  
  // For LIFF environment, let client-side handle all auth
  if (isFromLiff) {
    const response = NextResponse.next();
    response.headers.set('x-liff-environment', 'true');
    return response;
  }

  // Only redirect admin routes and truly protected routes, let 404 handle invalid URLs
  if (request.nextUrl.pathname.startsWith('/admin')) {
    const homeUrl = new URL('/home', request.url);
    return NextResponse.redirect(homeUrl);
  }
  
  // For other non-matching routes, let Next.js handle 404 naturally
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match admin routes for protection and key routes for LIFF detection
     * Let Next.js handle 404 for all other routes naturally
     */
    "/admin/:path*",
    "/shop/:path*",
    "/liff/:path*",
    "/product/:path*",
  ],
};