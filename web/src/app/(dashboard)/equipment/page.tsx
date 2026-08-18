import { getEquipmentList } from "@/lib/data/equipment";
import { EquipmentContent } from "./equipment-content";

export default async function EquipmentPage() {
  const equipment = await getEquipmentList();
  return <EquipmentContent equipment={equipment} />;
}
