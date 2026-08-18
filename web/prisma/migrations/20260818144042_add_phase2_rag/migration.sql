-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "Component" ADD VALUE 'refrigerant_circuit';
ALTER TYPE "Component" ADD VALUE 'coupling';
ALTER TYPE "Component" ADD VALUE 'safety_valve';
ALTER TYPE "Component" ADD VALUE 'gasket';

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "FailureMode" ADD VALUE 'refrigerant_leak';
ALTER TYPE "FailureMode" ADD VALUE 'sensor_failure';

-- Enable pgvector (Neon supports this extension natively)
CREATE EXTENSION IF NOT EXISTS vector;

-- AlterTable
ALTER TABLE "IssueHistory" ADD COLUMN     "embedding" vector(1536);

-- AlterTable
ALTER TABLE "MaintenanceLog" ADD COLUMN     "component" "Component",
ADD COLUMN     "embedding" vector(1536),
ADD COLUMN     "failureMode" "FailureMode";

-- Vector similarity indexes (cosine distance, matches OpenAI embedding
-- guidance). HNSW over IVFFlat: better recall/query performance, and
-- doesn't need a pre-existing data distribution to build well — good fit
-- for a table that starts empty and grows via backfill.
CREATE INDEX "IssueHistory_embedding_hnsw_idx" ON "IssueHistory" USING hnsw (embedding vector_cosine_ops);
CREATE INDEX "MaintenanceLog_embedding_hnsw_idx" ON "MaintenanceLog" USING hnsw (embedding vector_cosine_ops);
