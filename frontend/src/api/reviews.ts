import { Issue, ReviewResult } from "../types/issue";

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({}));
    throw new Error(error.error ?? "Request failed.");
  }

  return res.json();
}

export function reviewContract(text: string, country: string, region: string): Promise<ReviewResult> {
  return postJson("/api/reviews", { text, country, region });
}

/** Re-locates pending issues after the user edits the text. */
export async function syncIssues(text: string, issues: Issue[]): Promise<Issue[]> {
  const body = await postJson<{ issues: Issue[] }>("/api/reviews/sync", { text, issues });
  return body.issues;
}

/** Applies one suggested rewording. Returns the new text and issue list. */
export function acceptSuggestion(text: string, issues: Issue[], issueId: string): Promise<ReviewResult> {
  return postJson("/api/reviews/accept", { text, issues, issueId });
}

/** Downloads the contract text as a PDF. */
export async function downloadPdf(text: string): Promise<void> {
  const res = await fetch("/api/reviews/pdf", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
  if (!res.ok) throw new Error("Could not create the PDF.");

  const url = URL.createObjectURL(await res.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = "contract-updated.pdf";
  link.click();
  URL.revokeObjectURL(url);
}
