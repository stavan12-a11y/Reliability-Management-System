import { getActiveIssues } from "@/lib/data/issues";
import { getCurrentUser } from "@/lib/session";
import { IssuesContent } from "./issues-content";

export default async function IssuesPage({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const { tab } = await searchParams;
  const [issues, user] = await Promise.all([getActiveIssues(), getCurrentUser()]);

  return <IssuesContent issues={issues} initialTab={tab || "all"} role={user?.role ?? "viewer"} />;
}
