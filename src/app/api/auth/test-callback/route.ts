import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

// Test NextAuth callback behavior
export async function GET(request: NextRequest) {
  try {
    console.log('🧪 Test Callback API called');
    const url = new URL(request.url);
    const searchParams = url.searchParams;
    
    console.log('📊 URL params:', Object.fromEntries(searchParams.entries()));
    console.log('🍪 Cookies:', request.cookies.toString());
    
    // Try to get session
    const session = await getServerSession(authOptions);
    
    const debug = {
      timestamp: new Date().toISOString(),
      url: request.url,
      params: Object.fromEntries(searchParams.entries()),
      cookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value])),
      session: session,
      hasSession: !!session,
      headers: {
        userAgent: request.headers.get('user-agent'),
        referer: request.headers.get('referer'),
        authorization: request.headers.get('authorization')
      }
    };
    
    console.log('🔍 Test callback debug:', debug);
    
    return NextResponse.json(debug);
    
  } catch (error) {
    console.error('❌ Test callback error:', error);
    return NextResponse.json({
      error: 'Test callback failed',
      message: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
