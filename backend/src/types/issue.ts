export type IssueStatus = "pending" | "resolved" | "dismissed";

/** A specific law or legal authority that supports a suggested change. */
export interface LegalBasis {
  citation: string;
  explanation: string;
}

/** The exact shape we require back from the LLM for a single flagged issue. */
export interface RawLlmIssue {
  quote: string;
  summary: string;
  reasoning: string;
  suggestion: string;
  legalBasis: LegalBasis | null;
}

/** A flagged issue as the frontend holds it. The browser keeps these between requests. */
export interface ReviewIssue extends RawLlmIssue {
  id: string;
  startOffset: number;
  endOffset: number;
  status: IssueStatus;
}
