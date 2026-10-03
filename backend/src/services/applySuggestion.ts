/**
 * Replaces the text under an accepted issue with its suggested rewording,
 * then keeps the other issues' offsets pointing at the right text:
 * - issues entirely before the edit are unchanged
 * - issues entirely after it are shifted by the change in length
 * - issues that overlapped the replaced text no longer match the document,
 *   so they are dismissed
 */
export function applySuggestion(
  text: string,
  issues: Array<{ _id: { toString(): string }; startOffset: number; endOffset: number; suggestion: string; status: string }>,
  acceptedId: string
): { text: string } {
  const accepted = issues.find((issue) => issue._id.toString() === acceptedId);
  if (!accepted) throw new Error("Issue not found.");

  const { startOffset, endOffset, suggestion } = accepted;
  const lengthChange = suggestion.length - (endOffset - startOffset);

  for (const other of issues) {
    if (other._id.toString() === acceptedId || other.status !== "pending") continue;

    if (other.endOffset <= startOffset) continue;

    if (other.startOffset >= endOffset) {
      other.startOffset += lengthChange;
      other.endOffset += lengthChange;
    } else {
      other.status = "dismissed";
    }
  }

  return { text: text.slice(0, startOffset) + suggestion + text.slice(endOffset) };
}
