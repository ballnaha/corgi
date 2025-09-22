import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// This endpoint is called after successful NextAuth login to create SimpleAuth session
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 NextAuth callback handler called');
    
    // Get NextAuth session
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.lineUserId) {
      console.log('❌ No NextAuth session or LINE user ID found');
      return NextResponse.json({ 
        error: 'No NextAuth session or LINE user ID found' 
      }, { status: 401 });
    }

    console.log('✅ NextAuth session found for LINE user:', session.user.lineUserId);

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { lineUserId: session.user.lineUserId },
    });

    if (!user) {
      console.log('❌ User not found in database');
      return NextResponse.json({ 
        error: 'User not found in database' 
      }, { status: 404 });
    }

    console.log('✅ User found in database:', user.id);

    // Create SimpleAuth session token
    const sessionData = {
      id: user.id,
      lineUserId: user.lineUserId,
      displayName: user.displayName,
      pictureUrl: user.pictureUrl,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      provider: 'nextauth-callback',
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
    };

    const sessionToken = jwt.sign(
      sessionData,
      process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development'
    );

    const response = NextResponse.json({ 
      success: true, 
      user: sessionData,
      message: 'SimpleAuth session created successfully'
    });

    // Set SimpleAuth session cookie
    response.cookies.set('liff-simple-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    console.log('✅ Created SimpleAuth session for NextAuth user:', user.id);

    return response;

  } catch (error) {
    console.error('❌ NextAuth callback handler error:', error);
    return NextResponse.json({
      error: 'Callback handler failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
