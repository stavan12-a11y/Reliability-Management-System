import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import { auth } from "@/auth";
import { getEquipmentList } from "@/lib/data/equipment";
import { criticalityTier } from "@/lib/theme";
import { PERIOD_DAYS } from "@/lib/data/kpis";

function sheetName(className: string) {
  // Excel sheet names: max 31 chars, no : \ / ? * [ ]
  return className.replace(/[:\\/?*[\]]/g, "").slice(0, 31);
}

export async function GET() {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const equipment = await getEquipmentList();

  const byClass = new Map<string, typeof equipment>();
  equipment.forEach((e) => {
    if (!byClass.has(e.class)) byClass.set(e.class, []);
    byClass.get(e.class)!.push(e);
  });

  const workbook = new ExcelJS.Workbook();
  workbook.creator = "UES Reliability Dashboard";
  workbook.created = new Date();

  const summary = workbook.addWorksheet("Summary");
  summary.columns = [
    { header: "Class", key: "class", width: 22 },
    { header: "Total", key: "total", width: 10 },
    { header: "Available", key: "available", width: 12 },
    { header: "Limited", key: "limited", width: 12 },
    { header: "Unavailable", key: "unavailable", width: 14 },
    { header: "Availability %", key: "availability", width: 16 },
  ];
  summary.getRow(1).font = { bold: true };

  for (const [className, items] of byClass) {
    const total = items.length;
    const available = items.filter((e) => e.status === "available").length;
    const limited = items.filter((e) => e.status === "limited").length;
    const unavailable = items.filter((e) => e.status === "unavailable").length;
    const totalDowntime = items.reduce((s, e) => s + e.downtimeDays90d, 0);
    const totalDays = total * PERIOD_DAYS;
    const availabilityPct = totalDays > 0 ? Math.round(((totalDays - totalDowntime) / totalDays) * 1000) / 10 : 100;

    summary.addRow({ class: className, total, available, limited, unavailable, availability: availabilityPct });
  }

  for (const [className, items] of byClass) {
    const sheet = workbook.addWorksheet(sheetName(className));
    sheet.columns = [
      { header: "Asset ID", key: "id", width: 14 },
      { header: "Asset Number", key: "assetNumber", width: 14 },
      { header: "Location", key: "location", width: 22 },
      { header: "System", key: "system", width: 22 },
      { header: "Manufacturer", key: "manufacturer", width: 18 },
      { header: "Model", key: "model", width: 16 },
      { header: "Serial", key: "serial", width: 16 },
      { header: "Status", key: "status", width: 14 },
      { header: "Criticality", key: "criticality", width: 12 },
      { header: "Downtime (90d, days)", key: "downtime", width: 18 },
    ];
    sheet.getRow(1).font = { bold: true };

    items.forEach((e) => {
      sheet.addRow({
        id: e.id,
        assetNumber: e.assetNumber,
        location: e.location.name,
        system: e.system.name,
        manufacturer: e.manufacturer,
        model: e.model,
        serial: e.serial,
        status: e.status,
        criticality: criticalityTier(e.critScore).label,
        downtime: e.downtimeDays90d,
      });
    });
  }

  const buffer = await workbook.xlsx.writeBuffer();
  const date = new Date().toISOString().slice(0, 10);

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="equipment-performance-${date}.xlsx"`,
    },
  });
}
