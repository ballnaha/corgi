import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.lineUserId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { lineUserId: session.user.lineUserId },
      select: { displayName: true }
    });

    return NextResponse.json({ 
      displayName: user?.displayName || session.user.name || "ผู้ใช้งาน" 
    });
  } catch (error) {
    console.error("Error fetching user display name:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}