import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/cron-auth";
import { buildDigestData, digestHtml } from "@/lib/digest";

export async function GET(req: NextRequest) {
  const unauthorized = requireCronSecret(req);
  if (unauthorized) return unauthorized;

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.DIGEST_FROM_EMAIL;
  if (!apiKey || !from) {
    return NextResponse.json({ error: "RESEND_API_KEY or DIGEST_FROM_EMAIL not configured" }, { status: 500 });
  }
  const resend = new Resend(apiKey);

  const subscribers = await prisma.digestSubscriber.findMany({
    where: { frequency: "weekly" },
    include: { user: true, location: true },
  });

  let sent = 0;
  for (const sub of subscribers) {
    const data = await buildDigestData(sub.locationId);
    const html = digestHtml(data, sub.location?.name ?? null);
    await resend.emails.send({
      from,
      to: sub.user.email,
      subject: `UES Reliability — Weekly Digest${sub.location ? ` (${sub.location.name})` : ""}`,
      html,
    });
    sent++;
  }

  return NextResponse.json({ ok: true, sent });
}
