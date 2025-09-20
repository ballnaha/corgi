import { NextRequest, NextResponse } from 'next/server';

// Deprecate this route to avoid double OAuth flows with NextAuth
// Ensure LINE Login callback is set to /api/auth/callback/line in LINE Developers console.
export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const hasCode = url.searchParams.has('code');
  const target = new URL('/auth/error?error=DeprecatedLiffCallback', request.url);
  console.warn('[LIFF-CALLBACK] Deprecated endpoint called. Please use /api/auth/callback/line');
  // If someone hits this with a code, just send to a visible error to avoid burning the code twice
  return NextResponse.redirect(target);
}
