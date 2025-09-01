import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Skip middleware completely for static assets and uploads
  if (request.nextUrl.pathname.startsWith('/uploads/') ||
      request.nextUrl.pathname.startsWith('/images/') ||
      request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.startsWith('/api/') ||
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

  // For non-LIFF users accessing truly protected routes, redirect to home
  const homeUrl = new URL('/home', request.url);
  return NextResponse.redirect(homeUrl);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - auth (auth pages)
     * - images (static images)
     * - product (product pages)
     * - shop (shop page)
     * - home (home page)
     * - blog (blog pages) - completely public like home
     * - uploads (file uploads)
     * - checkout, profile, favorites (handled separately)
     * - line-test (for testing LINE API)
     * - debug (for debugging session)
     * - test-order (for testing order flow)
     * - payment-notification (for payment upload)
     * - order-success (for order success page)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|auth|images|product|shop|home|blog|uploads|checkout|profile|favorites|line-test|debug|test-order|payment-notification|order-success).*)",
  ],
};