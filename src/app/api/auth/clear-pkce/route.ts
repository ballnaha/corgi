import { NextRequest, NextResponse } from 'next/server';

// Clear PKCE and other NextAuth cookies
export async function POST(request: NextRequest) {
  try {
    console.log('🧹 Clearing NextAuth cookies');
    
    const response = NextResponse.json({ 
      success: true, 
      message: 'NextAuth cookies cleared',
      timestamp: new Date().toISOString()
    });

    // Clear all NextAuth cookies
    const cookiesToClear = [
      'next-auth.pkce.code_verifier',
      'next-auth.state', 
      'next-auth.csrf-token',
      'next-auth.callback-url',
      'next-auth.session-token',
      '__Host-next-auth.csrf-token',
      '__Secure-next-auth.callback-url'
    ];

    cookiesToClear.forEach(cookieName => {
      response.cookies.set(cookieName, '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 0 // Expire immediately
      });
    });

    console.log('✅ Cleared NextAuth cookies:', cookiesToClear);

    return response;
    
  } catch (error) {
    console.error('❌ Clear cookies error:', error);
    return NextResponse.json({
      error: 'Clear failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
