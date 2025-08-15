import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    // Clear LINE-specific cache headers
    const response = NextResponse.json({ 
      success: true, 
      message: "LINE cache cleared successfully" 
    });

    // Add headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    
    // Clear LINE-related cookies
    response.cookies.delete('next-auth.session-token');
    response.cookies.delete('next-auth.callback-url');
    response.cookies.delete('next-auth.csrf-token');

    return response;
  } catch (error) {
    console.error("Error clearing LINE cache:", error);
    return NextResponse.json(
      { error: "Failed to clear LINE cache" },
      { status: 500 }
    );
  }
}