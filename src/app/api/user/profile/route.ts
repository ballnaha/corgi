import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { getUserById, updateUserLastLogin } from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    // Support both NextAuth and SimpleAuth
    const authUser = await getAuthenticatedUser(request);

    if (!authUser?.lineUserId) {
      console.log('❌ User profile API: No authenticated user found');
      return NextResponse.json(
        { error: "Unauthorized - User not found" },
        { status: 401 }
      );
    }

    console.log(`✅ User profile API: User ${authUser.id} authenticated via ${authUser.source}`);

    const user = await getUserById(authUser.lineUserId);

    if (!user) {
      console.error('❌ User not found in database:', authUser.lineUserId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // Update last login time
    await updateUserLastLogin(authUser.lineUserId);

    console.log('✅ User profile fetched successfully:', {
      id: user.id,
      email: user.email ? 'present' : 'null',
      phoneNumber: user.phoneNumber ? 'present' : 'null',
      statusMessage: user.statusMessage ? 'present' : 'null'
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("❌ Error fetching user profile:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}