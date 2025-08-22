import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  // Skip middleware for API routes, static files, auth pages, and home page
  if (
    request.nextUrl.pathname.startsWith('/api/') ||
    request.nextUrl.pathname.startsWith('/_next/') ||
    request.nextUrl.pathname.startsWith('/auth/') ||
    request.nextUrl.pathname === '/favicon.ico' ||
    request.nextUrl.pathname === '/home'
  ) {
    return NextResponse.next();
  }

  // Handle LIFF URL redirect
  if (request.nextUrl.pathname === '/liff') {
    return NextResponse.next();
  }

  // Check if request is from LIFF (LINE Front-end Framework)
  const userAgent = request.headers.get('user-agent') || '';
  const isLineApp = userAgent.includes('Line/') && 
                   (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone'));
  
  // Check if URL contains LIFF parameters
  const isLiffUrl = request.nextUrl.href.includes('liff.line.me') || 
                   request.nextUrl.href.includes('liff-web.line.me') ||
                   request.nextUrl.searchParams.has('liff');
  
  const isFromLiff = isLineApp || isLiffUrl;
  
  // Admin routes protection - let client-side handle auth for admin routes
  // This avoids edge runtime issues with next-auth and Prisma
  if (request.nextUrl.pathname.startsWith('/admin')) {
    // For admin routes, let the layout handle authentication and authorization
    // This prevents edge runtime compatibility issues
    return NextResponse.next();
  }
  
  // For LIFF environment, let client-side handle all auth
  if (isFromLiff) {
    // Add LIFF detection header for client-side use
    const response = NextResponse.next();
    response.headers.set('x-liff-environment', 'true');
    return response;
  }

  // Allow shop page without auth for normal web access
  if (request.nextUrl.pathname === '/shop') {
    return NextResponse.next();
  }

  return NextResponse.next();
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
     */
    "/((?!api|_next/static|_next/image|favicon.ico|auth).*)",
  ],
};