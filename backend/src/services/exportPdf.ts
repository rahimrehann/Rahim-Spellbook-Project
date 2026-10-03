import PDFDocument from "pdfkit";

/** Renders the contract text as a plain, letter-size PDF. */
export function renderContractPdf(text: string): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: "LETTER", margin: 72 });
    const chunks: Buffer[] = [];

    doc.on("data", (chunk: Buffer) => chunks.push(chunk));
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);

    doc.font("Times-Roman").fontSize(12).text(text, { lineGap: 4 });
    doc.end();
  });
}
