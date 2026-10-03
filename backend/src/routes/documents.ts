import { Router, Request, Response } from "express";
import { DocumentModel } from "../models/Document";
import { analyzeDocument } from "../services/analyzeDocument";
import { applySuggestion } from "../services/applySuggestion";
import { relocatePendingIssues } from "../services/relocateIssues";
import { locateQuote } from "../services/locateQuote";
import { findCountry } from "../jurisdictions";
import { renderContractPdf } from "../services/exportPdf";
import { sendServiceError } from "./errors";

export const documentsRouter = Router();

interface StoredDocument {
  _id: unknown;
  text: string;
  country: string;
  region: string;
  issues: unknown[];
}

function toResponse(doc: StoredDocument) {
  const country = findCountry(doc.country);
  return {
    documentId: doc._id,
    text: doc.text,
    jurisdiction: `${doc.region}, ${country?.name}`,
    issues: doc.issues,
  };
}

/**
 * POST /api/documents
 * Reviews a contract against the law of the selected state or province,
 * and stores it with its flagged issues.
 */
documentsRouter.post("/", async (req: Request, res: Response) => {
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
    const location = `${region}, ${country.name}`;
    const { issues: rawIssues, attempts, attemptLog } = await analyzeDocument(text, location);

    const issuesWithOffsets = rawIssues
      .map((issue) => {
        const found = locateQuote(text, issue.quote);
        if (!found) return null;
        return {
          quote: issue.quote,
          startOffset: found.startOffset,
          endOffset: found.endOffset,
          summary: issue.summary,
          reasoning: issue.reasoning,
          suggestion: issue.suggestion,
          legalBasis: issue.legalBasis,
          status: "pending" as const,
        };
      })
      .filter((issue): issue is NonNullable<typeof issue> => issue !== null);

    const doc = await DocumentModel.create({
      text,
      country: country.code,
      region,
      issues: issuesWithOffsets,
    });

    res.status(201).json({ ...toResponse(doc), meta: { attempts, attemptLog } });
  } catch (err) {
    sendServiceError(res, err, "Failed to analyze document.");
  }
});

/**
 * GET /api/documents/:id
 * Fetches a stored document with its current issue list.
 */
documentsRouter.get("/:id", async (req: Request, res: Response) => {
  const doc = await DocumentModel.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found." });
  res.json(toResponse(doc));
});

/**
 * GET /api/documents/:id/pdf
 * Downloads the document's current text (with accepted changes) as a PDF.
 */
documentsRouter.get("/:id/pdf", async (req: Request, res: Response) => {
  const doc = await DocumentModel.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found." });

  const pdf = await renderContractPdf(doc.text);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="contract-${doc.id}.pdf"`);
  res.send(pdf);
});

/**
 * POST /api/documents/:documentId/issues/:issueId/accept
 * Replaces the flagged passage with its suggested rewording.
 */
documentsRouter.post("/:documentId/issues/:issueId/accept", async (req: Request, res: Response) => {
  const doc = await DocumentModel.findById(req.params.documentId);
  if (!doc) return res.status(404).json({ error: "Document not found." });

  const issue = doc.issues.find((i) => i._id.toString() === req.params.issueId);
  if (!issue || issue.status !== "pending") {
    return res.status(404).json({ error: "Pending issue not found." });
  }

  doc.text = applySuggestion(doc.text, doc.issues, req.params.issueId).text;
  issue.status = "resolved";
  await doc.save();

  res.json(toResponse(doc));
});

/**
 * PUT /api/documents/:id/text
 * Saves the user's directly edited text, then re-locates pending issues.
 * Issues whose quoted passage was changed or removed are resolved.
 */
documentsRouter.put("/:id/text", async (req: Request, res: Response) => {
  const { text } = req.body;

  if (typeof text !== "string" || text.trim().length === 0) {
    return res.status(400).json({ error: "Field 'text' is required and must be a non-empty string." });
  }

  const doc = await DocumentModel.findById(req.params.id);
  if (!doc) return res.status(404).json({ error: "Document not found." });

  doc.text = text;
  relocatePendingIssues(text, doc.issues);
  await doc.save();

  res.json(toResponse(doc));
});

/**
 * PATCH /api/documents/:documentId/issues/:issueId
 * Dismisses an issue, leaving the original wording unchanged.
 */
documentsRouter.patch("/:documentId/issues/:issueId", async (req: Request, res: Response) => {
  const { status } = req.body;

  if (status !== "dismissed") {
    return res.status(400).json({ error: "Field 'status' must be 'dismissed'." });
  }

  const doc = await DocumentModel.findById(req.params.documentId);
  if (!doc) return res.status(404).json({ error: "Document not found." });

  const issue = doc.issues.find((i) => i._id.toString() === req.params.issueId);
  if (!issue) return res.status(404).json({ error: "Issue not found." });

  issue.status = status;
  await doc.save();

  res.json(toResponse(doc));
});
