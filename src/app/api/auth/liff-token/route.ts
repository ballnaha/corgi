import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    
    if (!idToken) {
      return NextResponse.json({ error: 'No ID token provided' }, { status: 400 });
    }

    // Verify LIFF ID Token (decode without verification for LIFF tokens)
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
      console.log('✅ Created new user via LIFF token:', user.id);
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
      console.log('✅ Updated existing user via LIFF token:', user.id);
    }

    // Create session manually by setting NextAuth cookies
    const response = NextResponse.json({ 
      success: true, 
      user: {
        id: user.id,
        lineUserId: user.lineUserId,
        displayName: user.displayName,
        role: user.role,
        isAdmin: user.isAdmin,
      }
    });

    // Create JWT token for NextAuth session
    const sessionToken = jwt.sign(
      {
        id: user.id,
        lineUserId: user.lineUserId,
        displayName: user.displayName,
        role: user.role,
        isAdmin: user.isAdmin,
        provider: 'line',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (30 * 24 * 60 * 60), // 30 days
      },
      process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development'
    );

    // Set NextAuth session cookie
    response.cookies.set('next-auth.session-token', sessionToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 30 * 24 * 60 * 60, // 30 days
    });

    return response;

  } catch (error) {
    console.error('❌ LIFF token auth error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
