import { LegalBasis, RawLlmIssue } from "../types/issue";

/**
 * Validates a single issue returned by the LLM against the shape we
 * actually need. Returns either the validated issue or a list of
 * specific, human-readable problems so the caller can decide whether
 * to retry with that feedback.
 */
export function validateLlmIssue(
  candidate: unknown
): { valid: true; issue: RawLlmIssue } | { valid: false; errors: string[] } {
  const errors: string[] = [];

  if (typeof candidate !== "object" || candidate === null) {
    return { valid: false, errors: ["Issue was not an object."] };
  }

  const obj = candidate as Record<string, unknown>;

  if (typeof obj.quote !== "string" || obj.quote.trim().length === 0) {
    errors.push("Field 'quote' is missing or not a non-empty string.");
  }

  if (typeof obj.summary !== "string" || obj.summary.trim().length === 0) {
    errors.push("Field 'summary' is missing or not a non-empty string.");
  }

  if (typeof obj.reasoning !== "string" || obj.reasoning.trim().length === 0) {
    errors.push("Field 'reasoning' is missing or not a non-empty string.");
  }

  if (typeof obj.suggestion !== "string" || obj.suggestion.trim().length === 0) {
    errors.push("Field 'suggestion' is missing or not a non-empty string.");
  }

  const legalBasis = parseLegalBasis(obj.legalBasis);
  if (legalBasis === undefined) {
    errors.push(
      "Field 'legalBasis' is missing or invalid. Use null, or an object with non-empty string 'citation' and 'explanation'."
    );
  }

  if (errors.length > 0) {
    return { valid: false, errors };
  }

  return {
    valid: true,
    issue: {
      quote: obj.quote as string,
      summary: obj.summary as string,
      reasoning: obj.reasoning as string,
      suggestion: obj.suggestion as string,
      legalBasis: legalBasis as LegalBasis | null,
    },
  };
}

/**
 * Returns the legal basis if it is null or a well-formed object, or
 * undefined if the value is missing or malformed.
 */
function parseLegalBasis(value: unknown): LegalBasis | null | undefined {
  if (value === null) return null;
  if (typeof value !== "object") return undefined;

  const { citation, explanation } = value as Record<string, unknown>;
  if (typeof citation !== "string" || citation.trim().length === 0) return undefined;
  if (typeof explanation !== "string" || explanation.trim().length === 0) return undefined;

  return { citation, explanation };
}

/**
 * Validates a full array of issues. Returns the valid issues plus a
 * per-item error report for anything that didn't pass, so the caller
 * can log exactly what was wrong rather than discarding silently.
 */
export function validateLlmIssueList(candidate: unknown): {
  validIssues: RawLlmIssue[];
  invalidCount: number;
  errorSamples: string[];
} {
  if (!Array.isArray(candidate)) {
    return {
      validIssues: [],
      invalidCount: 0,
      errorSamples: ["Top-level response was not an array."],
    };
  }

  const validIssues: RawLlmIssue[] = [];
  const errorSamples: string[] = [];
  let invalidCount = 0;

  for (const item of candidate) {
    const result = validateLlmIssue(item);
    if (result.valid) {
      validIssues.push(result.issue);
    } else {
      invalidCount += 1;
      errorSamples.push(...result.errors);
    }
  }

  return { validIssues, invalidCount, errorSamples };
}
