import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Sync NextAuth session to SimpleAuth session
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Sync Session API called');
    
    // Get NextAuth session
    const session = await getServerSession(authOptions);
    
    console.log('🔍 Session check:', {
      hasSession: !!session,
      hasUser: !!session?.user,
      hasLineUserId: !!session?.user?.lineUserId,
      lineUserId: session?.user?.lineUserId,
      sessionUser: session?.user
    });
    
    if (!session?.user?.lineUserId) {
      console.log('❌ No NextAuth session or LINE user ID found');
      return NextResponse.json({ 
        error: 'No NextAuth session or LINE user ID found',
        debug: {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasLineUserId: !!session?.user?.lineUserId,
          sessionData: session?.user
        }
      }, { status: 401 });
    }

    // Get user from database
    const user = await prisma.user.findUnique({
      where: { lineUserId: session.user.lineUserId },
    });

    if (!user) {
      return NextResponse.json({ 
        error: 'User not found in database' 
      }, { status: 404 });
    }

    // Create SimpleAuth session token
    const sessionData = {
      id: user.id,
      lineUserId: user.lineUserId,
      displayName: user.displayName,
      pictureUrl: user.pictureUrl,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin,
      provider: 'nextauth-sync',
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
      synced: true
    });

    // Set SimpleAuth session cookie
    response.cookies.set('liff-simple-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    console.log('✅ Synced NextAuth session to SimpleAuth for user:', user.id);

    return response;

  } catch (error) {
    console.error('❌ Session sync error:', error);
    return NextResponse.json(
      { error: 'Session sync failed' },
      { status: 500 }
    );
  }
}
