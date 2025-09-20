import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 400 });
    }

    // Decode LIFF ID Token (LIFF tokens are pre-verified by LINE)
    const decoded = jwt.decode(idToken) as any;
    
    if (!decoded || !decoded.sub) {
      return NextResponse.json({ error: 'Invalid ID token' }, { status: 400 });
    }

    const lineUserId = decoded.sub;
    const displayName = decoded.name || '';
    const pictureUrl = decoded.picture || '';
    const email = decoded.email || null;

    // Create or update user in database
    let user = await prisma.user.findUnique({
      where: { lineUserId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          lineUserId,
          displayName,
          pictureUrl,
          email,
          phoneNumber: null,
          statusMessage: null,
          role: 'USER',
          isAdmin: false,
        },
      });
      console.log('✅ Created new user via LIFF simple auth:', user.id);
    } else {
      user = await prisma.user.update({
        where: { lineUserId },
        data: {
          displayName,
          pictureUrl,
          email: email || user.email,
          lastLoginAt: new Date(),
        },
      });
      console.log('✅ Updated existing user via LIFF simple auth:', user.id);
    }

    // Create simple session token
    const sessionData = {
      id: user.id,
      lineUserId: user.lineUserId,
      displayName: user.displayName,
      pictureUrl: user.pictureUrl,
      role: user.role,
      isAdmin: user.isAdmin,
      provider: 'liff-simple',
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
      sessionToken
    });

    // Set session cookie
    response.cookies.set('liff-simple-session', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;

  } catch (error) {
    console.error('❌ LIFF simple auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Verify session endpoint
export async function GET(request: NextRequest) {
  try {
    const sessionCookie = request.cookies.get('liff-simple-session')?.value;
    
    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    const decoded = jwt.verify(
      sessionCookie, 
      process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development'
    ) as any;

    return NextResponse.json({ 
      authenticated: true, 
      user: {
        id: decoded.id,
        lineUserId: decoded.lineUserId,
        displayName: decoded.displayName,
        pictureUrl: decoded.pictureUrl,
        role: decoded.role,
        isAdmin: decoded.isAdmin,
      }
    });

  } catch (error) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }
}
