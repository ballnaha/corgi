import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: NextRequest) {
  try {
    console.log('🔥 Clearing SimpleAuth session...');
    
    // Create response with cleared cookie
    const response = NextResponse.json({ 
      success: true, 
      message: 'SimpleAuth session cleared successfully' 
    });
    
    // Clear the SimpleAuth session cookie
    response.cookies.set('liff-simple-session', '', {
      maxAge: 0,
      path: '/',
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'
    });

    console.log('✅ SimpleAuth session cleared');
    
    return response;
    
  } catch (error) {
    console.error('❌ Error clearing SimpleAuth session:', error);
    return NextResponse.json(
      { error: 'Failed to clear SimpleAuth session' },
      { status: 500 }
    );
  }
}
