export type IssueStatus = "pending" | "resolved" | "dismissed";

/** A specific statute, code section, or case that supports a suggested change. */
export interface LegalBasis {
  citation: string;
  explanation: string;
}

export interface FlaggedIssue {
  id: string;
  documentId: string;
  quote: string;
  startOffset: number;
  endOffset: number;
  summary: string;
  reasoning: string;
  suggestion: string;
  legalBasis: LegalBasis | null;
  status: IssueStatus;
}

/**
 * The exact shape we require back from the LLM for a single flagged issue.
 * Validated in validateLlmIssue before it is trusted anywhere else.
 */
export interface RawLlmIssue {
  quote: string;
  summary: string;
  reasoning: string;
  suggestion: string;
  legalBasis: LegalBasis | null;
}
