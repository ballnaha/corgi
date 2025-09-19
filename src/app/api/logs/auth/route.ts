import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}));
    const rid = body?.rid || request.headers.get("x-rid") || null;
    const ua = request.headers.get("user-agent");
    const ref = request.headers.get("referer");

    console.error("[AUTH_REPORT]", {
      rid,
      ts: new Date().toISOString(),
      url: request.nextUrl.href,
      referer: ref,
      ua,
      body,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[AUTH_REPORT][ERROR]", err);
    return NextResponse.json({ ok: false }, { status: 500 });
  }
}


