import { Router, Request, Response } from "express";
import { extractTextFromFile, SUPPORTED_UPLOAD_TYPES, UploadType } from "../services/extractText";
import { sendServiceError } from "./errors";

export const extractRouter = Router();

/**
 * POST /api/extract-text
 * Body: { file: <base64 PDF or PNG>, mimeType: "application/pdf" | "image/png" }
 * Returns the text found in the file so the user can review and edit it.
 */
extractRouter.post("/", async (req: Request, res: Response) => {
  const { file, mimeType } = req.body;

  if (typeof file !== "string" || file.length === 0) {
    return res.status(400).json({ error: "Field 'file' is required and must be base64 file data." });
  }

  if (!SUPPORTED_UPLOAD_TYPES.includes(mimeType)) {
    return res.status(400).json({ error: "Only PDF and PNG files are supported." });
  }

  try {
    const text = await extractTextFromFile(file, mimeType as UploadType);
    if (text.length === 0) {
      return res.status(422).json({ error: "No text could be found in that file." });
    }
    res.json({ text });
  } catch (err) {
    sendServiceError(res, err, "Failed to read text from the file.");
  }
});
