import { locateQuote } from "./locateQuote";

interface RelocatableIssue {
  status: string;
  quote: string;
  startOffset: number;
  endOffset: number;
}

/**
 * Re-locates each pending issue's quote within the edited text. A pending
 * issue whose quote no longer appears (the user changed that passage) is
 * marked resolved. Resolved and dismissed issues are left unchanged.
 * Updates the issues in place.
 */
export function relocatePendingIssues(text: string, issues: RelocatableIssue[]): void {
  for (const issue of issues) {
    if (issue.status !== "pending") continue;

    const found = locateQuote(text, issue.quote);
    if (found) {
      issue.startOffset = found.startOffset;
      issue.endOffset = found.endOffset;
    } else {
      issue.status = "resolved";
    }
  }
}
