import { strict as assert } from "node:assert";
import { test } from "node:test";
import { locateQuote } from "../src/services/locateQuote";

test("finds an exact quote and returns its offsets", () => {
  const text = "Payment is due promptly. Work Product belongs to the Client.";
  assert.deepEqual(locateQuote(text, "promptly"), { startOffset: 15, endOffset: 23 });
});

test("matches a quote whose whitespace differs from the document", () => {
  const text = "The Contractor shall   perform\nservices.";
  const found = locateQuote(text, "shall perform services");
  assert.ok(found);
  assert.equal(text.slice(found.startOffset, found.endOffset), "shall   perform\nservices");
});

test("returns null when the quote is not in the text", () => {
  assert.equal(locateQuote("Nothing relevant here.", "missing passage"), null);
});
