import { getEquipmentList } from "@/lib/data/equipment";
import { getLocations, getAllSystems } from "@/lib/data/locations";
import { getCurrentUser } from "@/lib/session";
import { EquipmentContent } from "./equipment-content";

export default async function EquipmentPage() {
  const [equipment, locations, systems, user] = await Promise.all([getEquipmentList(), getLocations(), getAllSystems(), getCurrentUser()]);
  return <EquipmentContent equipment={equipment} locations={locations} systems={systems} canManage={user?.role === "manager"} />;
}
