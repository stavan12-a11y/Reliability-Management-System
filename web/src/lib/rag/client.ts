import OpenAI from "openai";

export const EMBEDDING_MODEL = "text-embedding-3-small";
export const EMBEDDING_DIMENSIONS = 1536;
export const CHAT_MODEL = process.env.OPENAI_CHAT_MODEL || "gpt-4o-mini";

let client: OpenAI | null = null;

export function isRagConfigured() {
  return !!process.env.OPENAI_API_KEY;
}

// Lazy singleton, same reasoning as lib/prisma.ts: don't throw at import
// time just because a route module got evaluated during Next.js's build
// analysis — only throw once something actually tries to call OpenAI.
export function getOpenAI(): OpenAI {
  if (!client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new Error("OPENAI_API_KEY is not set — AI history lookup is not configured.");
    }
    client = new OpenAI({ apiKey });
  }
  return client;
}
