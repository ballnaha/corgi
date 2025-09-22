import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Clearing SimpleAuth session...');
    
    // Get cookies instance
    const cookieStore = cookies();
    
    // Clear the SimpleAuth session cookie
    cookieStore.set('liff-simple-session', '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    console.log('✅ SimpleAuth session cleared');
    
    return NextResponse.json({ 
      success: true, 
      message: 'SimpleAuth session cleared successfully' 
    });
    
  } catch (error) {
    console.error('❌ Error clearing SimpleAuth session:', error);
    return NextResponse.json(
      { error: 'Failed to clear SimpleAuth session' },
      { status: 500 }
    );
  }
}
