import { NextRequest } from 'next/server';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import jwt from 'jsonwebtoken';

interface AuthenticatedUser {
  id: string;
  lineUserId?: string;
  displayName?: string;
  pictureUrl?: string;
  email?: string;
  source: 'nextauth' | 'simpleauth';
}

// Get user from either NextAuth or SimpleAuth
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    // Try NextAuth first
    const session = await getServerSession(authOptions);
    
    if (session?.user?.id) {
      console.log('✅ Found NextAuth session:', session.user.id);
      return {
        id: session.user.id,
        lineUserId: session.user.lineUserId,
        displayName: session.user.displayName || session.user.name || undefined,
        pictureUrl: session.user.image || undefined,
        email: session.user.email || undefined,
        source: 'nextauth'
      };
    }

    // Try SimpleAuth if NextAuth fails
    const sessionCookie = request.cookies.get('liff-simple-session')?.value;
    
    if (sessionCookie) {
      const decoded = jwt.verify(
        sessionCookie, 
        process.env.NEXTAUTH_SECRET || 'fallback-secret-for-development'
      ) as any;
      
      console.log('✅ Found SimpleAuth session:', decoded.id);
      
      return {
        id: decoded.id,
        lineUserId: decoded.lineUserId,
        displayName: decoded.displayName,
        pictureUrl: decoded.pictureUrl,
        email: decoded.email,
        source: 'simpleauth'
      };
    }

    console.log('❌ No authentication found');
    return null;
    
  } catch (error) {
    console.error('❌ Auth check error:', error);
    return null;
  }
}
