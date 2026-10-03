import { strict as assert } from "node:assert";
import { test } from "node:test";
import { relocatePendingIssues } from "../src/services/relocateIssues";

test("moves a pending issue to where its quote now sits", () => {
  const issues = [{ status: "pending", quote: "promptly", startOffset: 4, endOffset: 12 }];
  relocatePendingIssues("Preface. Pay promptly.", issues);
  assert.equal(issues[0].startOffset, 13);
  assert.equal(issues[0].endOffset, 21);
});

test("resolves a pending issue whose quote was edited away", () => {
  const issues = [{ status: "pending", quote: "promptly", startOffset: 4, endOffset: 12 }];
  relocatePendingIssues("Pay within 30 days.", issues);
  assert.equal(issues[0].status, "resolved");
});

test("leaves dismissed and resolved issues unchanged", () => {
  const issues = [{ status: "dismissed", quote: "promptly", startOffset: 4, endOffset: 12 }];
  relocatePendingIssues("Preface. Pay promptly.", issues);
  assert.equal(issues[0].startOffset, 4);
  assert.equal(issues[0].status, "dismissed");
});
