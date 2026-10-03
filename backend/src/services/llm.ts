import { GoogleGenerativeAI, Part } from "@google/generative-ai";

/** A piece of a prompt: text, or a file (PDF or PNG) encoded as base64. */
export type LlmPart = { text: string } | { inlineData: { data: string; mimeType: string } };

const MAX_TRIES = 4;
const RETRYABLE_STATUSES = [429, 500, 503, 529];

/** Thrown when the AI provider is overloaded or rate-limited even after retries. */
export class AiBusyError extends Error {
  constructor() {
    super("The AI service is busy right now. Please try again in a moment.");
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

function isRetryable(err: unknown): boolean {
  const status = (err as { status?: number }).status;
  return typeof status === "number" && RETRYABLE_STATUSES.includes(status);
}

/** Runs `call` again after a backoff while the error is a temporary overload. */
async function withRetries<T>(call: (attempt: number) => Promise<T>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await call(attempt);
    } catch (err) {
      if (!isRetryable(err)) throw err;
      if (attempt >= MAX_TRIES) throw new AiBusyError();
      await sleep(1000 * 2 ** (attempt - 1));
    }
  }
}

function withStatus(message: string, status: number): Error {
  return Object.assign(new Error(message), { status });
}

// ---- Gemini. Reads text, PDFs and images. ----

// Tried in turn: when one Gemini model is overloaded, the next attempt uses the other.
const GEMINI_MODELS = [process.env.GEMINI_MODEL ?? "gemini-flash-latest", "gemini-2.5-flash"];

let gemini: GoogleGenerativeAI | null = null;

async function generateWithGemini(parts: LlmPart[], attempt: number): Promise<string> {
  if (!gemini) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new Error("GEMINI_API_KEY is not set. Check backend/.env.");
    gemini = new GoogleGenerativeAI(apiKey);
  }

  const model = gemini.getGenerativeModel({ model: GEMINI_MODELS[(attempt - 1) % GEMINI_MODELS.length] });
  const result = await model.generateContent(parts as Part[]);
  return result.response.text();
}

// ---- Claude (Anthropic). Reads text, PDFs and images. ----

const CLAUDE_MODEL = process.env.CLAUDE_MODEL ?? "claude-sonnet-5";

async function generateWithClaude(parts: LlmPart[]): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error("ANTHROPIC_API_KEY is not set. Check backend/.env.");

  const content = parts.map((part) => {
    if ("text" in part) return { type: "text", text: part.text };
    const type = part.inlineData.mimeType === "application/pdf" ? "document" : "image";
    return { type, source: { type: "base64", media_type: part.inlineData.mimeType, data: part.inlineData.data } };
  });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      // Needed when the key is not tied to a workspace.
      ...(process.env.ANTHROPIC_WORKSPACE_ID && { "anthropic-workspace-id": process.env.ANTHROPIC_WORKSPACE_ID }),
    },
    body: JSON.stringify({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      messages: [{ role: "user", content }],
    }),
  });

  if (!res.ok) {
    throw withStatus(`Anthropic request failed with status ${res.status}`, res.status);
  }

  const body = (await res.json()) as { content: Array<{ type: string; text?: string }> };
  return body.content
    .filter((block) => block.type === "text")
    .map((block) => block.text ?? "")
    .join("");
}

// ---- Groq (optional). Very fast open models. Text only, so no PDFs or images. ----

async function generateWithGroq(parts: LlmPart[]): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY is not set. Check backend/.env.");
  if (parts.some((part) => "inlineData" in part)) {
    throw new Error("The Groq provider cannot read PDFs or images. Use LLM_PROVIDER=gemini or anthropic for scanned files.");
  }

  const content = parts.map((part) => (part as { text: string }).text).join("\n");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile",
      messages: [{ role: "user", content }],
      temperature: 0.2,
    }),
  });

  if (!res.ok) {
    throw withStatus(`Groq request failed with status ${res.status}`, res.status);
  }

  const body = (await res.json()) as { choices: Array<{ message: { content: string } }> };
  return body.choices[0].message.content;
}

/**
 * Sends a prompt to the configured provider (LLM_PROVIDER: "gemini",
 * "anthropic" or "groq") and returns the text response. Temporary overloads
 * are retried with backoff.
 */
export function generateText(parts: LlmPart[]): Promise<string> {
  const provider = process.env.LLM_PROVIDER ?? "gemini";
  if (provider === "anthropic") return withRetries(() => generateWithClaude(parts));
  if (provider === "groq") return withRetries(() => generateWithGroq(parts));
  return withRetries((attempt) => generateWithGemini(parts, attempt));
}
