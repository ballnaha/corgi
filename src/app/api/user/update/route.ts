import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-utils";
import { updateUser } from "@/lib/database";

export async function PUT(request: NextRequest) {
  try {
    // Support both NextAuth and SimpleAuth
    const authUser = await getAuthenticatedUser(request);

    if (!authUser?.lineUserId) {
      console.log('❌ User update API: No authenticated user found');
      return NextResponse.json(
        { error: "Unauthorized - User not found" },
        { status: 401 }
      );
    }

    console.log(`✅ User update API: User ${authUser.id} authenticated via ${authUser.source}`);

    const body = await request.json();
    const { displayName, email, phoneNumber, statusMessage } = body;

    console.log('📝 Updating user data:', {
      lineUserId: authUser.lineUserId,
      displayName,
      email: email ? 'provided' : 'null',
      phoneNumber: phoneNumber ? 'provided' : 'null'
    });

    const updatedUser = await updateUser(authUser.lineUserId, {
      displayName,
      email,
      phoneNumber,
      statusMessage,
    });

    if (!updatedUser) {
      console.error('❌ User not found for update:', authUser.lineUserId);
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    console.log('✅ User updated successfully:', updatedUser.id);
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("❌ Error updating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}