import { GoogleGenAI } from "@google/genai";

// Gemini's free tier (no credit card required — aistudio.google.com/apikey)
// covers this app's usage comfortably. gemini-embedding-001 natively
// outputs 3072 dims but supports MRL truncation via outputDimensionality —
// truncated to 768 here to match schema.prisma's vector(768) columns (see
// embed.ts, which passes this through on every embedContent call).
export const EMBEDDING_MODEL = "gemini-embedding-001";
export const EMBEDDING_DIMENSIONS = 768;
// "-latest" alias Google maintains to always point at their current
// recommended flash model, rather than a version number that may age out.
export const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || "gemini-flash-latest";

let client: GoogleGenAI | null = null;

export function isRagConfigured() {
  return !!process.env.GEMINI_API_KEY;
}

// Lazy singleton, same reasoning as lib/prisma.ts: don't throw at import
// time just because a route module got evaluated during Next.js's build
// analysis — only throw once something actually tries to call Gemini.
export function getGemini(): GoogleGenAI {
  if (!client) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set — AI history lookup is not configured.");
    }
    client = new GoogleGenAI({ apiKey });
  }
  return client;
}
