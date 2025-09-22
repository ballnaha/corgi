import { NextRequest, NextResponse } from 'next/server';
import { authOptions } from '@/lib/auth';

// Debug NextAuth runtime configuration
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Debug NextAuth runtime config');
    
    const providers = authOptions.providers || [];
    const lineProvider = providers.find((p: any) => p.id === 'line');
    
    const config = {
      timestamp: new Date().toISOString(),
      debug: authOptions.debug,
      secret: authOptions.secret ? 'SET' : 'NOT SET',
      providers: {
        count: providers.length,
        names: providers.map((p: any) => p.id || p.name),
        lineProvider: lineProvider ? {
          id: lineProvider.id,
          name: lineProvider.name,
          type: lineProvider.type,
          checks: (lineProvider as any).checks || 'not set',
          clientId: (lineProvider as any).clientId ? 'SET' : 'NOT SET',
          clientSecret: (lineProvider as any).clientSecret ? 'SET' : 'NOT SET',
          authorization: (lineProvider as any).authorization,
          token: (lineProvider as any).token,
          userinfo: (lineProvider as any).userinfo
        } : 'LINE provider not found'
      },
      callbacks: {
        hasSignIn: !!authOptions.callbacks?.signIn,
        hasJwt: !!authOptions.callbacks?.jwt,
        hasSession: !!authOptions.callbacks?.session
      },
      pages: authOptions.pages || {},
      session: authOptions.session || {},
      cookies: authOptions.cookies || 'default',
      environment: {
        nodeEnv: process.env.NODE_ENV,
        nextAuthUrl: process.env.NEXTAUTH_URL,
        hasLineClientId: !!process.env.LINE_CLIENT_ID,
        hasLineClientSecret: !!process.env.LINE_CLIENT_SECRET
      }
    };
    
    console.log('📊 NextAuth runtime config:', config);
    
    return NextResponse.json(config);
    
  } catch (error) {
    console.error('❌ Debug config error:', error);
    return NextResponse.json({
      error: 'Debug failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
