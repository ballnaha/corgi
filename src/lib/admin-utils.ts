import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { prisma } from "./prisma";

/**
 * Check if the current user is an admin
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.lineUserId) {
      return false;
    }

    const user = await prisma.user.findUnique({
      where: { lineUserId: session.user.lineUserId },
      select: { isAdmin: true, role: true }
    });

    return user?.isAdmin === true || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  } catch (error) {
    console.error("Error checking admin status:", error);
    return false;
  }
}

/**
 * Check if a specific user is an admin by LINE User ID
 */
export async function checkUserIsAdmin(lineUserId: string): Promise<boolean> {
  try {
    const user = await prisma.user.findUnique({
      where: { lineUserId },
      select: { isAdmin: true, role: true }
    });

    return user?.isAdmin === true || user?.role === "ADMIN" || user?.role === "SUPER_ADMIN";
  } catch (error) {
    console.error("Error checking user admin status:", error);
    return false;
  }
}

/**
 * Get current user's role
 */
export async function getCurrentUserRole(): Promise<string | null> {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.lineUserId) {
      return null;
    }

    const user = await prisma.user.findUnique({
      where: { lineUserId: session.user.lineUserId },
      select: { role: true }
    });

    return user?.role || "USER";
  } catch (error) {
    console.error("Error getting user role:", error);
    return null;
  }
}

/**
 * Promote a user to admin
 */
export async function promoteToAdmin(lineUserId: string): Promise<boolean> {
  try {
    await prisma.user.update({
      where: { lineUserId },
      data: { 
        isAdmin: true,
        role: "ADMIN"
      }
    });
    return true;
  } catch (error) {
    console.error("Error promoting user to admin:", error);
    return false;
  }
}

/**
 * Admin authorization middleware for API routes
 */
export async function requireAdmin(): Promise<void> {
  const isAdmin = await checkIsAdmin();
  if (!isAdmin) {
    throw new Error("Unauthorized: Admin access required");
  }
}

/**
 * Role constants
 */
export const USER_ROLES = {
  USER: "USER",
  ADMIN: "ADMIN", 
  SUPER_ADMIN: "SUPER_ADMIN"
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];
