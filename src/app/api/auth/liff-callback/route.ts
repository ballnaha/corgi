import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const code = url.searchParams.get('code');
    
    if (!code) {
      const res = NextResponse.redirect(new URL('/auth/error?error=NoCode', request.url));
      res.cookies.delete('next-auth.state');
      res.cookies.delete('next-auth.pkce.code_verifier');
      res.cookies.delete('liff-login-success');
      res.cookies.delete('liff-user-data');
      return res;
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
      let details = '';
      try { details = await tokenResponse.text(); } catch {}
      console.error('❌ Token exchange failed:', tokenResponse.status, tokenResponse.statusText, details);
      const res = NextResponse.redirect(new URL('/auth/error?error=TokenExchange', request.url));
      res.cookies.delete('next-auth.state');
      res.cookies.delete('next-auth.pkce.code_verifier');
      return res;
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
      let details = '';
      try { details = await profileResponse.text(); } catch {}
      console.error('❌ Profile fetch failed:', profileResponse.status, profileResponse.statusText, details);
      const res = NextResponse.redirect(new URL('/auth/error?error=ProfileFetch', request.url));
      res.cookies.delete('next-auth.state');
      res.cookies.delete('next-auth.pkce.code_verifier');
      return res;
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
    const res = NextResponse.redirect(new URL('/auth/error?error=CallbackError', request.url));
    res.cookies.delete('next-auth.state');
    res.cookies.delete('next-auth.pkce.code_verifier');
    res.cookies.delete('liff-login-success');
    res.cookies.delete('liff-user-data');
    return res;
  }
}
