import { NextAuthOptions } from "next-auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      lineUserId?: string;
      displayName?: string | null;
      role?: string;
      isAdmin?: boolean;
    };
  }

  interface User {
    id: string;
    lineUserId: string;
    role?: string;
    isAdmin?: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    lineUserId?: string;
    displayName?: string;
    role?: string;
    isAdmin?: boolean;
  }
}

export const authOptions: NextAuthOptions = {
  providers:
    process.env.LINE_CLIENT_ID && process.env.LINE_CLIENT_SECRET
      ? [
          {
            id: "line",
            name: "LINE",
            type: "oauth",
            authorization: {
              url: "https://access.line.me/oauth2/v2.1/authorize",
              params: {
                scope: "profile",
                response_type: "code",
              },
            },
            token: "https://api.line.me/oauth2/v2.1/token",
            userinfo: "https://api.line.me/v2/profile",
            clientId: process.env.LINE_CLIENT_ID,
            clientSecret: process.env.LINE_CLIENT_SECRET,
            profile(profile) {
              return {
                id: profile.userId,
                lineUserId: profile.userId,
                name: profile.displayName,
                email: profile.email || null,
                image: profile.pictureUrl,
              };
            },
          },
        ]
      : [],
  callbacks: {
    async signIn({ user, account, profile, email, credentials }) {
      // รองรับ LIFF login ที่อาจไม่มี state parameter
      if (account?.provider === "line") {
        console.log("✅ LINE OAuth sign in successful");
        return true;
      }
      return true;
    },
    async jwt({ token, user, account, profile }) {
      if (account && user) {
        token.lineUserId = user.lineUserId;

        // Create or update user in database after successful LINE login
        try {
          let dbUser = await prisma.user.findUnique({
            where: { lineUserId: user.lineUserId },
            // @ts-ignore - Prisma types not updated yet
            select: {
              displayName: true,
              id: true,
              role: true,
              isAdmin: true,
              pictureUrl: true,
              email: true,
            },
          });

          if (!dbUser) {
            // Create new user if doesn't exist
            dbUser = await prisma.user.create({
              data: {
                lineUserId: user.lineUserId,
                displayName: user.name || "",
                pictureUrl: user.image,
                email: user.email,
                phoneNumber: null,
                statusMessage: null,
                // @ts-ignore - Prisma types not updated yet
                role: "USER", // Default role
                // @ts-ignore - Prisma types not updated yet
                isAdmin: false, // Default admin status
              },
              // @ts-ignore - Prisma types not updated yet
              select: {
                displayName: true,
                id: true,
                role: true,
                isAdmin: true,
                pictureUrl: true,
                email: true,
              },
            });
            console.log("✅ Created new user after LINE login:");
            console.log(`   - User ID: ${dbUser.id}`);
            console.log(`   - LINE ID: ${user.lineUserId}`);
            console.log(`   - Name: ${user.name}`);
            // @ts-ignore - Prisma types not updated yet
            console.log(`   - Role: ${dbUser.role}`);
          } else {
            // Update existing user with latest LINE profile data and login time
            dbUser = await prisma.user.update({
              where: { lineUserId: user.lineUserId },
              data: {
                lastLoginAt: new Date(),
                displayName: user.name || dbUser.displayName, // Update if changed
                pictureUrl: user.image || dbUser.pictureUrl, // Update profile picture
                email: user.email || dbUser.email, // Update email if provided
              },
              // @ts-ignore - Prisma types not updated yet
              select: {
                displayName: true,
                id: true,
                role: true,
                isAdmin: true,
                pictureUrl: true,
                email: true,
              },
            });
            console.log("✅ Updated existing user login:");
            console.log(`   - User ID: ${dbUser.id}`);
            console.log(`   - LINE ID: ${user.lineUserId}`);
            console.log(`   - Name: ${user.name}`);
            // @ts-ignore - Prisma types not updated yet
            console.log(`   - Role: ${dbUser.role}`);
            // @ts-ignore - Prisma types not updated yet
            console.log(`   - Is Admin: ${dbUser.isAdmin}`);
          }

          token.displayName = dbUser?.displayName;
          // @ts-ignore - Prisma types not updated yet
          token.role = dbUser?.role;
          // @ts-ignore - Prisma types not updated yet
          token.isAdmin = dbUser?.isAdmin;
        } catch (error) {
          console.error(
            "❌ Error creating/updating user after LINE login:",
            error
          );
          console.error("   - LINE User ID:", user.lineUserId);
          console.error("   - User Name:", user.name);
          console.error("   - Error Details:", error);

          // Still allow login even if database operation fails
          // Use session data as fallback
          token.displayName = user.name || "";
          token.role = "USER";
          token.isAdmin = false;
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.lineUserId = token.lineUserId;
        session.user.displayName = token.displayName;
        session.user.role = token.role;
        session.user.isAdmin = token.isAdmin;
      }
      return session;
    },
  },
  debug: process.env.NODE_ENV === "development",
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  useSecureCookies: process.env.NODE_ENV === "production",
  // Add events to debug OAuth flow
  events: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "line") {
        console.log("✅ LINE OAuth sign-in successful", {
          userId: user.id,
          provider: account.provider,
          accountId: account.providerAccountId
        });
      }
    },
    async signOut({ session, token }) {
      console.log("👋 User signed out", { sessionId: session?.user?.id });
    },
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
  // Add headers to prevent caching
  cookies: {
    sessionToken: {
      name: `next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax", 
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 24 * 60 * 60, // 30 days
      },
    },
    callbackUrl: {
      name: `next-auth.callback-url`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 60, // 10 minutes
      },
    },
    csrfToken: {
      name: `next-auth.csrf-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 60, // 10 minutes
      },
    },
    state: {
      name: `next-auth.state`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 60, // 10 minutes
      },
    },
    pkceCodeVerifier: {
      name: `next-auth.pkce.code_verifier`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
        maxAge: 10 * 60, // 10 minutes
      },
    },
  },
};
