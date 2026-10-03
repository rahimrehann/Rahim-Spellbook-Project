export type IssueStatus = "pending" | "resolved" | "dismissed";

/** A specific law or legal authority that supports a suggested change. */
export interface LegalBasis {
  citation: string;
  explanation: string;
}

export interface Issue {
  id: string;
  quote: string;
  startOffset: number;
  endOffset: number;
  summary: string;
  reasoning: string;
  suggestion: string;
  legalBasis: LegalBasis | null;
  status: IssueStatus;
}

/** The review result. The browser keeps this and sends it back with each request. */
export interface ReviewResult {
  text: string;
  jurisdiction: string;
  issues: Issue[];
}

export interface Jurisdiction {
  code: "US" | "CA";
  name: string;
  regionLabel: "State" | "Province";
  regions: string[];
}
