import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserStats, getRecentUsers, searchUsers } from "@/lib/user-sync";

export async function GET(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.lineUserId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (!session.user.isAdmin && !session.user.role?.includes("ADMIN")) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10");

    switch (action) {
      case "stats":
        const stats = await getUserStats();
        return NextResponse.json(stats);

      case "recent":
        const recentUsers = await getRecentUsers(limit);
        return NextResponse.json(recentUsers);

      case "search":
        if (!query) {
          return NextResponse.json(
            { error: "Search query required" },
            { status: 400 }
          );
        }
        const searchResults = await searchUsers(query, limit);
        return NextResponse.json(searchResults);

      default:
        // Default: return stats and recent users
        const [userStats, recent] = await Promise.all([
          getUserStats(),
          getRecentUsers(limit)
        ]);
        
        return NextResponse.json({
          stats: userStats,
          recentUsers: recent
        });
    }

  } catch (error) {
    console.error("❌ Error in admin users API:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
