import { NextRequest, NextResponse } from 'next/server';

// Debug LINE OAuth configuration
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug LINE OAuth config');
    
    const config = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      lineConfig: {
        hasClientId: !!process.env.LINE_CLIENT_ID,
        hasClientSecret: !!process.env.LINE_CLIENT_SECRET,
        clientIdLength: process.env.LINE_CLIENT_ID?.length || 0,
        clientIdStart: process.env.LINE_CLIENT_ID?.substring(0, 8) || 'missing'
      },
      nextAuthConfig: {
        hasUrl: !!process.env.NEXTAUTH_URL,
        url: process.env.NEXTAUTH_URL || 'missing',
        hasSecret: !!process.env.NEXTAUTH_SECRET
      },
      oauthUrls: {
        authorizeUrl: 'https://access.line.me/oauth2/v2.1/authorize',
        tokenUrl: 'https://api.line.me/oauth2/v2.1/token',
        userinfoUrl: 'https://api.line.me/v2/profile',
        expectedCallbackUrl: `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/api/auth/callback/line`
      },
      testOAuthUrl: process.env.LINE_CLIENT_ID ? 
        `https://access.line.me/oauth2/v2.1/authorize?` +
        `response_type=code&` +
        `client_id=${process.env.LINE_CLIENT_ID}&` +
        `redirect_uri=${encodeURIComponent(`${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/api/auth/callback/line`)}&` +
        `scope=profile&` +
        `state=test123&` +
        `nonce=test456` : 'missing client id'
    };
    
    console.log('📊 LINE OAuth config:', config);
    
    return NextResponse.json(config);
    
  } catch (error) {
    console.error('❌ Debug LINE config error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
