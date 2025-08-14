import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createUser, getUserById } from "@/lib/database";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.lineUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { lineUserId, displayName, pictureUrl, email, phoneNumber, statusMessage } = body;

    // Check if user already exists
    const existingUser = await getUserById(lineUserId);
    if (existingUser) {
      return NextResponse.json(existingUser);
    }

    // Create new user
    const newUser = await createUser({
      lineUserId,
      displayName,
      pictureUrl,
      email,
      phoneNumber,
      statusMessage,
    });

    return NextResponse.json(newUser, { status: 201 });
  } catch (error) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}