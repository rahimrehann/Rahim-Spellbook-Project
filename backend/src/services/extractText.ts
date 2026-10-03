// Importing the worker explicitly makes sure it is bundled for serverless hosts,
// where pdf.js cannot find it on disk.
import "pdfjs-dist/legacy/build/pdf.worker.js";
import { getDocument, VerbosityLevel } from "pdfjs-dist/legacy/build/pdf.js";
import { generateText } from "./llm";

export const SUPPORTED_UPLOAD_TYPES = ["application/pdf", "image/png"] as const;
export type UploadType = (typeof SUPPORTED_UPLOAD_TYPES)[number];

/** Below this many characters a PDF is treated as a scan with no text layer. */
const MIN_TEXT_PDF_CHARS = 50;

/**
 * Reads the text layer of a PDF directly, which is instant and needs no AI.
 * Lines that wrap within a paragraph are joined; a larger vertical gap
 * starts a new paragraph.
 */
async function extractTextLayer(pdfBuffer: Buffer): Promise<string> {
  const doc = await getDocument({
    data: new Uint8Array(pdfBuffer),
    disableFontFace: true,
    verbosity: VerbosityLevel.ERRORS,
  }).promise;

  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= doc.numPages; pageNumber++) {
    const page = await doc.getPage(pageNumber);
    const content = await page.getTextContent();

    let pageText = "";
    let previousY: number | null = null;
    for (const item of content.items) {
      if (!("str" in item)) continue;
      const y = item.transform[5];
      const lineHeight = item.height || 12;
      if (previousY !== null && Math.abs(previousY - y) > lineHeight * 0.5) {
        const gap = Math.abs(previousY - y);
        pageText += gap > lineHeight * 1.8 ? "\n\n" : " ";
      }
      pageText += item.str;
      previousY = y;
    }
    pages.push(pageText);
  }

  return pages
    .join("\n\n")
    .replace(/[ \t]+/g, " ")
    .replace(/ *\n */g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * Returns the text of an uploaded PDF or PNG. Text-based PDFs are read
 * locally; scanned PDFs and PNG images are read by the AI provider.
 */
export async function extractTextFromFile(base64Data: string, mimeType: UploadType): Promise<string> {
  if (mimeType === "application/pdf") {
    const text = await extractTextLayer(Buffer.from(base64Data, "base64"));
    if (text.length >= MIN_TEXT_PDF_CHARS) return text;
  }

  const text = await generateText([
    {
      text: `Transcribe the full text of this contract exactly as written. Join lines that wrap within a paragraph into one line, and separate paragraphs with a blank line.
Return only the contract text. Do not add commentary, headings, or descriptions of the document.`,
    },
    { inlineData: { data: base64Data, mimeType } },
  ]);

  return text.trim();
}
