import { prisma } from "@/lib/prisma";
import { User } from "@prisma/client";

interface SessionUser {
  id: string;
  name?: string | null;
  email?: string | null;
  lineUserId?: string;
}

/**
 * ตรวจสอบและสร้าง user ในฐานข้อมูลหากยังไม่มี
 * @param sessionUser - ข้อมูล user จาก session
 * @returns User object หรือ null หากเกิดข้อผิดพลาด
 */
export async function ensureUserExists(sessionUser: SessionUser): Promise<User | null> {
  try {
    // ตรวจสอบข้อมูล session ที่จำเป็น
    if (!sessionUser.id) {
      console.error("Session user ID is missing");
      return null;
    }

    console.log("Ensuring user exists for session:", {
      id: sessionUser.id,
      name: sessionUser.name,
      email: sessionUser.email,
      lineUserId: sessionUser.lineUserId
    });

    // ตรวจสอบ user ในฐานข้อมูล
    let user = await prisma.user.findUnique({
      where: { id: sessionUser.id }
    });

    if (!user) {
      console.log("User not found in database, creating new user:", sessionUser.id);
      
      try {
        console.log("Attempting to create user with data:", {
          id: sessionUser.id,
          lineUserId: sessionUser.lineUserId || sessionUser.id,
          displayName: sessionUser.name || "Unknown User",
          email: sessionUser.email
        });

        // สร้าง user ใหม่
        user = await prisma.user.create({
          data: {
            id: sessionUser.id,
            lineUserId: sessionUser.lineUserId || sessionUser.id, // ใช้ id หาก lineUserId ไม่มี
            displayName: sessionUser.name || "Unknown User",
            email: sessionUser.email,
          }
        });
        
        console.log("Created new user successfully:", user.id);
      } catch (userCreateError: any) {
        console.error("Failed to create user:", {
          error: userCreateError.message,
          code: userCreateError.code,
          meta: userCreateError.meta,
          sessionUser: sessionUser
        });
        
        // ตรวจสอบว่าเป็น unique constraint error หรือไม่
        if (userCreateError.code === 'P2002') {
          console.log("Unique constraint violation, trying to find existing user...");
          
          // ลองหา user อีกครั้ง (อาจมีการสร้างพร้อมกัน - race condition)
          user = await prisma.user.findUnique({
            where: { id: sessionUser.id }
          });
          
          if (!user) {
            // ลองหาด้วย lineUserId
            user = await prisma.user.findUnique({
              where: { lineUserId: sessionUser.lineUserId || sessionUser.id }
            });
          }
          
          if (user) {
            console.log("Found existing user after creation attempt:", user.id);
          } else {
            console.error("Failed to create or find user in database after unique constraint error");
            return null;
          }
        } else {
          console.error("Non-unique constraint error when creating user");
          
          // Last attempt: ลองสร้างด้วย fallback data
          try {
            console.log("Attempting fallback user creation...");
            user = await prisma.user.create({
              data: {
                id: sessionUser.id,
                lineUserId: `fallback_${sessionUser.id}`, // ใช้ fallback lineUserId
                displayName: sessionUser.name || `User_${sessionUser.id.slice(-8)}`,
                email: sessionUser.email,
              }
            });
            console.log("Fallback user creation successful:", user.id);
          } catch (fallbackError) {
            console.error("Fallback user creation also failed:", fallbackError);
            return null;
          }
        }
      }
    } else {
      console.log("User found in database:", user.id);
    }

    return user;
  } catch (error) {
    console.error("Error in ensureUserExists:", error);
    return null;
  }
}

/**
 * ตรวจสอบและอัปเดตข้อมูล user หากมีการเปลี่ยนแปลงจาก session
 * @param sessionUser - ข้อมูล user จาก session
 * @returns User object หรือ null หากเกิดข้อผิดพลาด
 */
export async function syncUserFromSession(sessionUser: SessionUser): Promise<User | null> {
  try {
    const user = await ensureUserExists(sessionUser);
    
    if (!user) {
      return null;
    }

    // ตรวจสอบว่าข้อมูลใน session ใหม่กว่าหรือไม่
    const needsUpdate = (
      user.displayName !== sessionUser.name ||
      user.email !== sessionUser.email ||
      user.lineUserId !== sessionUser.lineUserId
    );

    if (needsUpdate) {
      console.log("Updating user data from session:", sessionUser.id);
      
      const updatedUser = await prisma.user.update({
        where: { id: sessionUser.id },
        data: {
          displayName: sessionUser.name || user.displayName,
          email: sessionUser.email || user.email,
          lineUserId: sessionUser.lineUserId || user.lineUserId,
        }
      });
      
      console.log("Updated user data:", updatedUser.id);
      return updatedUser;
    }

    return user;
  } catch (error) {
    console.error("Error in syncUserFromSession:", error);
    return null;
  }
}

/**
 * ตรวจสอบว่า user มีสิทธิ์เข้าถึง resource หรือไม่
 * @param userId - ID ของ user
 * @param resourceUserId - ID ของ user ที่เป็นเจ้าของ resource
 * @returns boolean
 */
export function canAccessResource(userId: string, resourceUserId: string): boolean {
  return userId === resourceUserId;
}

/**
 * ดึงข้อมูล user พร้อมกับข้อมูลที่เกี่ยวข้อง
 * @param userId - ID ของ user
 * @returns User object พร้อมข้อมูลที่เกี่ยวข้อง
 */
export async function getUserWithRelations(userId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        orders: {
          orderBy: { createdAt: 'desc' },
          take: 5, // เอาล่าสุด 5 รายการ
          include: {
            orderItems: {
              include: {
                product: {
                  select: {
                    id: true,
                    name: true,
                    images: true,
                    category: true,
                  }
                }
              }
            }
          }
        },
        favorites: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                images: true,
                price: true,
                category: true,
                isActive: true,
              }
            }
          }
        }
      }
    });

    return user;
  } catch (error) {
    console.error("Error getting user with relations:", error);
    return null;
  }
}
