import { NextRequest, NextResponse } from "next/server";

/**
 * Vercel Cron sends `Authorization: Bearer $CRON_SECRET` on scheduled
 * invocations. Reject anything else so the route can't be triggered by a
 * random request to a guessed URL.
 */
export function requireCronSecret(req: NextRequest): NextResponse | null {
  const expected = process.env.CRON_SECRET;
  const got = req.headers.get("authorization");
  if (!expected || got !== `Bearer ${expected}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}
