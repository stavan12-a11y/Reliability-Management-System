import { getEquipmentList } from "@/lib/data/equipment";
import { getLocations, getAllSystems } from "@/lib/data/locations";
import { getActiveIssues } from "@/lib/data/issues";
import { getIssueHistory } from "@/lib/data/history";
import { getCurrentUser } from "@/lib/session";
import { EquipmentContent } from "./equipment-content";

export default async function EquipmentPage() {
  const [equipment, locations, systems, activeIssues, history, user] = await Promise.all([
    getEquipmentList(),
    getLocations(),
    getAllSystems(),
    getActiveIssues(),
    getIssueHistory(),
    getCurrentUser(),
  ]);
  return (
    <EquipmentContent equipment={equipment} locations={locations} systems={systems} activeIssues={activeIssues} history={history} canManage={user?.role === "manager"} />
  );
}
