import { getCurrentUser } from "@/lib/session";
import { getEquipmentPickerList } from "@/lib/data/equipment";
import { isRagConfigured } from "@/lib/rag/client";
import { Header } from "@/components/header";
import { PageNav } from "@/components/page-nav";
import { AiHistoryWidget } from "@/components/ai-history-widget";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, equipmentList] = await Promise.all([getCurrentUser(), getEquipmentPickerList()]);

  const canLogIssue = !!user && (user.role === "technician" || user.role === "manager");

  return (
    <div className="min-h-screen">
      <Header userName={user?.name ?? ""} />
      <main className="mx-auto max-w-[1280px] px-4 py-6 sm:px-6">
        <PageNav canLogIssue={canLogIssue} equipmentList={equipmentList} />
        {children}
      </main>
      {isRagConfigured() && <AiHistoryWidget />}
    </div>
  );
}
