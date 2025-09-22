import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Session API called');
    console.log('🍪 Request cookies:', request.cookies.toString());
    
    // Get NextAuth session
    const session = await getServerSession(authOptions);
    
    // Get all cookies properly
    const allCookies: Record<string, string> = {};
    request.cookies.getAll().forEach(cookie => {
      allCookies[cookie.name] = cookie.value;
    });

    const debug = {
      timestamp: new Date().toISOString(),
      hasSession: !!session,
      session: session,
      cookies: {
        all: allCookies,
        nextAuth: request.cookies.get('next-auth.session-token')?.value || 'not found',
        liffSimple: request.cookies.get('liff-simple-session')?.value || 'not found'
      },
      headers: {
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        authorization: request.headers.get('authorization')
      }
    };
    
    console.log('📊 Debug data:', debug);
    
    return NextResponse.json(debug);
    
  } catch (error) {
    console.error('❌ Debug session error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
