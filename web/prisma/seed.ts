import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("Seeding users...");
  const passwordHash = await bcrypt.hash("password123", 10);

  const [viewer, tech, manager] = await Promise.all([
    prisma.user.upsert({
      where: { email: "viewer@ues.edu" },
      update: {},
      create: { name: "Alex Rivera", email: "viewer@ues.edu", passwordHash, role: "viewer" },
    }),
    prisma.user.upsert({
      where: { email: "tech@ues.edu" },
      update: {},
      create: { name: "J. Alvarez", email: "tech@ues.edu", passwordHash, role: "technician" },
    }),
    prisma.user.upsert({
      where: { email: "manager@ues.edu" },
      update: {},
      create: { name: "S. Patel", email: "manager@ues.edu", passwordHash, role: "manager" },
    }),
  ]);

  console.log("Seeding locations...");
  const LOCATIONS = [
    { id: "central", name: "Central Utility Plant" },
    { id: "west", name: "West Campus Plant" },
    { id: "south", name: "South Plant" },
  ];
  for (const l of LOCATIONS) {
    await prisma.location.upsert({ where: { id: l.id }, update: l, create: l });
  }

  console.log("Seeding systems...");
  const SYSTEMS = [
    { id: "chw", locationId: "central", name: "Chilled Water System", icon: "snowflake" },
    { id: "steam", locationId: "central", name: "Steam System", icon: "flame" },
    { id: "hw", locationId: "west", name: "Heating Water System", icon: "droplet" },
    { id: "chw-w", locationId: "west", name: "Chilled Water System", icon: "snowflake" },
    { id: "steam-s", locationId: "south", name: "Steam System", icon: "flame" },
  ];
  for (const s of SYSTEMS) {
    await prisma.system.upsert({ where: { id: s.id }, update: s, create: s });
  }

  console.log("Seeding equipment...");
  const EQUIPMENT = [
    { id: "CHLR003", assetNumber: "AST-10032", systemId: "chw", locationId: "central", class: "Chiller", manufacturer: "Trane", model: "CVHF450", serial: "TR-2019-4471", status: "unavailable", critScore: 20, critLikelihood: 4, critConsequence: 5, nameplate: { Tonnage: "450", Refrigerant: "R-134a", "Compressor type": "Centrifugal", "Install year": "2019" }, downtimeDays: 4 },
    { id: "CHLR001", assetNumber: "AST-10030", systemId: "chw", locationId: "central", class: "Chiller", manufacturer: "Trane", model: "CVHF450", serial: "TR-2019-4469", status: "available", critScore: 20, critLikelihood: 3, critConsequence: 5, nameplate: { Tonnage: "450", Refrigerant: "R-134a", "Compressor type": "Centrifugal", "Install year": "2019" }, downtimeDays: 0 },
    { id: "CHLR002", assetNumber: "AST-10031", systemId: "chw", locationId: "central", class: "Chiller", manufacturer: "York", model: "YK-EP", serial: "YK-2018-2210", status: "limited", critScore: 12, critLikelihood: 3, critConsequence: 4, nameplate: { Tonnage: "400", Refrigerant: "R-134a", "Compressor type": "Centrifugal", "Install year": "2018" }, downtimeDays: 1 },
    { id: "CHWP001", assetNumber: "AST-10040", systemId: "chw", locationId: "central", class: "Pump", manufacturer: "Bell & Gossett", model: "e-1510", serial: "BG-2020-119", status: "available", critScore: 9, critLikelihood: 2, critConsequence: 4, nameplate: { Flow: "1200 gpm", Head: "85 ft", "Oil type": "ISO 32", "Install year": "2020" }, downtimeDays: 0 },
    { id: "BLR011", assetNumber: "AST-10050", systemId: "steam", locationId: "central", class: "Boiler", manufacturer: "Cleaver-Brooks", model: "CB-700", serial: "CB-2017-881", status: "limited", critScore: 22, critLikelihood: 4, critConsequence: 5, nameplate: { Capacity: "700 HP", Fuel: "Natural gas", MAWP: "150 psi", "Install year": "2017" }, downtimeDays: 2 },
    { id: "BLR012", assetNumber: "AST-10051", systemId: "steam", locationId: "central", class: "Boiler", manufacturer: "Cleaver-Brooks", model: "CB-700", serial: "CB-2017-882", status: "available", critScore: 20, critLikelihood: 3, critConsequence: 5, nameplate: { Capacity: "700 HP", Fuel: "Natural gas", MAWP: "150 psi", "Install year": "2017" }, downtimeDays: 1 },
    { id: "BFWP001", assetNumber: "AST-10060", systemId: "steam", locationId: "central", class: "Pump", manufacturer: "Goulds", model: "3196", serial: "GD-2019-556", status: "available", critScore: 8, critLikelihood: 2, critConsequence: 4, nameplate: { Flow: "300 gpm", Head: "450 ft", "Oil type": "ISO 68", "Install year": "2019" }, downtimeDays: 0 },
    { id: "HTC001", assetNumber: "AST-10070", systemId: "hw", locationId: "west", class: "Heat converter", manufacturer: "Patterson-Kelley", model: "MPS-15", serial: "PK-2016-330", status: "unavailable", critScore: 14, critLikelihood: 3, critConsequence: 4, nameplate: { Duty: "15 MMBtu/hr", "Surface area": "600 ft²", "Design pressure": "150 psi", "Install year": "2016" }, downtimeDays: 2 },
    { id: "HWP001", assetNumber: "AST-10071", systemId: "hw", locationId: "west", class: "Pump", manufacturer: "Bell & Gossett", model: "e-1510", serial: "BG-2019-887", status: "unavailable", critScore: 12, critLikelihood: 3, critConsequence: 4, nameplate: { Flow: "900 gpm", Head: "70 ft", "Oil type": "ISO 32", "Install year": "2019" }, downtimeDays: 2 },
    { id: "CHLR010", assetNumber: "AST-10080", systemId: "chw-w", locationId: "west", class: "Chiller", manufacturer: "Carrier", model: "19XR", serial: "CR-2021-004", status: "available", critScore: 20, critLikelihood: 3, critConsequence: 5, nameplate: { Tonnage: "500", Refrigerant: "R-134a", "Compressor type": "Centrifugal", "Install year": "2021" }, downtimeDays: 0 },
    { id: "BLR021", assetNumber: "AST-10090", systemId: "steam-s", locationId: "south", class: "Boiler", manufacturer: "Cleaver-Brooks", model: "CB-500", serial: "CB-2015-220", status: "limited", critScore: 15, critLikelihood: 3, critConsequence: 5, nameplate: { Capacity: "500 HP", Fuel: "Natural gas", MAWP: "125 psi", "Install year": "2015" }, downtimeDays: 1 },
  ] as const;

  for (const e of EQUIPMENT) {
    const { downtimeDays, ...rest } = e;
    await prisma.equipment.upsert({
      where: { id: e.id },
      update: { ...rest, downtimeDays90d: downtimeDays },
      create: { ...rest, downtimeDays90d: downtimeDays },
    });
  }

  console.log("Seeding maintenance log...");
  const MAINTENANCE_LOG = [
    { id: "M-311", assetId: "CHLR003", date: "2025-03-14", type: "overhaul", description: "Full compressor overhaul, replaced bearings and seals", wo: "WO-114800" },
    { id: "M-298", assetId: "CHLR003", date: "2024-08-02", type: "component_replacement", description: "Replaced oil filter and charged refrigerant", wo: "WO-112100" },
    { id: "M-340", assetId: "HWP001", date: "2024-10-11", type: "component_replacement", description: "Motor replaced, original motor bearing failure", wo: "WO-113500" },
    { id: "M-355", assetId: "BLR011", date: "2025-08-20", type: "overhaul", description: "Annual overhaul, refractory inspection, burner tune", wo: "WO-117200" },
    { id: "M-356", assetId: "BLR011", date: "2025-08-20", type: "test", description: "Hydrostatic test performed, passed", wo: "WO-117200" },
    { id: "M-330", assetId: "BLR012", date: "2025-08-18", type: "overhaul", description: "Annual overhaul, refractory inspection, burner tune", wo: "WO-117180" },
    { id: "M-290", assetId: "CHLR002", date: "2024-06-05", type: "component_replacement", description: "Condenser tube cleaning and inspection", wo: "WO-111900" },
  ] as const;

  for (const m of MAINTENANCE_LOG) {
    await prisma.maintenanceLog.upsert({
      where: { id: m.id },
      update: { assetId: m.assetId, date: new Date(m.date), type: m.type, description: m.description, woNumber: m.wo, createdById: tech.id },
      create: { id: m.id, assetId: m.assetId, date: new Date(m.date), type: m.type, description: m.description, woNumber: m.wo, createdById: tech.id },
    });
  }

  console.log("Seeding documents...");
  const DOCUMENTS = [
    { id: "D-1", assetId: "CHLR003", name: "Trane CVHF450 O&M Manual", type: "manual", date: "2019-04-01" },
    { id: "D-2", assetId: "CHLR003", name: "Nameplate photo", type: "photo", date: "2025-03-14" },
    { id: "D-3", assetId: "BLR011", name: "PSV test certificate — Aug 2025", type: "certificate", date: "2025-08-20" },
    { id: "D-4", assetId: "BLR011", name: "Boiler inspection report", type: "report", date: "2025-08-20" },
  ] as const;

  for (const d of DOCUMENTS) {
    const fileUrl = `https://files.example.com/ues/${d.id}`;
    await prisma.document.upsert({
      where: { id: d.id },
      update: { assetId: d.assetId, name: d.name, type: d.type, fileUrl, uploadedAt: new Date(d.date), uploadedById: tech.id },
      create: { id: d.id, assetId: d.assetId, name: d.name, type: d.type, fileUrl, uploadedAt: new Date(d.date), uploadedById: tech.id },
    });
  }

  console.log("Seeding active issues...");
  const ISSUES = [
    { id: "I-1042", assetId: "CHLR003", condition: "unavailable", description: "Low oil pressure on compressor bearing", identified: "2026-08-12", nextStep: "Await replacement bearing from vendor", responsible: "J. Alvarez", partsEta: "2026-08-15", returnEta: "2026-08-16", wo: "WO-118432", notes: ["Aug 12 — Oil pressure alarm triggered, unit taken offline", "Aug 13 — Bearing confirmed failed, part ordered", "Aug 14 — Vendor confirmed ship date"] },
    { id: "I-1039", assetId: "BLR011", condition: "limited", description: "Operating at reduced capacity, burner control fault", identified: "2026-08-10", nextStep: "Schedule controls tech for calibration", responsible: "M. Cho", partsEta: null, returnEta: "2026-08-19", wo: "WO-118401", notes: ["Aug 10 — Derated to 60% capacity as precaution"] },
    { id: "I-1044", assetId: "HWP001", condition: "unavailable", description: "Bearing noise, vibration analysis pending", identified: "2026-08-08", nextStep: "Vibration analysis appointment", responsible: "M. Cho", partsEta: null, returnEta: "2026-08-13", wo: "WO-118390", notes: ["Aug 8 — Unusual noise reported by operator", "Aug 9 — Taken offline as precaution"] },
    { id: "I-1045", assetId: "HTC001", condition: "unavailable", description: "Tube leak identified during inspection", identified: "2026-08-11", nextStep: "Await parts for tube bundle repair", responsible: "J. Alvarez", partsEta: "2026-08-18", returnEta: "2026-08-20", wo: "WO-118420", notes: ["Aug 11 — Leak found during routine inspection"] },
    { id: "I-1030", assetId: "CHLR002", condition: "limited", description: "Tube fouling, reduced heat transfer efficiency", identified: "2026-08-05", nextStep: "Schedule tube cleaning", responsible: "S. Patel", partsEta: null, returnEta: "2026-08-22", wo: "WO-118350", notes: ["Aug 5 — Efficiency drop flagged by trending"] },
    { id: "I-1050", assetId: "BLR021", condition: "limited", description: "Safety valve set-pressure drift on last test", identified: "2026-08-13", nextStep: "Awaiting parts — overdue for scheduling", responsible: "S. Patel", partsEta: "2026-08-11", returnEta: "2026-08-14", wo: "WO-118388", notes: ["Aug 13 — Failed annual PSV test, flagged"] },
  ] as const;

  for (const i of ISSUES) {
    await prisma.issue.upsert({
      where: { id: i.id },
      update: {},
      create: {
        id: i.id,
        assetId: i.assetId,
        condition: i.condition,
        description: i.description,
        identifiedAt: new Date(i.identified),
        nextStep: i.nextStep,
        responsible: i.responsible,
        partsEta: i.partsEta ? new Date(i.partsEta) : null,
        returnEta: i.returnEta ? new Date(i.returnEta) : null,
        woNumber: i.wo,
        createdById: tech.id,
        updatedById: tech.id,
        notes: { create: i.notes.map((body) => ({ body, createdById: tech.id })) },
      },
    });
  }

  console.log("Seeding issue history...");
  const HISTORY = [
    { id: "H-902", assetId: "CHLR003", description: "Refrigerant leak, low charge", resolved: "2026-05-02", identified: "2026-04-30", downtimeDays: 2, rootCause: "Seal wear", wo: "WO-115210" },
    { id: "H-887", assetId: "BLR011", description: "Low water cutoff failure", resolved: "2026-03-14", identified: "2026-03-13", downtimeDays: 1, rootCause: "Sensor fouling", wo: "WO-113980" },
    { id: "H-861", assetId: "CHLR002", description: "Compressor trip on high discharge temp", resolved: "2026-01-22", identified: "2026-01-21", downtimeDays: 1, rootCause: "Condenser fouling", wo: "WO-111500" },
    { id: "H-840", assetId: "BLR011", description: "Fuel valve actuator failure", resolved: "2025-11-30", identified: "2025-11-29", downtimeDays: 1, rootCause: "Actuator end-of-life", wo: "WO-109200" },
    { id: "H-820", assetId: "BLR011", description: "Ignition transformer failure", resolved: "2025-09-18", identified: "2025-09-17", downtimeDays: 1, rootCause: "Component failure", wo: "WO-107100" },
  ] as const;

  for (const h of HISTORY) {
    await prisma.issueHistory.upsert({
      where: { id: h.id },
      update: {},
      create: {
        id: h.id,
        assetId: h.assetId,
        description: h.description,
        rootCause: h.rootCause,
        resolvedAt: new Date(h.resolved),
        identifiedAt: new Date(h.identified),
        downtimeDays: h.downtimeDays,
        woNumber: h.wo,
        resolvedById: manager.id,
      },
    });
  }

  console.log("Seeding digest subscribers...");
  await prisma.digestSubscriber.upsert({
    where: { userId: manager.id },
    update: {},
    create: { userId: manager.id, frequency: "weekly" },
  });

  console.log(`Done. Demo logins (password: "password123"): ${viewer.email} (viewer), ${tech.email} (technician), ${manager.email} (manager)`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
