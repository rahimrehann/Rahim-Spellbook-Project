export type IssueStatus = "pending" | "resolved" | "dismissed";

/** A specific law or legal authority that supports a suggested change. */
export interface LegalBasis {
  citation: string;
  explanation: string;
}

export interface Issue {
  _id: string;
  quote: string;
  startOffset: number;
  endOffset: number;
  summary: string;
  reasoning: string;
  suggestion: string;
  legalBasis: LegalBasis | null;
  status: IssueStatus;
}

export interface DocumentResponse {
  documentId: string;
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
