import { GoogleGenerativeAI, Part } from "@google/generative-ai";

// gemini-1.5-flash has been retired and now returns 404 for generateContent.
const GEMINI_MODEL = "gemini-flash-latest";
const MAX_TRIES = 4;
const RETRYABLE_STATUSES = [429, 500, 503, 504];

// Created lazily so the key is read at request time, after dotenv has
// loaded backend/.env (see the import at the top of server.ts).
let genAI: GoogleGenerativeAI | null = null;

function getGenAI(): GoogleGenerativeAI {
  if (!genAI) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is not set. Check backend/.env.");
    }
    genAI = new GoogleGenerativeAI(apiKey);
  }
  return genAI;
}

/** Thrown when Gemini is overloaded or unavailable even after retries. */
export class GeminiBusyError extends Error {
  constructor() {
    super("The AI service is busy right now. Please try again in a moment.");
  }
}

function isRetryable(err: unknown): boolean {
  const status = (err as { status?: number }).status;
  return typeof status === "number" && RETRYABLE_STATUSES.includes(status);
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Sends a prompt (text plus optional files) to Gemini and returns the
 * response text. Temporary overload errors are retried with exponential
 * backoff; anything else is thrown immediately.
 */
export async function generateText(parts: Part[]): Promise<string> {
  const model = getGenAI().getGenerativeModel({ model: GEMINI_MODEL });

  for (let attempt = 1; ; attempt++) {
    try {
      const result = await model.generateContent(parts);
      return result.response.text();
    } catch (err) {
      if (!isRetryable(err)) throw err;
      if (attempt >= MAX_TRIES) throw new GeminiBusyError();
      await sleep(1000 * 2 ** (attempt - 1));
    }
  }
}
