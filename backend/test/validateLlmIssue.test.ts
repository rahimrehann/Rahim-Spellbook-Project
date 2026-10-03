import { strict as assert } from "node:assert";
import { test } from "node:test";
import { validateLlmIssueList } from "../src/services/validateLlmIssue";

const valid = {
  quote: "promptly",
  summary: "Payment timing is vague.",
  reasoning: "No deadline is stated.",
  suggestion: "within 30 days",
  legalBasis: null,
};

test("accepts a well-formed issue with no legal basis", () => {
  const result = validateLlmIssueList([valid]);
  assert.equal(result.validIssues.length, 1);
  assert.equal(result.invalidCount, 0);
});

test("accepts a legal basis with a citation and explanation", () => {
  const withBasis = {
    ...valid,
    legalBasis: { citation: "La. Civ. Code art. 1986", explanation: "Sets default timing." },
  };
  assert.equal(validateLlmIssueList([withBasis]).invalidCount, 0);
});

test("rejects an issue whose legal basis is missing", () => {
  const { legalBasis: _omitted, ...withoutBasis } = valid;
  const result = validateLlmIssueList([withoutBasis]);
  assert.equal(result.invalidCount, 1);
  assert.match(result.errorSamples[0], /legalBasis/);
});

test("rejects an empty suggestion so the retry loop can ask for a fix", () => {
  const result = validateLlmIssueList([{ ...valid, suggestion: "   " }]);
  assert.equal(result.invalidCount, 1);
  assert.match(result.errorSamples[0], /suggestion/);
});

test("rejects a response that is not an array", () => {
  assert.equal(validateLlmIssueList({ quote: "x" }).invalidCount, 1);
  assert.match(validateLlmIssueList({ quote: "x" }).errorSamples[0], /not an array/);
});
