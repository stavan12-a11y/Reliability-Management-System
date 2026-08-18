import { getIssueHistory } from "@/lib/data/history";
import { HistoryContent } from "./history-content";

export default async function IssueHistoryPage() {
  const history = await getIssueHistory();
  return <HistoryContent history={history} />;
}
