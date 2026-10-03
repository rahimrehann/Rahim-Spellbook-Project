import { Response } from "express";
import { AiBusyError } from "../services/llm";

/**
 * Turns a failed AI or processing call into an HTTP response. Provider
 * overload gets a 503 with a message the user can act on; anything else
 * gets the caller's generic message and is logged for debugging.
 */
export function sendServiceError(res: Response, err: unknown, fallbackMessage: string) {
  if (err instanceof AiBusyError) {
    return res.status(503).json({ error: err.message });
  }
  console.error(fallbackMessage, err);
  return res.status(500).json({ error: fallbackMessage });
}
