import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug Environment API called');
    
    const debug = {
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV,
      nextAuthUrl: process.env.NEXTAUTH_URL || 'NOT SET',
      nextAuthSecret: process.env.NEXTAUTH_SECRET ? 'SET (hidden)' : 'NOT SET',
      lineClientId: process.env.LINE_CLIENT_ID ? 
        `SET (${process.env.LINE_CLIENT_ID.substring(0, 10)}...)` : 'NOT SET',
      lineClientSecret: process.env.LINE_CLIENT_SECRET ? 'SET (hidden)' : 'NOT SET',
      expectedCallbackUrl: `${process.env.NEXTAUTH_URL || 'https://corgi.theredpotion.com'}/api/auth/callback/line`,
      checks: {
        hasLineClientId: !!process.env.LINE_CLIENT_ID,
        hasLineClientSecret: !!process.env.LINE_CLIENT_SECRET,
        hasNextAuthUrl: !!process.env.NEXTAUTH_URL,
        hasNextAuthSecret: !!process.env.NEXTAUTH_SECRET,
        isProduction: process.env.NODE_ENV === 'production'
      },
      recommendations: [] as string[]
    };

    // Add recommendations based on missing configs
    if (!process.env.LINE_CLIENT_ID) {
      debug.recommendations.push('❌ LINE_CLIENT_ID is missing');
    }
    if (!process.env.LINE_CLIENT_SECRET) {
      debug.recommendations.push('❌ LINE_CLIENT_SECRET is missing');
    }
    if (!process.env.NEXTAUTH_URL) {
      debug.recommendations.push('❌ NEXTAUTH_URL is missing (should be https://corgi.theredpotion.com)');
    }
    if (!process.env.NEXTAUTH_SECRET) {
      debug.recommendations.push('❌ NEXTAUTH_SECRET is missing');
    }

    if (debug.recommendations.length === 0) {
      debug.recommendations.push('✅ All environment variables are set');
    }

    console.log('📊 Environment debug data:', debug);
    
    return NextResponse.json(debug);
    
  } catch (error) {
    console.error('❌ Debug environment error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
