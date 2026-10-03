import { useState } from "react";
import { ArrowDown, Check, ChevronDown, ChevronUp, Scale, X } from "lucide-react";
import { Issue } from "@/types/issue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface IssuePanelProps {
  issue: Issue;
  position: number;
  total: number;
  busy: boolean;
  onAccept: (issueId: string) => void;
  onDismiss: (issueId: string) => void;
}

/** The suggestion card for one flagged passage: before, after, legal basis, and the decision. */
export function IssuePanel({ issue, position, total, busy, onAccept, onDismiss }: IssuePanelProps) {
  const [showReasoning, setShowReasoning] = useState(false);

  return (
    <Card className="shadow-sm">
      <CardHeader className="grid gap-2">
        <div className="flex items-center justify-between">
          <Badge variant="secondary">
            Issue {position} of {total}
          </Badge>
        </div>
        <h2 className="text-lg font-semibold leading-snug">{issue.summary}</h2>
      </CardHeader>

      <CardContent className="grid gap-5">
        <div className="grid gap-2">
          <div className="rounded-lg border border-red-200 bg-red-50/70 px-4 py-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-red-700">Current wording</p>
            <p className="font-serif text-[15px] text-red-900 line-through decoration-red-400">{issue.quote}</p>
          </div>
          <ArrowDown className="mx-auto size-4 text-muted-foreground" />
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 px-4 py-3">
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-emerald-700">Suggested wording</p>
            <p className="font-serif text-[15px] text-emerald-950">{issue.suggestion}</p>
          </div>
        </div>

        {issue.legalBasis && (
          <div className="grid gap-1.5 rounded-lg border bg-muted/50 px-4 py-3">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <Scale className="size-4 text-primary" />
              {issue.legalBasis.citation}
            </p>
            <p className="text-sm text-muted-foreground">{issue.legalBasis.explanation}</p>
            <p className="text-xs text-muted-foreground/80">AI-suggested reference. Verify it before relying on it.</p>
          </div>
        )}

        <div>
          <button
            type="button"
            onClick={() => setShowReasoning((v) => !v)}
            className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
          >
            {showReasoning ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            {showReasoning ? "Hide reasoning" : "Why was this flagged?"}
          </button>
          {showReasoning && <p className="mt-2 text-sm text-muted-foreground">{issue.reasoning}</p>}
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <Button
            variant="outline"
            size="lg"
            disabled={busy}
            onClick={() => {
              setShowReasoning(false);
              onDismiss(issue.id);
            }}
          >
            <X /> Dismiss
          </Button>
          <Button
            size="lg"
            disabled={busy}
            className="bg-emerald-600 text-white hover:bg-emerald-700"
            onClick={() => {
              setShowReasoning(false);
              onAccept(issue.id);
            }}
          >
            <Check /> Accept
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
