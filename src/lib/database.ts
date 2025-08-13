import { prisma } from './prisma'
import type { User } from '@prisma/client'

export type { User } from '@prisma/client'

// Get user by LINE User ID
export async function getUserById(lineUserId: string): Promise<User | null> {
  try {
    const user = await prisma.user.findUnique({
      where: {
        lineUserId: lineUserId,
      },
    })
    return user
  } catch (error) {
    console.error('Error getting user by ID:', error)
    return null
  }
}

// Create new user
export async function createUser(userData: {
  lineUserId: string;
  displayName: string;
  pictureUrl?: string;
  email?: string;
  statusMessage?: string;
}): Promise<User> {
  try {
    const user = await prisma.user.create({
      data: {
        lineUserId: userData.lineUserId,
        displayName: userData.displayName,
        pictureUrl: userData.pictureUrl,
        email: userData.email,
        statusMessage: userData.statusMessage,
      },
    })
    return user
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

// Update user's last login time
export async function updateUserLastLogin(lineUserId: string): Promise<void> {
  try {
    await prisma.user.update({
      where: {
        lineUserId: lineUserId,
      },
      data: {
        lastLoginAt: new Date(),
      },
    })
  } catch (error) {
    console.error('Error updating last login:', error)
  }
}

// Update user profile
export async function updateUser(
  lineUserId: string,
  updates: {
    displayName?: string;
    email?: string;
    statusMessage?: string;
    pictureUrl?: string;
  }
): Promise<User | null> {
  try {
    const user = await prisma.user.update({
      where: {
        lineUserId: lineUserId,
      },
      data: updates,
    })
    return user
  } catch (error) {
    console.error('Error updating user:', error)
    return null
  }
}

// Get all users (for admin purposes)
export async function getAllUsers(): Promise<User[]> {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: 'desc',
      },
    })
    return users
  } catch (error) {
    console.error('Error getting all users:', error)
    return []
  }
}

// Delete user
export async function deleteUser(lineUserId: string): Promise<boolean> {
  try {
    await prisma.user.delete({
      where: {
        lineUserId: lineUserId,
      },
    })
    return true
  } catch (error) {
    console.error('Error deleting user:', error)
    return false
  }
}

// Get user stats
export async function getUserStats() {
  try {
    const totalUsers = await prisma.user.count()
    const recentUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
        },
      },
    })

    return {
      totalUsers,
      recentUsers,
    }
  } catch (error) {
    console.error('Error getting user stats:', error)
    return {
      totalUsers: 0,
      recentUsers: 0,
    }
  }
}