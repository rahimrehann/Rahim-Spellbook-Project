import { useEffect, useRef, useState } from "react";
import { acceptSuggestion, downloadPdf, reviewContract, syncIssues } from "@/api/reviews";
import { ContractSubmission, StartPage } from "@/components/StartPage";
import { ReviewPage, SaveState } from "@/components/ReviewPage";
import { CompletePage } from "@/components/CompletePage";
import { Issue } from "@/types/issue";

type Screen = "start" | "review" | "complete";

const SYNC_DELAY_MS = 700;

const firstPending = (issues: Issue[]) => issues.find((i) => i.status === "pending") ?? null;

/**
 * Takes the server's re-located offsets and statuses for pending issues,
 * while keeping any dismissal the user made while the request was in flight.
 */
function mergeSynced(current: Issue[], synced: Issue[]): Issue[] {
  const syncedById = new Map(synced.map((issue) => [issue.id, issue]));
  return current.map((issue) => {
    const update = syncedById.get(issue.id);
    if (!update || issue.status !== "pending") return issue;
    return { ...issue, startOffset: update.startOffset, endOffset: update.endOffset, status: update.status };
  });
}

function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [jurisdiction, setJurisdiction] = useState("");
  const [issues, setIssues] = useState<Issue[]>([]);
  const [draftText, setDraftText] = useState("");
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [isLoading, setIsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs hold the latest values so delayed and in-flight requests never send stale state.
  const draftRef = useRef("");
  const issuesRef = useRef<Issue[]>([]);
  const syncTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(syncTimer.current), []);

  function setIssueList(next: Issue[]) {
    issuesRef.current = next;
    setIssues(next);
  }

  /** Re-locates the pending issues against the latest text. */
  async function syncDraft() {
    window.clearTimeout(syncTimer.current);
    const sentText = draftRef.current;
    const sentIssues = issuesRef.current;
    setSaveState("saving");
    const synced = await syncIssues(sentText, sentIssues);
    setIssueList(mergeSynced(issuesRef.current, synced));
    // Only mark saved if the user did not type again while the request was in flight.
    if (draftRef.current === sentText) setSaveState("saved");
  }

  function handleTextChange(text: string) {
    draftRef.current = text;
    setDraftText(text);
    setSaveState("unsaved");
    window.clearTimeout(syncTimer.current);
    syncTimer.current = window.setTimeout(() => {
      syncDraft().catch(() => setSaveState("unsaved"));
    }, SYNC_DELAY_MS);
  }

  async function handleReview({ text, country, region }: ContractSubmission) {
    setIsLoading(true);
    setError(null);
    try {
      const result = await reviewContract(text, country, region);
      setJurisdiction(result.jurisdiction);
      draftRef.current = result.text;
      setDraftText(result.text);
      setIssueList(result.issues);
      setSaveState("saved");
      setActiveIssueId(firstPending(result.issues)?.id ?? null);
      setScreen(firstPending(result.issues) ? "review" : "complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  function advanceAfter(next: Issue[]) {
    const nextPending = firstPending(next);
    setActiveIssueId(nextPending?.id ?? null);
    if (!nextPending) setScreen("complete");
  }

  /** Applies a suggestion. The server re-locates the issues in the text it receives. */
  async function handleAccept(issueId: string) {
    setBusy(true);
    setError(null);
    window.clearTimeout(syncTimer.current);
    try {
      const result = await acceptSuggestion(draftRef.current, issuesRef.current, issueId);
      draftRef.current = result.text;
      setDraftText(result.text);
      setIssueList(result.issues);
      setSaveState("saved");
      advanceAfter(result.issues);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to apply the suggestion.");
    } finally {
      setBusy(false);
    }
  }

  /** Dismissing only changes the browser's copy, so it needs no request. */
  function handleDismiss(issueId: string) {
    const next = issuesRef.current.map((issue) =>
      issue.id === issueId ? { ...issue, status: "dismissed" as const } : issue
    );
    setIssueList(next);
    advanceAfter(next);
  }

  async function handleDownload() {
    setError(null);
    try {
      await downloadPdf(draftRef.current);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create the PDF.");
    }
  }

  function startOver() {
    window.clearTimeout(syncTimer.current);
    draftRef.current = "";
    setDraftText("");
    setIssueList([]);
    setActiveIssueId(null);
    setSaveState("saved");
    setError(null);
    setScreen("start");
  }

  function keepEditing() {
    setActiveIssueId(firstPending(issuesRef.current)?.id ?? null);
    setScreen("review");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-6 py-3">
          <img
            src="/avatar.png"
            alt="Rahim"
            className="size-16 rounded-xl border object-cover shadow-sm"
          />
          <div className="leading-tight">
            <p className="text-[15px] font-semibold tracking-tight">Rahim&apos;s Spellbook Project</p>
            <p className="text-xs text-muted-foreground">Flag Review · Contract review</p>
          </div>
        </div>
      </header>

      {error && screen !== "start" && (
        <p role="alert" className="mx-auto mt-4 max-w-7xl rounded-lg border border-red-200 bg-red-50 px-6 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {screen === "start" && <StartPage onSubmit={handleReview} isLoading={isLoading} error={error} />}

      {screen === "review" && (
        <ReviewPage
          jurisdiction={jurisdiction}
          draftText={draftText}
          issues={issues}
          activeIssueId={activeIssueId}
          saveState={saveState}
          busy={busy}
          onTextChange={handleTextChange}
          onSelectIssue={setActiveIssueId}
          onAccept={handleAccept}
          onDismiss={handleDismiss}
          onBack={startOver}
        />
      )}

      {screen === "complete" && (
        <CompletePage
          jurisdiction={jurisdiction}
          issues={issues}
          onDownload={handleDownload}
          onKeepEditing={keepEditing}
          onStartOver={startOver}
        />
      )}
    </div>
  );
}

export default App;
