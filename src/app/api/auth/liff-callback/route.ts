import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    
    if (!code) {
      return NextResponse.redirect(new URL('/auth/signin?error=NoCode', request.url));
    }

    console.log('🔄 LIFF Callback received with code:', code);

    // Exchange code for access token
    const tokenResponse = await fetch('https://api.line.me/oauth2/v2.1/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: `${url.origin}/api/auth/liff-callback`,
        client_id: process.env.LINE_CLIENT_ID!,
        client_secret: process.env.LINE_CLIENT_SECRET!,
      }),
    });

    if (!tokenResponse.ok) {
      console.error('❌ Token exchange failed:', tokenResponse.statusText);
      return NextResponse.redirect(new URL('/auth/signin?error=TokenExchange', request.url));
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token received');

    // Get user profile
    const profileResponse = await fetch('https://api.line.me/v2/profile', {
      headers: {
        Authorization: `Bearer ${tokenData.access_token}`,
      },
    });

    if (!profileResponse.ok) {
      console.error('❌ Profile fetch failed:', profileResponse.statusText);
      return NextResponse.redirect(new URL('/auth/signin?error=ProfileFetch', request.url));
    }

    const profile = await profileResponse.json();
    console.log('✅ Profile received:', profile.displayName);

    // Create or update user in database
    let user = await prisma.user.findUnique({
      where: { lineUserId: profile.userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          lineUserId: profile.userId,
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          statusMessage: profile.statusMessage,
          email: null,
          phoneNumber: null,
          role: 'USER',
          isAdmin: false,
        },
      });
      console.log('✅ Created new user:', user.id);
    } else {
      user = await prisma.user.update({
        where: { lineUserId: profile.userId },
        data: {
          displayName: profile.displayName,
          pictureUrl: profile.pictureUrl,
          statusMessage: profile.statusMessage,
          lastLoginAt: new Date(),
        },
      });
      console.log('✅ Updated existing user:', user.id);
    }

    // Create NextAuth session manually
    const response = NextResponse.redirect(new URL('/shop', request.url));
    
    // Set session cookie manually (simplified approach)
    response.cookies.set('liff-login-success', '1', {
      maxAge: 60 * 5, // 5 minutes
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    response.cookies.set('liff-user-data', JSON.stringify({
      id: user.id,
      lineUserId: user.lineUserId,
      displayName: user.displayName,
      pictureUrl: user.pictureUrl,
      role: user.role,
      isAdmin: user.isAdmin,
    }), {
      maxAge: 60 * 5, // 5 minutes
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
    });

    return response;

  } catch (error) {
    console.error('❌ LIFF callback error:', error);
    return NextResponse.redirect(new URL('/auth/signin?error=CallbackError', request.url));
  }
}
