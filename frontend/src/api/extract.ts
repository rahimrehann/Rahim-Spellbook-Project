const MAX_UPLOAD_BYTES = 10 * 1024 * 1024;

function readAsBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      // The data URL looks like "data:application/pdf;base64,<data>"; keep only the data.
      resolve((reader.result as string).split(",")[1]);
    };
    reader.onerror = () => reject(new Error("Could not read that file."));
    reader.readAsDataURL(file);
  });
}

/** Uploads a PDF or PNG and returns the contract text found in it. */
export async function extractTextFromFile(file: File): Promise<string> {
  if (file.size > MAX_UPLOAD_BYTES) {
    throw new Error("That file is larger than 10 MB. Please upload a smaller file.");
  }

  const res = await fetch("/api/extract-text", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ file: await readAsBase64(file), mimeType: file.type }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? "Failed to read text from the file.");
  }

  const body: { text: string } = await res.json();
  return body.text;
}
