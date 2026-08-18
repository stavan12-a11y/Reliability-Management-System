import { notFound } from "next/navigation";
import { getEquipmentById } from "@/lib/data/equipment";
import { getActiveIssueByAssetId } from "@/lib/data/issues";
import { getIssueHistoryByAsset } from "@/lib/data/history";
import { getMaintenanceLogByAsset, getDocumentsByAsset } from "@/lib/data/maintenance";
import { getCurrentUser } from "@/lib/session";
import { EquipmentProfileContent } from "./equipment-profile-content";

export default async function EquipmentProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const asset = await getEquipmentById(id);
  if (!asset) notFound();

  const [activeIssue, pastIssues, maintenance, documents, user] = await Promise.all([
    getActiveIssueByAssetId(id),
    getIssueHistoryByAsset(id),
    getMaintenanceLogByAsset(id),
    getDocumentsByAsset(id),
    getCurrentUser(),
  ]);

  return (
    <EquipmentProfileContent
      asset={asset}
      activeIssue={activeIssue}
      pastIssues={pastIssues}
      maintenance={maintenance}
      documents={documents}
      role={user?.role ?? "viewer"}
    />
  );
}
