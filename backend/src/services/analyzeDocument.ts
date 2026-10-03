import { RawLlmIssue } from "../types/issue";
import { generateText } from "./gemini";
import { validateLlmIssueList } from "./validateLlmIssue";

const MAX_ATTEMPTS = 3;

function buildPrompt(documentText: string, location: string, correction?: string): string {
  const base = `You are reviewing a legal contract under the law of ${location}.
This is a wording review, not legal advice. You are flagging wording patterns that may be weak, ambiguous, or unenforceable under norms typical of ${location}. You cannot guarantee that any clause is valid or invalid, so phrase each summary and reasoning as a concern to review, not a legal conclusion.

Flag passages that are:
- legally weak, ambiguous, or unlikely to be enforced as written under ${location} norms (for example, vague performance standards, unclear remedies, or terms a court would likely read against the drafter)
- worded less precisely than they could be (vague time periods, loosely defined obligations, or undefined terms used as if already defined)
- inconsistent within the contract (the same concept named two different ways, or defined terms used inconsistently)

For each issue, you must return an object with exactly these fields:
- "quote": the exact substring from the contract that has the issue (copy it verbatim, do not paraphrase)
- "summary": one short sentence describing the problem
- "reasoning": why this wording is a concern, referencing the specific words
- "suggestion": replacement text for the quoted passage only, written so it can be dropped in place of the quote. Do not include commentary, brackets, or explanations in it.
- "legalBasis": either null, or an object with "citation" and "explanation". Set it to an object ONLY when a specific, real statute, code section, regulation, or well-established case law clearly supports the suggested change under ${location} (for example, a specific section number). Otherwise set it to null.
  - "citation": the precise reference, such as "La. Civ. Code art. 2046"
  - "explanation": one or two sentences saying how that authority bears on this wording
  - Never invent citations. If you are unsure whether an authority exists or applies, use null.

Return ONLY a JSON array of these objects, with no markdown formatting, no code fences, and no extra text. If there are no issues, return an empty array: []

Contract:
"""
${documentText}
"""`;

  if (!correction) return base;

  return `${base}

Your previous response had a problem: ${correction}
Return the corrected JSON array now, following the exact field requirements above.`;
}

function stripCodeFences(text: string): string {
  return text
    .trim()
    .replace(/^```(json)?/i, "")
    .replace(/```$/, "")
    .trim();
}

export interface AnalyzeResult {
  issues: RawLlmIssue[];
  attempts: number;
  attemptLog: Array<{ attempt: number; validCount: number; invalidCount: number; errorSamples: string[] }>;
}

/**
 * Sends the contract to Gemini, framed against the given location
 * (e.g. "Ontario, Canada"), and validates the response against our
 * required shape. On validation failure, re-prompts with the specific
 * error so the model can correct itself, up to MAX_ATTEMPTS.
 */
export async function analyzeDocument(documentText: string, location: string): Promise<AnalyzeResult> {
  const attemptLog: AnalyzeResult["attemptLog"] = [];
  let correction: string | undefined;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const rawText = await generateText([{ text: buildPrompt(documentText, location, correction) }]);

    let parsed: unknown;
    try {
      parsed = JSON.parse(stripCodeFences(rawText));
    } catch {
      attemptLog.push({
        attempt,
        validCount: 0,
        invalidCount: 0,
        errorSamples: ["Response was not valid JSON."],
      });
      correction = "Your response was not valid JSON. Return only the JSON array, nothing else.";
      continue;
    }

    const { validIssues, invalidCount, errorSamples } = validateLlmIssueList(parsed);

    attemptLog.push({
      attempt,
      validCount: validIssues.length,
      invalidCount,
      errorSamples,
    });

    if (invalidCount === 0) {
      return { issues: validIssues, attempts: attempt, attemptLog };
    }

    correction = errorSamples.slice(0, 3).join(" ");
  }

  // Ran out of attempts: return nothing rather than partially valid issues.
  return {
    issues: [],
    attempts: MAX_ATTEMPTS,
    attemptLog,
  };
}
