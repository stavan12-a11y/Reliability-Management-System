import { getCurrentUser } from "@/lib/session";
import { getEquipmentPickerList } from "@/lib/data/equipment";
import { Sidebar } from "@/components/sidebar";
import { Topbar } from "@/components/topbar";
import { colors } from "@/lib/theme";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [user, equipmentList] = await Promise.all([getCurrentUser(), getEquipmentPickerList()]);

  const canLogIssue = !!user && (user.role === "technician" || user.role === "manager");

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: colors.bg }}>
      <Sidebar />
      <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <Topbar canLogIssue={canLogIssue} equipmentList={equipmentList} userName={user?.name ?? ""} />
        <div style={{ flex: 1, overflowY: "auto", padding: "22px 26px" }}>{children}</div>
      </div>
    </div>
  );
}
