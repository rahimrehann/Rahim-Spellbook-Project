export interface QuoteLocation {
  startOffset: number;
  endOffset: number;
}

/**
 * Finds the start/end character offsets of a quoted substring within
 * the full document text. The LLM is asked to copy quotes verbatim,
 * but models occasionally alter whitespace, so this falls back to a
 * whitespace-normalized match before giving up.
 */
export function locateQuote(documentText: string, quote: string): QuoteLocation | null {
  const exactIndex = documentText.indexOf(quote);
  if (exactIndex !== -1) {
    return { startOffset: exactIndex, endOffset: exactIndex + quote.length };
  }

  return locateNormalizedQuote(documentText, quote);
}

/**
 * Collapses runs of whitespace in the document and quote, searches the
 * collapsed text, then maps the match back to positions in the original.
 */
function locateNormalizedQuote(documentText: string, quote: string): QuoteLocation | null {
  // originalIndexOf[k] is the position in documentText of the k-th character
  // of the collapsed document text.
  const collapsed: string[] = [];
  const originalIndexOf: number[] = [];
  let lastWasSpace = false;

  for (let i = 0; i < documentText.length; i++) {
    const isSpace = /\s/.test(documentText[i]);
    if (isSpace && lastWasSpace) continue;
    collapsed.push(isSpace ? " " : documentText[i]);
    originalIndexOf.push(i);
    lastWasSpace = isSpace;
  }

  const normalizedQuote = quote.replace(/\s+/g, " ").trim();
  const matchStart = collapsed.join("").indexOf(normalizedQuote);
  if (matchStart === -1) return null;

  const matchEnd = matchStart + normalizedQuote.length - 1;
  return {
    startOffset: originalIndexOf[matchStart],
    endOffset: originalIndexOf[matchEnd] + 1,
  };
}
