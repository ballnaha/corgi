import { NextAuthOptions } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      lineUserId?: string;
    };
  }

  interface User {
    id: string;
    lineUserId: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    lineUserId?: string;
  }
}

export const authOptions: NextAuthOptions = {
  providers: process.env.LINE_CLIENT_ID && process.env.LINE_CLIENT_SECRET ? [
    {
      id: "line",
      name: "LINE",
      type: "oauth",
      authorization: "https://access.line.me/oauth2/v2.1/authorize?scope=profile&response_type=code",
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
  ] : [],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account && user) {
        token.lineUserId = user.lineUserId;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub!;
        session.user.lineUserId = token.lineUserId;
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
  },
  secret: process.env.NEXTAUTH_SECRET || "fallback-secret-for-development",
};