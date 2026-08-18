import "dotenv/config";
import { readFileSync } from "node:fs";
import { parse } from "csv-parse/sync";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { SYSTEM_ICON_KEYS } from "../src/lib/system-icon-keys";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

function slugify(s: string) {
  return s
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

type Row = Record<string, string>;

const REQUIRED_COLUMNS = [
  "location_name",
  "system_name",
  "asset_id",
  "asset_number",
  "class",
  "manufacturer",
  "model",
  "serial",
  "crit_likelihood",
  "crit_consequence",
] as const;

function parseNameplate(row: Row): Record<string, string> {
  const nameplate: Record<string, string> = {};
  for (const [key, value] of Object.entries(row)) {
    if (key.startsWith("nameplate:") && value?.trim()) {
      nameplate[key.slice("nameplate:".length)] = value.trim();
    }
  }
  return nameplate;
}

async function main() {
  const filePath = process.argv[2];
  if (!filePath) {
    console.error("Usage: npx tsx prisma/import-equipment.ts <path-to-csv>");
    console.error("See prisma/equipment-import-template.csv for the expected columns.");
    process.exit(1);
  }

  const csv = readFileSync(filePath, "utf-8");
  const rows: Row[] = parse(csv, { columns: true, skip_empty_lines: true, trim: true });

  if (rows.length === 0) {
    console.error("No rows found in CSV.");
    process.exit(1);
  }

  const missing = REQUIRED_COLUMNS.filter((c) => !(c in rows[0]));
  if (missing.length > 0) {
    console.error(`Missing required column(s): ${missing.join(", ")}`);
    process.exit(1);
  }

  // Match locations/systems by name (case-insensitive) first, so re-importing
  // against existing data (e.g. the seeded "central" / "Central Utility
  // Plant") reuses the existing row instead of creating a same-name
  // duplicate under a freshly slugified id.
  const existingLocations = await prisma.location.findMany();
  const locationIdByName = new Map(existingLocations.map((l) => [l.name.toLowerCase(), l.id]));
  const existingSystems = await prisma.system.findMany();
  const systemIdByKey = new Map(existingSystems.map((s) => [`${s.locationId}::${s.name.toLowerCase()}`, s.id]));

  let locationsCreated = 0;
  let systemsCreated = 0;
  let equipmentUpserted = 0;

  for (const [i, row] of rows.entries()) {
    const line = i + 2; // +1 for header, +1 for 1-indexing
    try {
      let locationId = locationIdByName.get(row.location_name.toLowerCase());
      if (!locationId) {
        locationId = slugify(row.location_name);
        await prisma.location.upsert({
          where: { id: locationId },
          update: { name: row.location_name },
          create: { id: locationId, name: row.location_name },
        });
        locationIdByName.set(row.location_name.toLowerCase(), locationId);
        locationsCreated++;
      }

      const systemKey = `${locationId}::${row.system_name.toLowerCase()}`;
      let systemId = systemIdByKey.get(systemKey);
      if (!systemId) {
        systemId = `${locationId}-${slugify(row.system_name)}`;
        const iconRaw = row.system_icon?.trim().toLowerCase();
        const icon = iconRaw && (SYSTEM_ICON_KEYS as readonly string[]).includes(iconRaw) ? iconRaw : "gauge";
        await prisma.system.upsert({
          where: { id: systemId },
          update: { name: row.system_name, locationId, icon },
          create: { id: systemId, name: row.system_name, locationId, icon },
        });
        systemIdByKey.set(systemKey, systemId);
        systemsCreated++;
      }

      const critLikelihood = Number(row.crit_likelihood);
      const critConsequence = Number(row.crit_consequence);
      if (!Number.isInteger(critLikelihood) || !Number.isInteger(critConsequence)) {
        throw new Error("crit_likelihood and crit_consequence must be integers 1-5");
      }

      const status = row.status?.trim() || "available";
      if (!["available", "limited", "unavailable"].includes(status)) {
        throw new Error(`status must be available/limited/unavailable, got "${status}"`);
      }

      await prisma.equipment.upsert({
        where: { id: row.asset_id },
        update: {
          assetNumber: row.asset_number,
          systemId,
          locationId,
          class: row.class,
          manufacturer: row.manufacturer,
          model: row.model,
          serial: row.serial,
          critLikelihood,
          critConsequence,
          critScore: critLikelihood * critConsequence,
          nameplate: parseNameplate(row),
          status: status as "available" | "limited" | "unavailable",
          downtimeDays90d: Number(row.downtime_days_90d) || 0,
        },
        create: {
          id: row.asset_id,
          assetNumber: row.asset_number,
          systemId,
          locationId,
          class: row.class,
          manufacturer: row.manufacturer,
          model: row.model,
          serial: row.serial,
          critLikelihood,
          critConsequence,
          critScore: critLikelihood * critConsequence,
          nameplate: parseNameplate(row),
          status: status as "available" | "limited" | "unavailable",
          downtimeDays90d: Number(row.downtime_days_90d) || 0,
        },
      });
      equipmentUpserted++;
    } catch (err) {
      console.error(`Row ${line} (asset_id="${row.asset_id}"): ${err instanceof Error ? err.message : err}`);
      process.exit(1);
    }
  }

  console.log(`Done. ${equipmentUpserted} equipment row(s) imported (${locationsCreated} location(s), ${systemsCreated} system(s) touched).`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
