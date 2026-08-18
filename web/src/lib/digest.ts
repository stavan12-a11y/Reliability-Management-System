import { prisma } from "@/lib/prisma";

export async function buildDigestData(locationId?: string | null) {
  const equipmentWhere = { deletedAt: null, ...(locationId ? { locationId } : {}) };
  const issueWhere = { asset: { deletedAt: null, ...(locationId ? { locationId } : {}) } };

  const [unavailable, limited, issues] = await Promise.all([
    prisma.equipment.count({ where: { ...equipmentWhere, status: "unavailable" } }),
    prisma.equipment.count({ where: { ...equipmentWhere, status: "limited" } }),
    prisma.issue.findMany({
      where: issueWhere,
      include: { asset: true },
      orderBy: { identifiedAt: "asc" },
    }),
  ]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const overdue = issues.filter((i) => i.returnEta && i.returnEta < today);
  const newSinceYesterday = issues.filter((i) => i.createdAt >= yesterday);
  const longestOpen = [...issues].slice(0, 3);

  return { unavailable, limited, overdueCount: overdue.length, newSinceYesterdayCount: newSinceYesterday.length, longestOpen };
}

export type DigestData = Awaited<ReturnType<typeof buildDigestData>>;

// Same copy pattern as the Overview page's "Daily digest preview" — see
// BUILD_SPEC.md section 5 ("the text-generation part is done").
export function digestSummaryText(d: DigestData) {
  return `${d.unavailable} assets unavailable, ${d.limited} operating with limitations. ${d.overdueCount} issue${d.overdueCount !== 1 ? "s" : ""} overdue on next steps. ${d.newSinceYesterdayCount} update${d.newSinceYesterdayCount !== 1 ? "s" : ""} logged since yesterday. Open the dashboard for details.`;
}

export function digestHtml(d: DigestData, locationName: string | null) {
  const rows = d.longestOpen
    .map((i) => `<li>${i.assetId} — ${i.description} (identified ${i.identifiedAt.toISOString().slice(0, 10)})</li>`)
    .join("");
  return `
    <div style="font-family: -apple-system, sans-serif; color: #1a1a1a;">
      <h2 style="margin: 0 0 12px;">UES Reliability — Weekly Digest${locationName ? ` · ${locationName}` : ""}</h2>
      <p style="line-height: 1.6;">${digestSummaryText(d)}</p>
      ${d.longestOpen.length > 0 ? `<p style="margin: 16px 0 6px; font-weight: 600;">Longest-open issues</p><ul>${rows}</ul>` : ""}
    </div>
  `;
}
