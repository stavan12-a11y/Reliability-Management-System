import { revalidatePath } from "next/cache";

/** Every page that reads equipment/issue/history data, revalidated after a mutation. */
export function revalidateDashboard(assetId?: string) {
  revalidatePath("/overview");
  revalidatePath("/locations");
  revalidatePath("/equipment");
  revalidatePath("/issues");
  revalidatePath("/history");
  revalidatePath("/reports");
  if (assetId) revalidatePath(`/equipment/${assetId}`);
}
