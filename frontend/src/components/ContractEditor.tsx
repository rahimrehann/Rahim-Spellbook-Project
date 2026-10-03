import { useRef } from "react";
import { cn } from "@/lib/utils";
import { Issue } from "@/types/issue";

interface ContractEditorProps {
  text: string;
  issues: Issue[];
  activeIssueId: string | null;
  readOnly: boolean;
  onTextChange: (text: string) => void;
  onSelectIssue: (issueId: string) => void;
}

interface Segment {
  text: string;
  issue: Issue | null;
}

// The highlight layer and the textarea must share these exact text styles so
// their line wrapping lines up character for character.
const SHARED_TEXT_STYLE =
  "whitespace-pre-wrap break-words px-8 py-7 font-serif text-[16px] leading-[1.85] tracking-normal";

/** Splits the text at each pending issue's offsets so the highlights can be drawn. */
function buildSegments(text: string, issues: Issue[]): Segment[] {
  const segments: Segment[] = [];
  let cursor = 0;

  for (const issue of issues) {
    if (issue.startOffset < cursor) continue; // skip overlapping issues
    if (issue.startOffset > cursor) {
      segments.push({ text: text.slice(cursor, issue.startOffset), issue: null });
    }
    segments.push({ text: text.slice(issue.startOffset, issue.endOffset), issue });
    cursor = issue.endOffset;
  }

  if (cursor < text.length) {
    segments.push({ text: text.slice(cursor), issue: null });
  }
  return segments;
}

/**
 * An editable contract with pending suggestions highlighted in place.
 * A transparent textarea sits on top of a highlight layer, so the user can
 * type normally while the flagged passages stay marked.
 */
export function ContractEditor({
  text,
  issues,
  activeIssueId,
  readOnly,
  onTextChange,
  onSelectIssue,
}: ContractEditorProps) {
  const highlightRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const pendingIssues = issues
    .filter((issue) => issue.status === "pending")
    .sort((a, b) => a.startOffset - b.startOffset);

  /** Selecting the issue under the caret keeps the suggestion panel in step with the text. */
  function selectIssueAtCaret() {
    const caret = textareaRef.current?.selectionStart ?? -1;
    const issue = pendingIssues.find((i) => caret >= i.startOffset && caret <= i.endOffset);
    if (issue && issue.id !== activeIssueId) onSelectIssue(issue.id);
  }

  function syncScroll() {
    if (highlightRef.current && textareaRef.current) {
      highlightRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }

  const segments = buildSegments(text, pendingIssues);

  return (
    <div className="relative min-h-[560px] overflow-hidden rounded-xl border bg-card">
      <div
        ref={highlightRef}
        aria-hidden
        className={cn("pointer-events-none absolute inset-0 overflow-hidden text-transparent", SHARED_TEXT_STYLE)}
      >
        {segments.map((segment, i) =>
          segment.issue ? (
            <mark
              key={segment.issue.id}
              className={cn(
                "rounded-sm text-transparent transition-colors",
                segment.issue.id === activeIssueId
                  ? "bg-indigo-300/70 shadow-[0_0_0_2px_var(--color-indigo-500)]"
                  : "bg-amber-200/80"
              )}
            >
              {segment.text}
            </mark>
          ) : (
            <span key={i}>{segment.text}</span>
          )
        )}
        {/* A trailing character keeps the layer as tall as the textarea when the text ends with a newline. */}
        {" "}
      </div>

      <textarea
        ref={textareaRef}
        value={text}
        readOnly={readOnly}
        spellCheck
        aria-label="Contract text"
        onChange={(e) => onTextChange(e.target.value)}
        onScroll={syncScroll}
        onClick={selectIssueAtCaret}
        onKeyUp={selectIssueAtCaret}
        className={cn(
          "absolute inset-0 size-full resize-none bg-transparent text-foreground outline-none caret-indigo-600",
          "placeholder:text-muted-foreground",
          readOnly && "cursor-default",
          SHARED_TEXT_STYLE
        )}
      />
    </div>
  );
}
