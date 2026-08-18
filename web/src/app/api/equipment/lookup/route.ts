import { NextRequest, NextResponse } from "next/server";
import { findEquipmentByIdOrAssetNumber } from "@/lib/data/equipment";
import { auth } from "@/auth";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) return NextResponse.json({ match: null });

  const match = await findEquipmentByIdOrAssetNumber(q);
  return NextResponse.json({ match: match?.id ?? null });
}
