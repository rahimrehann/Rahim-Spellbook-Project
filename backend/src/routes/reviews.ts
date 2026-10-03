import { Router, Request, Response } from "express";
import { findCountry } from "../jurisdictions";
import { renderContractPdf } from "../services/exportPdf";
import { acceptSuggestion, createReview, syncIssues } from "../services/review";
import { ReviewIssue } from "../types/issue";
import { sendServiceError } from "./errors";

export const reviewsRouter = Router();

function isReviewIssue(value: unknown): value is ReviewIssue {
  if (typeof value !== "object" || value === null) return false;
  const issue = value as Record<string, unknown>;
  return (
    typeof issue.id === "string" &&
    typeof issue.quote === "string" &&
    typeof issue.summary === "string" &&
    typeof issue.reasoning === "string" &&
    typeof issue.suggestion === "string" &&
    typeof issue.startOffset === "number" &&
    typeof issue.endOffset === "number" &&
    (issue.status === "pending" || issue.status === "resolved" || issue.status === "dismissed") &&
    (issue.legalBasis === null || typeof issue.legalBasis === "object")
  );
}

function isIssueList(value: unknown): value is ReviewIssue[] {
  return Array.isArray(value) && value.every(isReviewIssue);
}

/**
 * POST /api/reviews
 * Reviews a contract against the law of the selected state or province.
 * Returns the text, the jurisdiction label and the flagged issues.
 */
reviewsRouter.post("/", async (req: Request, res: Response) => {
  const { text, country: countryCode, region } = req.body;

  if (typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "Field 'text' is required and must be a non-empty string." });
  }

  const country = findCountry(countryCode);
  if (!country || typeof region !== "string" || !country.regions.includes(region)) {
    return res.status(400).json({
      error: "Fields 'country' and 'region' must be a supported country and one of its states or provinces.",
    });
  }

  try {
    const jurisdiction = `${region}, ${country.name}`;
    const issues = await createReview(text, jurisdiction);
    res.json({ text, jurisdiction, issues });
  } catch (err) {
    sendServiceError(res, err, "Failed to review the contract.");
  }
});

/**
 * POST /api/reviews/sync
 * Body: { text, issues }. Re-locates the pending issues after the user edits the text.
 */
reviewsRouter.post("/sync", (req: Request, res: Response) => {
  const { text, issues } = req.body;
  if (typeof text !== "string" || !isIssueList(issues)) {
    return res.status(400).json({ error: "Fields 'text' and 'issues' are required." });
  }
  res.json({ issues: syncIssues(text, issues) });
});

/**
 * POST /api/reviews/accept
 * Body: { text, issues, issueId }. Applies one suggested rewording.
 */
reviewsRouter.post("/accept", (req: Request, res: Response) => {
  const { text, issues, issueId } = req.body;
  if (typeof text !== "string" || !isIssueList(issues) || typeof issueId !== "string") {
    return res.status(400).json({ error: "Fields 'text', 'issues' and 'issueId' are required." });
  }

  const result = acceptSuggestion(text, issues, issueId);
  if (!result) return res.status(404).json({ error: "Pending issue not found." });
  res.json(result);
});

/**
 * POST /api/reviews/pdf
 * Body: { text }. Returns the contract text as a PDF download.
 */
reviewsRouter.post("/pdf", async (req: Request, res: Response) => {
  const { text } = req.body;
  if (typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "Field 'text' is required and must be a non-empty string." });
  }

  try {
    const pdf = await renderContractPdf(text);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", 'attachment; filename="contract-updated.pdf"');
    res.send(pdf);
  } catch (err) {
    sendServiceError(res, err, "Failed to create the PDF.");
  }
});
