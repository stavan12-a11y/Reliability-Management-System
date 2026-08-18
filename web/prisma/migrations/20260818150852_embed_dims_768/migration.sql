-- Switching embedding provider from OpenAI (1536-dim) to Gemini
-- gemini-embedding-001, truncated to 768-dim — free tier, no billing
-- required. No rows have been embedded yet, so this is a safe in-place
-- type change, not a data migration.

-- DropIndex
DROP INDEX "IssueHistory_embedding_hnsw_idx";

-- DropIndex
DROP INDEX "MaintenanceLog_embedding_hnsw_idx";

-- AlterColumn
ALTER TABLE "IssueHistory" ALTER COLUMN "embedding" TYPE vector(768);
ALTER TABLE "MaintenanceLog" ALTER COLUMN "embedding" TYPE vector(768);

-- Recreate indexes at the new dimension
CREATE INDEX "IssueHistory_embedding_hnsw_idx" ON "IssueHistory" USING hnsw (embedding vector_cosine_ops);
CREATE INDEX "MaintenanceLog_embedding_hnsw_idx" ON "MaintenanceLog" USING hnsw (embedding vector_cosine_ops);
