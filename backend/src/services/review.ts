import { randomUUID } from "crypto";
import { ReviewIssue } from "../types/issue";
import { analyzeDocument } from "./analyzeDocument";
import { applySuggestion } from "./applySuggestion";
import { locateQuote } from "./locateQuote";
import { relocatePendingIssues } from "./relocateIssues";

/** Runs the AI review and turns each flagged quote into an issue with a position in the text. */
export async function createReview(text: string, location: string): Promise<ReviewIssue[]> {
  const { issues } = await analyzeDocument(text, location);

  return issues.flatMap((raw) => {
    const found = locateQuote(text, raw.quote);
    if (!found) return [];
    return [{ ...raw, id: randomUUID(), startOffset: found.startOffset, endOffset: found.endOffset, status: "pending" as const }];
  });
}

/** Keeps pending issues in step with edited text. Returns updated copies. */
export function syncIssues(text: string, issues: ReviewIssue[]): ReviewIssue[] {
  const copies = issues.map((issue) => ({ ...issue }));
  relocatePendingIssues(text, copies);
  return copies;
}

/**
 * Accepts one suggestion. The issues are re-located in the submitted text
 * first, so the offsets match what the user sees. Returns null if no pending
 * issue has that id.
 */
export function acceptSuggestion(
  text: string,
  issues: ReviewIssue[],
  issueId: string
): { text: string; issues: ReviewIssue[] } | null {
  const copies = syncIssues(text, issues);
  const accepted = copies.find((issue) => issue.id === issueId);
  if (!accepted || accepted.status !== "pending") return null;

  const result = applySuggestion(text, copies, issueId);
  accepted.status = "resolved";
  return { text: result.text, issues: copies };
}
