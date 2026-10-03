import { strict as assert } from "node:assert";
import { test } from "node:test";
import { applySuggestion } from "../src/services/applySuggestion";
import { ReviewIssue } from "../src/types/issue";

function issue(id: string, startOffset: number, endOffset: number, suggestion: string): ReviewIssue {
  return {
    id,
    quote: "",
    startOffset,
    endOffset,
    suggestion,
    summary: "",
    reasoning: "",
    legalBasis: null,
    status: "pending",
  };
}

test("replaces the accepted passage with its suggestion", () => {
  const text = "Pay promptly now.";
  const issues = [issue("a", 4, 12, "within 30 days")];
  assert.equal(applySuggestion(text, issues, "a").text, "Pay within 30 days now.");
});

test("shifts issues that come after the edit", () => {
  const text = "Pay promptly. Client owes.";
  const issues = [issue("a", 4, 12, "within 30 days"), issue("b", 14, 20, "")];
  applySuggestion(text, issues, "a");
  assert.equal(issues[1].startOffset, 14 + ("within 30 days".length - 8));
  assert.equal(issues[1].status, "pending");
});

test("leaves earlier issues alone", () => {
  const text = "Term here. Pay promptly.";
  const issues = [issue("before", 0, 4, "Term"), issue("a", 16, 24, "within 30 days")];
  applySuggestion(text, issues, "a");
  assert.equal(issues[0].startOffset, 0);
  assert.equal(issues[0].status, "pending");
});

test("dismisses issues that overlap the replaced passage", () => {
  const text = "Pay promptly now.";
  const issues = [issue("a", 4, 12, "within 30 days"), issue("overlap", 8, 14, "")];
  applySuggestion(text, issues, "a");
  assert.equal(issues[1].status, "dismissed");
});
