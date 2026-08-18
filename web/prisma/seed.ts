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
    { id: "M-311", assetId: "CHLR003", date: "2025-03-14", type: "overhaul", description: "Full compressor overhaul, replaced bearings and seals", wo: "WO-114800", failureMode: "bearing_failure", component: "compressor" },
    { id: "M-298", assetId: "CHLR003", date: "2024-08-02", type: "component_replacement", description: "Replaced oil filter and charged refrigerant", wo: "WO-112100", failureMode: null, component: null },
    { id: "M-340", assetId: "HWP001", date: "2024-10-11", type: "component_replacement", description: "Motor replaced, original motor bearing failure", wo: "WO-113500", failureMode: "bearing_failure", component: "motor" },
    { id: "M-355", assetId: "BLR011", date: "2025-08-20", type: "overhaul", description: "Annual overhaul, refractory inspection, burner tune", wo: "WO-117200", failureMode: null, component: null },
    { id: "M-356", assetId: "BLR011", date: "2025-08-20", type: "test", description: "Hydrostatic test performed, passed", wo: "WO-117200", failureMode: null, component: null },
    { id: "M-330", assetId: "BLR012", date: "2025-08-18", type: "overhaul", description: "Annual overhaul, refractory inspection, burner tune", wo: "WO-117180", failureMode: null, component: null },
    { id: "M-290", assetId: "CHLR002", date: "2024-06-05", type: "component_replacement", description: "Condenser tube cleaning and inspection", wo: "WO-111900", failureMode: "fouling", component: "condenser" },
  ] as const;

  for (const m of MAINTENANCE_LOG) {
    await prisma.maintenanceLog.upsert({
      where: { id: m.id },
      update: { assetId: m.assetId, date: new Date(m.date), type: m.type, description: m.description, woNumber: m.wo, failureMode: m.failureMode, component: m.component, createdById: tech.id },
      create: { id: m.id, assetId: m.assetId, date: new Date(m.date), type: m.type, description: m.description, woNumber: m.wo, failureMode: m.failureMode, component: m.component, createdById: tech.id },
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
  // 17 records across chiller/boiler/pump/heat-converter assets. CHLR003
  // carries two bearing_failure records ~16 months apart (H-950, H-951) on
  // top of its unrelated H-902 refrigerant leak, specifically so the RAG
  // retrieval has a real repeating-pattern to surface — not just a single
  // coincidental match. See Phase 2 build instructions.
  const HISTORY = [
    { id: "H-902", assetId: "CHLR003", description: "Refrigerant leak, low charge", resolved: "2026-05-02", identified: "2026-04-30", downtimeDays: 2, rootCause: "Seal wear at the compressor shaft seal let refrigerant charge slowly leak out over several weeks.", wo: "WO-115210", failureMode: "refrigerant_leak", component: "refrigerant_circuit" },
    { id: "H-950", assetId: "CHLR003", description: "Compressor bearing failure, excessive vibration on startup", resolved: "2025-02-10", identified: "2025-02-05", downtimeDays: 5, rootCause: "Bearing wear traced to inadequate lubrication interval — grease schedule was extended during a staffing gap.", wo: "WO-116200", failureMode: "bearing_failure", component: "bearing" },
    { id: "H-951", assetId: "CHLR003", description: "Compressor bearing replaced again after recurring vibration alarm", resolved: "2026-06-15", identified: "2026-06-10", downtimeDays: 5, rootCause: "Same root cause as the Feb 2025 failure — lubrication interval had drifted long again despite the prior corrective action.", wo: "WO-119600", failureMode: "bearing_failure", component: "bearing" },
    { id: "H-887", assetId: "BLR011", description: "Low water cutoff failure", resolved: "2026-03-14", identified: "2026-03-13", downtimeDays: 1, rootCause: "Sensor fouling from scale buildup caused a false low-water trip.", wo: "WO-113980", failureMode: "sensor_failure", component: "control_panel" },
    { id: "H-840", assetId: "BLR011", description: "Fuel valve actuator failure", resolved: "2025-11-30", identified: "2025-11-29", downtimeDays: 1, rootCause: "Actuator reached end-of-life; motor windings had degraded from age.", wo: "WO-109200", failureMode: "electrical_fault", component: "burner" },
    { id: "H-820", assetId: "BLR011", description: "Ignition transformer failure", resolved: "2025-09-18", identified: "2025-09-17", downtimeDays: 1, rootCause: "Ignition transformer winding shorted internally, no external cause found.", wo: "WO-107100", failureMode: "electrical_fault", component: "burner" },
    { id: "H-861", assetId: "CHLR002", description: "Compressor trip on high discharge temp", resolved: "2026-01-22", identified: "2026-01-21", downtimeDays: 1, rootCause: "Condenser tube fouling from mineral scale reduced heat rejection, driving discharge temp over the trip setpoint.", wo: "WO-111500", failureMode: "fouling", component: "condenser" },
    { id: "H-995", assetId: "CHLR002", description: "Control panel lockout, no display on HMI", resolved: "2025-06-22", identified: "2025-06-18", downtimeDays: 4, rootCause: "Control panel power supply board failed; replaced under warranty.", wo: "WO-116400", failureMode: "electrical_fault", component: "control_panel" },
    { id: "H-960", assetId: "CHLR001", description: "Condenser tube fouling reducing chiller efficiency", resolved: "2025-07-20", identified: "2025-07-15", downtimeDays: 5, rootCause: "Mineral scale buildup in condenser tubes from cooling tower water chemistry drift.", wo: "WO-116800", failureMode: "fouling", component: "condenser" },
    { id: "H-961", assetId: "CHLR010", description: "Evaporator freeze-up, low refrigerant flow", resolved: "2025-10-05", identified: "2025-10-01", downtimeDays: 4, rootCause: "Thermal expansion valve stuck partially closed, starving the evaporator of refrigerant flow.", wo: "WO-117500", failureMode: "control_instrumentation_fault", component: "evaporator" },
    { id: "H-970", assetId: "HWP001", description: "Motor bearing failure, motor replaced", resolved: "2024-10-11", identified: "2024-10-06", downtimeDays: 5, rootCause: "Motor bearing seized from lubrication breakdown after years in a high-humidity mechanical room.", wo: "WO-113600", failureMode: "bearing_failure", component: "motor" },
    { id: "H-971", assetId: "HWP001", description: "Mechanical seal leak at pump", resolved: "2026-04-06", identified: "2026-04-02", downtimeDays: 4, rootCause: "Mechanical seal faces wore out from years of service; unrelated to the prior motor bearing failure.", wo: "WO-119200", failureMode: "seal_gasket_leak", component: "seal" },
    { id: "H-980", assetId: "CHWP001", description: "Pump seal leak, water pooling at base", resolved: "2025-01-13", identified: "2025-01-10", downtimeDays: 3, rootCause: "Mechanical seal degraded from a brief period of dry running during a system drain-down.", wo: "WO-115800", failureMode: "seal_gasket_leak", component: "seal" },
    { id: "H-981", assetId: "BFWP001", description: "Boiler feed pump bearing failure", resolved: "2025-08-09", identified: "2025-08-05", downtimeDays: 4, rootCause: "Bearing wear accelerated by high-temperature feedwater service; standard bearing grade was undersized for the application.", wo: "WO-116900", failureMode: "bearing_failure", component: "bearing" },
    { id: "H-990", assetId: "BLR012", description: "Tube corrosion found during internal inspection", resolved: "2025-03-16", identified: "2025-03-12", downtimeDays: 4, rootCause: "Localized pitting corrosion from inconsistent feedwater treatment chemistry.", wo: "WO-115900", failureMode: "corrosion", component: "tube_bundle" },
    { id: "H-991", assetId: "BLR021", description: "Safety valve failed to reseat properly during annual test", resolved: "2024-12-11", identified: "2024-12-08", downtimeDays: 3, rootCause: "Valve seat had minor scoring from age; reseated after lapping, monitored closely since.", wo: "WO-115100", failureMode: "control_instrumentation_fault", component: "safety_valve" },
    { id: "H-996", assetId: "HTC001", description: "Tube bundle leak found during inspection", resolved: "2025-02-25", identified: "2025-02-20", downtimeDays: 5, rootCause: "Pinhole corrosion on a single tube from years of dissolved-oxygen exposure in the heating water loop.", wo: "WO-115950", failureMode: "corrosion", component: "tube_bundle" },
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
        failureMode: h.failureMode,
        component: h.component,
        resolvedById: manager.id,
      },
    });
  }

  console.log("Seeding expanded fleet (generated)...");
  // Deterministic PRNG (mulberry32) — a fixed seed means re-running
  // `prisma db seed` regenerates the exact same expanded fleet every time
  // instead of growing/reshuffling it on each run. Equipment/history/
  // maintenance IDs below are all sequential, not random, for the same
  // reason: upsert-by-id has to hit the same rows again, not pile up new
  // ones.
  function mulberry32(a: number) {
    return function () {
      a |= 0;
      a = (a + 0x6d2b79f5) | 0;
      let t = Math.imul(a ^ (a >>> 15), 1 | a);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  const rand = mulberry32(20260818);
  function pick<T>(arr: readonly T[]): T {
    return arr[Math.floor(rand() * arr.length)];
  }
  function randInt(min: number, max: number) {
    return Math.floor(rand() * (max - min + 1)) + min;
  }
  function addDays(iso: string, days: number) {
    const d = new Date(iso);
    d.setDate(d.getDate() + days);
    return d.toISOString().slice(0, 10);
  }

  const CHILLER_MODELS = [
    { mfr: "Trane", model: "CVHF450", Tonnage: "450", Refrigerant: "R-134a", "Compressor type": "Centrifugal" },
    { mfr: "Trane", model: "CVHF600", Tonnage: "600", Refrigerant: "R-134a", "Compressor type": "Centrifugal" },
    { mfr: "York", model: "YK-EP", Tonnage: "400", Refrigerant: "R-134a", "Compressor type": "Centrifugal" },
    { mfr: "York", model: "YVAA", Tonnage: "350", Refrigerant: "R-134a", "Compressor type": "Screw" },
    { mfr: "Carrier", model: "19XR", Tonnage: "500", Refrigerant: "R-134a", "Compressor type": "Centrifugal" },
    { mfr: "Carrier", model: "23XRV", Tonnage: "550", Refrigerant: "R-134a", "Compressor type": "Centrifugal" },
  ] as const;
  const CHILLER_FAILURES = [
    { mode: "bearing_failure", component: "compressor", desc: "Compressor bearing failure, excessive vibration on startup", rootCause: "Bearing wear traced to an extended lubrication interval." },
    { mode: "refrigerant_leak", component: "refrigerant_circuit", desc: "Refrigerant leak, low charge", rootCause: "Seal wear at the compressor shaft seal allowed a slow refrigerant leak." },
    { mode: "fouling", component: "condenser", desc: "Condenser tube fouling reducing heat transfer efficiency", rootCause: "Mineral scale buildup from cooling tower water chemistry drift." },
    { mode: "electrical_fault", component: "control_panel", desc: "Control panel lockout, no display on HMI", rootCause: "Control panel power supply board failed." },
    { mode: "control_instrumentation_fault", component: "evaporator", desc: "Evaporator freeze-up, low refrigerant flow", rootCause: "Thermal expansion valve stuck partially closed, starving evaporator flow." },
    { mode: "corrosion", component: "condenser", desc: "Condenser tube corrosion found during inspection", rootCause: "Pitting corrosion from inconsistent water treatment chemistry." },
  ] as const;

  const BOILER_MODELS = [
    { mfr: "Cleaver-Brooks", model: "CB-700", Capacity: "700 HP", Fuel: "Natural gas", MAWP: "150 psi" },
    { mfr: "Cleaver-Brooks", model: "CB-500", Capacity: "500 HP", Fuel: "Natural gas", MAWP: "125 psi" },
    { mfr: "Fulton", model: "FB-D-600", Capacity: "600 HP", Fuel: "Natural gas", MAWP: "150 psi" },
    { mfr: "Johnston", model: "100-W", Capacity: "800 HP", Fuel: "Natural gas", MAWP: "150 psi" },
  ] as const;
  const BOILER_FAILURES = [
    { mode: "electrical_fault", component: "burner", desc: "Ignition transformer failure", rootCause: "Ignition transformer winding shorted internally, no external cause found." },
    { mode: "electrical_fault", component: "burner", desc: "Fuel valve actuator failure", rootCause: "Actuator reached end-of-life; motor windings had degraded from age." },
    { mode: "sensor_failure", component: "control_panel", desc: "Low water cutoff failure", rootCause: "Sensor fouling from scale buildup caused a false low-water trip." },
    { mode: "corrosion", component: "tube_bundle", desc: "Tube corrosion found during internal inspection", rootCause: "Localized pitting corrosion from inconsistent feedwater treatment chemistry." },
    { mode: "control_instrumentation_fault", component: "safety_valve", desc: "Safety valve failed to reseat properly during annual test", rootCause: "Valve seat had minor scoring from age; reseated after lapping." },
  ] as const;

  const PUMP_MODELS = [
    { mfr: "Bell & Gossett", model: "e-1510", Flow: "1000 gpm", Head: "80 ft", "Oil type": "ISO 32" },
    { mfr: "Goulds", model: "3196", Flow: "350 gpm", Head: "400 ft", "Oil type": "ISO 68" },
    { mfr: "Grundfos", model: "TP", Flow: "600 gpm", Head: "60 ft", "Oil type": "ISO 32" },
    { mfr: "Armstrong", model: "4300", Flow: "800 gpm", Head: "75 ft", "Oil type": "ISO 32" },
  ] as const;
  const PUMP_FAILURES = [
    { mode: "bearing_failure", component: "motor", desc: "Motor bearing failure, motor replaced", rootCause: "Motor bearing seized from lubrication breakdown." },
    { mode: "seal_gasket_leak", component: "seal", desc: "Mechanical seal leak at pump", rootCause: "Mechanical seal faces wore out from years of service." },
    { mode: "bearing_failure", component: "bearing", desc: "Pump bearing failure, excessive noise", rootCause: "Bearing wear accelerated by high-temperature service; standard grade was undersized." },
    { mode: "overload", component: "impeller", desc: "Motor trip on overload", rootCause: "Impeller partially clogged with debris, increasing load on the motor." },
  ] as const;

  const HTC_MODELS = [
    { mfr: "Patterson-Kelley", model: "MPS-15", Duty: "15 MMBtu/hr", "Surface area": "600 ft²", "Design pressure": "150 psi" },
    { mfr: "Aerco", model: "InnovationHX", Duty: "12 MMBtu/hr", "Surface area": "520 ft²", "Design pressure": "150 psi" },
  ] as const;
  const HTC_FAILURES = [
    { mode: "corrosion", component: "tube_bundle", desc: "Tube bundle leak found during inspection", rootCause: "Pinhole corrosion from years of dissolved-oxygen exposure in the loop." },
    { mode: "sensor_failure", component: "sensor", desc: "Outlet temperature sensor drift", rootCause: "Sensor calibration drifted out of tolerance with age." },
  ] as const;

  type ClassGroup = { prefix: string; cls: string; models: readonly { mfr: string; model: string }[]; failures: readonly { mode: string; component: string; desc: string; rootCause: string }[] };
  const GROUPS: Record<string, ClassGroup> = {
    chiller: { prefix: "CHLR", cls: "Chiller", models: CHILLER_MODELS, failures: CHILLER_FAILURES },
    boiler: { prefix: "BLR", cls: "Boiler", models: BOILER_MODELS, failures: BOILER_FAILURES },
    pump: { prefix: "PMP", cls: "Pump", models: PUMP_MODELS, failures: PUMP_FAILURES },
    htc: { prefix: "HTC", cls: "Heat converter", models: HTC_MODELS, failures: HTC_FAILURES },
  };

  // Which plant gets how many of each class — Central is the flagship
  // "full" plant, West and South are smaller satellite plants.
  const FLEET_PLAN: { group: keyof typeof GROUPS; count: number; systemId: string; locationId: string; startIndex: number }[] = [
    { group: "chiller", count: 9, systemId: "chw", locationId: "central", startIndex: 100 },
    { group: "pump", count: 9, systemId: "chw", locationId: "central", startIndex: 100 },
    { group: "boiler", count: 7, systemId: "steam", locationId: "central", startIndex: 100 },
    { group: "pump", count: 7, systemId: "steam", locationId: "central", startIndex: 200 },
    { group: "chiller", count: 4, systemId: "chw-w", locationId: "west", startIndex: 200 },
    { group: "pump", count: 4, systemId: "hw", locationId: "west", startIndex: 300 },
    { group: "htc", count: 2, systemId: "hw", locationId: "west", startIndex: 100 },
    { group: "boiler", count: 3, systemId: "steam-s", locationId: "south", startIndex: 200 },
    { group: "pump", count: 3, systemId: "steam-s", locationId: "south", startIndex: 400 },
  ];

  let assetNumberSeq = 20100;
  function nextAssetNumber() {
    assetNumberSeq++;
    return `AST-${assetNumberSeq}`;
  }
  function genStatus(): "available" | "limited" | "unavailable" {
    const r = rand();
    if (r < 0.72) return "available";
    if (r < 0.9) return "limited";
    return "unavailable";
  }
  function genCriticality() {
    const r = rand();
    if (r < 0.2) return { likelihood: 4, consequence: 5, score: 20 };
    if (r < 0.5) return { likelihood: 3, consequence: 4, score: 12 };
    if (r < 0.8) return { likelihood: 2, consequence: 3, score: 6 };
    return { likelihood: 1, consequence: 3, score: 3 };
  }

  type GenAsset = { id: string; installYear: number; group: keyof typeof GROUPS };
  const genAssets: GenAsset[] = [];

  for (const plan of FLEET_PLAN) {
    const g = GROUPS[plan.group];
    for (let i = 0; i < plan.count; i++) {
      const idx = plan.startIndex + i;
      const id = `${g.prefix}${idx}`;
      const m = pick(g.models);
      const installYear = randInt(2012, 2023);
      const crit = genCriticality();
      const status = genStatus();
      const { mfr, model, ...nameplateExtra } = m as { mfr: string; model: string; [k: string]: string };
      genAssets.push({ id, installYear, group: plan.group });
      await prisma.equipment.upsert({
        where: { id },
        update: {},
        create: {
          id,
          assetNumber: nextAssetNumber(),
          systemId: plan.systemId,
          locationId: plan.locationId,
          class: g.cls,
          manufacturer: mfr,
          model,
          serial: `${mfr.slice(0, 2).toUpperCase()}-${installYear}-${randInt(100, 999)}`,
          status,
          critScore: crit.score,
          critLikelihood: crit.likelihood,
          critConsequence: crit.consequence,
          nameplate: { ...nameplateExtra, "Install year": String(installYear) },
          downtimeDays90d: status === "unavailable" ? randInt(2, 5) : status === "limited" ? randInt(1, 3) : 0,
        },
      });
    }
  }

  console.log(`Seeding ${genAssets.length} generated assets' history...`);
  let woSeq = 130000;
  let histSeq = 0;
  let maintSeq = 0;
  for (const asset of genAssets) {
    const g = GROUPS[asset.group];
    // Older equipment has accumulated more history — 1 incident roughly
    // every 2-3 years of service, capped so this stays plausible.
    const yearsInService = 2026 - asset.installYear;
    const incidentCount = Math.min(6, Math.max(1, Math.round(yearsInService / randInt(2, 3))));

    for (let n = 0; n < incidentCount; n++) {
      const f = pick(g.failures);
      const year = randInt(asset.installYear + 1, 2026);
      const month = randInt(1, year === 2026 ? 7 : 12);
      const day = randInt(1, 27);
      const identified = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const downtimeDays = randInt(1, 5);
      const resolved = addDays(identified, downtimeDays);
      histSeq++;
      woSeq += 10;
      await prisma.issueHistory.upsert({
        where: { id: `HG-${asset.id}-${n}` },
        update: {},
        create: {
          id: `HG-${asset.id}-${n}`,
          assetId: asset.id,
          description: f.desc,
          rootCause: f.rootCause,
          resolvedAt: new Date(resolved),
          identifiedAt: new Date(identified),
          downtimeDays,
          woNumber: `WO-${woSeq}`,
          failureMode: f.mode as never,
          component: f.component as never,
          resolvedById: manager.id,
        },
      });
    }

    // Roughly one overhaul/inspection record per asset, not tied to a
    // failure — routine maintenance rather than a breakdown.
    if (rand() < 0.6) {
      maintSeq++;
      const year = randInt(asset.installYear + 1, 2026);
      const date = `${year}-${String(randInt(1, 12)).padStart(2, "0")}-${String(randInt(1, 27)).padStart(2, "0")}`;
      await prisma.maintenanceLog.upsert({
        where: { id: `MG-${asset.id}` },
        update: {},
        create: {
          id: `MG-${asset.id}`,
          assetId: asset.id,
          date: new Date(date),
          type: "inspection",
          description: "Annual inspection and preventive maintenance, no deficiencies found",
          woNumber: `WO-${140000 + maintSeq * 10}`,
          createdById: tech.id,
        },
      });
    }
  }
  console.log(`Generated ${histSeq} issue-history records and ${maintSeq} maintenance records.`);

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
