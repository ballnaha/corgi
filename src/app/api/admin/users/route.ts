import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getUserStats, getRecentUsers, searchUsers } from "@/lib/user-sync";

export async function GET(request: NextRequest) {
  try {
    console.log("🔄 Admin users API called");

    // Check authentication
    const session = await getServerSession(authOptions);
    console.log("👤 Session user:", session?.user?.lineUserId);

    if (!session?.user?.lineUserId) {
      console.log("❌ No session or lineUserId");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if user is admin
    if (!session.user.isAdmin && !session.user.role?.includes("ADMIN")) {
      console.log("❌ User is not admin:", {
        isAdmin: session.user.isAdmin,
        role: session.user.role,
      });
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    console.log("✅ Admin access confirmed");

    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const query = searchParams.get("q");
    const limit = parseInt(searchParams.get("limit") || "10");

    console.log("📋 Request params:", { action, query, limit });

    switch (action) {
      case "stats":
        console.log("📊 Getting stats only");
        const stats = await getUserStats();
        return NextResponse.json(stats);

      case "recent":
        console.log("👥 Getting recent users only");
        const recentUsers = await getRecentUsers(limit);
        return NextResponse.json(recentUsers);

      case "search":
        if (!query) {
          return NextResponse.json(
            { error: "Search query required" },
            { status: 400 }
          );
        }
        console.log("🔍 Searching users");
        const searchResults = await searchUsers(query, limit);
        return NextResponse.json(searchResults);

      default:
        console.log("📊👥 Getting both stats and recent users");
        // Default: return stats and recent users
        const [userStats, recent] = await Promise.all([
          getUserStats(),
          getRecentUsers(limit),
        ]);

        console.log("✅ Data fetched successfully:", {
          statsCount: Object.keys(userStats).length,
          usersCount: recent.length,
        });

        return NextResponse.json({
          stats: userStats,
          recentUsers: recent,
        });
    }
  } catch (error) {
    console.error("❌ Error in admin users API:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Internal server error", details: errorMessage },
      { status: 500 }
    );
  }
}
