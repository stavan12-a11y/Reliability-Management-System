import "dotenv/config";
import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { embedAndStoreIssueHistory, embedAndStoreMaintenanceLog, embeddingSourceText } from "../src/lib/rag/embed";
import { isRagConfigured } from "../src/lib/rag/client";

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL });
const prisma = new PrismaClient({ adapter });

// `embedding` is Unsupported("vector(1536)") in schema.prisma, so it's
// invisible to Prisma's normal query builder (no select/where on it) —
// raw SQL is required to find rows still missing one.

async function main() {
  if (!isRagConfigured()) {
    console.error("OPENAI_API_KEY is not set. Add it to web/.env before running the backfill.");
    process.exit(1);
  }

  const history = await prisma.$queryRawUnsafe<
    { id: string; description: string; rootCause: string; failureMode: string | null; component: string | null }[]
  >(`SELECT id, description, "rootCause", "failureMode"::text as "failureMode", "component"::text as "component" FROM "IssueHistory" WHERE embedding IS NULL`);
  console.log(`Embedding ${history.length} issue_history record(s)...`);
  for (const h of history) {
    const text = embeddingSourceText(h);
    await embedAndStoreIssueHistory(h.id, text);
    console.log(`  ✓ ${h.id}`);
  }

  const maintenance = await prisma.$queryRawUnsafe<{ id: string; description: string; failureMode: string | null; component: string | null }[]>(
    `SELECT id, description, "failureMode"::text as "failureMode", "component"::text as "component" FROM "MaintenanceLog" WHERE embedding IS NULL`,
  );
  console.log(`Embedding ${maintenance.length} maintenance_log record(s)...`);
  for (const m of maintenance) {
    const text = embeddingSourceText(m);
    await embedAndStoreMaintenanceLog(m.id, text);
    console.log(`  ✓ ${m.id}`);
  }

  console.log("Done.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
