import { ArrowLeft, Loader2, MapPin, Check, CloudUpload } from "lucide-react";
import { Issue } from "@/types/issue";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ContractEditor } from "./ContractEditor";
import { IssuePanel } from "./IssuePanel";
import { ProgressRing } from "./ProgressRing";

export type SaveState = "saved" | "unsaved" | "saving";

interface ReviewPageProps {
  jurisdiction: string;
  draftText: string;
  issues: Issue[];
  activeIssueId: string | null;
  saveState: SaveState;
  busy: boolean;
  onTextChange: (text: string) => void;
  onSelectIssue: (issueId: string) => void;
  onAccept: (issueId: string) => void;
  onDismiss: (issueId: string) => void;
  onBack: () => void;
}

const SAVE_LABEL: Record<SaveState, string> = {
  saved: "All changes saved",
  unsaved: "Unsaved changes",
  saving: "Saving...",
};

/** Step two: the editable contract on the left, the suggestion for the active issue on the right. */
export function ReviewPage({
  jurisdiction,
  draftText,
  issues,
  activeIssueId,
  saveState,
  busy,
  onTextChange,
  onSelectIssue,
  onAccept,
  onDismiss,
  onBack,
}: ReviewPageProps) {
  const pending = issues.filter((i) => i.status === "pending");
  const handled = issues.length - pending.length;
  const activeIssue = issues.find((i) => i._id === activeIssueId) ?? null;
  const activePosition = activeIssue ? pending.findIndex((i) => i._id === activeIssue._id) + 1 : 0;

  return (
    <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-8">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={onBack}>
            <ArrowLeft /> Start over
          </Button>
          <div className="grid">
            <h1 className="text-xl font-semibold tracking-tight">Review contract</h1>
            <Badge variant="secondary" className="mt-1 w-fit gap-1">
              <MapPin className="size-3" /> {jurisdiction}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
            {saveState === "saving" ? (
              <Loader2 className="size-3.5 animate-spin" />
            ) : saveState === "saved" ? (
              <Check className="size-3.5 text-emerald-600" />
            ) : (
              <CloudUpload className="size-3.5" />
            )}
            {SAVE_LABEL[saveState]}
          </span>
          <div className="flex items-center gap-3 rounded-xl border bg-card px-4 py-2 shadow-sm">
            <ProgressRing done={handled} total={issues.length} />
            <div className="text-sm">
              <p className="font-medium">
                {pending.length === 0 ? "All handled" : `${pending.length} to review`}
              </p>
              <p className="text-muted-foreground">Issues handled</p>
            </div>
          </div>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        <div className="grid gap-3">
          <p className="text-sm text-muted-foreground">
            Edit the contract directly. Highlighted passages have suggestions, and they stay in place as you type.
          </p>
          <ContractEditor
            text={draftText}
            issues={issues}
            activeIssueId={activeIssueId}
            readOnly={busy}
            onTextChange={onTextChange}
            onSelectIssue={onSelectIssue}
          />
        </div>

        <aside className="lg:sticky lg:top-6 lg:self-start">
          {activeIssue ? (
            <IssuePanel
              issue={activeIssue}
              position={activePosition}
              total={pending.length}
              busy={busy}
              onAccept={onAccept}
              onDismiss={onDismiss}
            />
          ) : (
            <p className="rounded-xl border border-dashed p-6 text-center text-muted-foreground">
              No suggestions are waiting.
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
