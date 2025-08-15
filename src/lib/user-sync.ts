import { prisma } from "./prisma";

export interface LineUserProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
  email?: string;
}

/**
 * Sync user data from LINE profile to database
 */
export async function syncUserFromLineProfile(lineProfile: LineUserProfile) {
  try {
    console.log("🔄 Syncing user from LINE profile:", lineProfile.userId);
    
    const existingUser = await prisma.user.findUnique({
      where: { lineUserId: lineProfile.userId }
    });

    if (existingUser) {
      // Update existing user
      const updatedUser = await prisma.user.update({
        where: { lineUserId: lineProfile.userId },
        data: {
          displayName: lineProfile.displayName || existingUser.displayName,
          pictureUrl: lineProfile.pictureUrl || existingUser.pictureUrl,
          statusMessage: lineProfile.statusMessage || existingUser.statusMessage,
          email: lineProfile.email || existingUser.email,
          lastLoginAt: new Date(),
        }
      });
      
      console.log("✅ Updated existing user:", updatedUser.id);
      return updatedUser;
    } else {
      // Create new user
      const newUser = await prisma.user.create({
        data: {
          lineUserId: lineProfile.userId,
          displayName: lineProfile.displayName || '',
          pictureUrl: lineProfile.pictureUrl,
          statusMessage: lineProfile.statusMessage,
          email: lineProfile.email,
          phoneNumber: null,
          role: 'USER',
          isAdmin: false,
        }
      });
      
      console.log("✅ Created new user:", newUser.id);
      return newUser;
    }
  } catch (error) {
    console.error("❌ Error syncing user from LINE profile:", error);
    throw error;
  }
}

/**
 * Get user stats for admin dashboard
 */
export async function getUserStats() {
  try {
    const [totalUsers, newUsersThisMonth, adminUsers] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      prisma.user.count({
        where: {
          OR: [
            { isAdmin: true },
            { role: 'ADMIN' },
            { role: 'SUPER_ADMIN' }
          ]
        }
      })
    ]);

    return {
      totalUsers,
      newUsersThisMonth,
      adminUsers,
    };
  } catch (error) {
    console.error("❌ Error getting user stats:", error);
    return {
      totalUsers: 0,
      newUsersThisMonth: 0,
      adminUsers: 0,
    };
  }
}

/**
 * Get recent users for admin dashboard
 */
export async function getRecentUsers(limit: number = 10) {
  try {
    const recentUsers = await prisma.user.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      select: {
        id: true,
        lineUserId: true,
        displayName: true,
        pictureUrl: true,
        role: true,
        isAdmin: true,
        createdAt: true,
        lastLoginAt: true,
      }
    });

    return recentUsers;
  } catch (error) {
    console.error("❌ Error getting recent users:", error);
    return [];
  }
}

/**
 * Search users by name or LINE ID
 */
export async function searchUsers(query: string, limit: number = 20) {
  try {
    const users = await prisma.user.findMany({
      where: {
        OR: [
          { displayName: { contains: query } },
          { lineUserId: { contains: query } },
          { email: { contains: query } },
        ]
      },
      orderBy: { lastLoginAt: 'desc' },
      take: limit,
      select: {
        id: true,
        lineUserId: true,
        displayName: true,
        pictureUrl: true,
        email: true,
        role: true,
        isAdmin: true,
        createdAt: true,
        lastLoginAt: true,
      }
    });

    return users;
  } catch (error) {
    console.error("❌ Error searching users:", error);
    return [];
  }
}
