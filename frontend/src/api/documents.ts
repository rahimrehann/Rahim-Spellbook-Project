import { DocumentResponse } from "../types/issue";

async function request(url: string, options: RequestInit): Promise<DocumentResponse> {
  const res = await fetch(url, {
    ...options,
    headers: { "Content-Type": "application/json" },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Request failed.");
  }

  return res.json();
}

export function analyzeDocument(text: string, country: string, region: string): Promise<DocumentResponse> {
  return request("/api/documents", {
    method: "POST",
    body: JSON.stringify({ text, country, region }),
  });
}

/** Saves the user's edited text. Pending issues are re-located in the new text. */
export function saveText(documentId: string, text: string): Promise<DocumentResponse> {
  return request(`/api/documents/${documentId}/text`, {
    method: "PUT",
    body: JSON.stringify({ text }),
  });
}

export function acceptIssue(documentId: string, issueId: string): Promise<DocumentResponse> {
  return request(`/api/documents/${documentId}/issues/${issueId}/accept`, { method: "POST" });
}

export function dismissIssue(documentId: string, issueId: string): Promise<DocumentResponse> {
  return request(`/api/documents/${documentId}/issues/${issueId}`, {
    method: "PATCH",
    body: JSON.stringify({ status: "dismissed" }),
  });
}

export function pdfUrl(documentId: string): string {
  return `/api/documents/${documentId}/pdf`;
}
