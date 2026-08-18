import { getCurrentUser } from "@/lib/session";
import { getEquipmentPickerList } from "@/lib/data/equipment";
import { Header } from "@/components/header";
import { PageNav } from "@/components/page-nav";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, equipmentList] = await Promise.all([getCurrentUser(), getEquipmentPickerList()]);

  const canLogIssue = !!user && (user.role === "technician" || user.role === "manager");

  return (
    <div className="min-h-screen">
      <Header canLogIssue={canLogIssue} equipmentList={equipmentList} userName={user?.name ?? ""} />
      <main className="mx-auto max-w-[1600px] px-4 py-6 sm:px-6">
        <PageNav />
        {children}
      </main>
    </div>
  );
}
