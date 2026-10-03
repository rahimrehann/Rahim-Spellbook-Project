import { generateText } from "./gemini";

export const SUPPORTED_UPLOAD_TYPES = ["application/pdf", "image/png"] as const;
export type UploadType = (typeof SUPPORTED_UPLOAD_TYPES)[number];

/**
 * Reads the text out of an uploaded PDF or PNG. Gemini reads both file
 * types directly, so no separate PDF parser or OCR engine is needed.
 */
export async function extractTextFromFile(base64Data: string, mimeType: UploadType): Promise<string> {
  const text = await generateText([
    {
      text: `Transcribe the full text of this contract exactly as written. Join lines that wrap within a paragraph into one line, and separate paragraphs with a blank line.
Return only the contract text. Do not add commentary, headings, or descriptions of the document.`,
    },
    { inlineData: { data: base64Data, mimeType } },
  ]);

  return text.trim();
}
