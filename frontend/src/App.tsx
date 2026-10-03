import { useEffect, useRef, useState } from "react";
import { Scale } from "lucide-react";
import { acceptIssue, analyzeDocument, dismissIssue, saveText } from "@/api/documents";
import { ContractSubmission, StartPage } from "@/components/StartPage";
import { ReviewPage, SaveState } from "@/components/ReviewPage";
import { CompletePage } from "@/components/CompletePage";
import { DocumentResponse, Issue } from "@/types/issue";

type Screen = "start" | "review" | "complete";

const SAVE_DELAY_MS = 700;

const firstPending = (issues: Issue[]) => issues.find((i) => i.status === "pending") ?? null;

function App() {
  const [screen, setScreen] = useState<Screen>("start");
  const [doc, setDoc] = useState<DocumentResponse | null>(null);
  const [draftText, setDraftText] = useState("");
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("saved");
  const [isLoading, setIsLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // The latest draft lives in a ref so the delayed save always sends what the user last typed.
  const draftRef = useRef("");
  const saveTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(saveTimer.current), []);

  /** Saves the current draft and refreshes the issue offsets it changed. */
  async function saveDraft(documentId: string) {
    window.clearTimeout(saveTimer.current);
    const sentText = draftRef.current;
    setSaveState("saving");
    const result = await saveText(documentId, sentText);
    setDoc((prev) => (prev ? { ...prev, issues: result.issues } : prev));
    // Only mark saved if the user did not type again while the request was in flight.
    if (draftRef.current === sentText) setSaveState("saved");
  }

  function handleTextChange(text: string) {
    draftRef.current = text;
    setDraftText(text);
    setSaveState("unsaved");
    window.clearTimeout(saveTimer.current);
    saveTimer.current = window.setTimeout(() => {
      if (doc) saveDraft(doc.documentId).catch(() => setSaveState("unsaved"));
    }, SAVE_DELAY_MS);
  }

  async function handleReview({ text, country, region }: ContractSubmission) {
    setIsLoading(true);
    setError(null);
    try {
      const result = await analyzeDocument(text, country, region);
      setDoc(result);
      setDraftText(result.text);
      draftRef.current = result.text;
      setSaveState("saved");
      setActiveIssueId(firstPending(result.issues)?._id ?? null);
      setScreen(firstPending(result.issues) ? "review" : "complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  }

  /** Accepts or dismisses an issue. Unsaved edits are saved first so the offsets match the server text. */
  async function handleIssueAction(issueId: string, action: "accept" | "dismiss") {
    if (!doc) return;
    setBusy(true);
    setError(null);
    try {
      if (saveState !== "saved") await saveDraft(doc.documentId);
      const result =
        action === "accept"
          ? await acceptIssue(doc.documentId, issueId)
          : await dismissIssue(doc.documentId, issueId);

      setDoc(result);
      setDraftText(result.text);
      draftRef.current = result.text;
      setSaveState("saved");

      const next = firstPending(result.issues);
      setActiveIssueId(next?._id ?? null);
      if (!next) setScreen("complete");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update the issue.");
    } finally {
      setBusy(false);
    }
  }

  function startOver() {
    window.clearTimeout(saveTimer.current);
    setDoc(null);
    setDraftText("");
    draftRef.current = "";
    setActiveIssueId(null);
    setSaveState("saved");
    setError(null);
    setScreen("start");
  }

  function keepEditing() {
    if (!doc) return;
    setActiveIssueId(firstPending(doc.issues)?._id ?? null);
    setScreen("review");
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-20 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center gap-2.5 px-6 py-3.5">
          <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Scale className="size-4" />
          </span>
          <span className="font-semibold tracking-tight">Flag Review</span>
        </div>
      </header>

      {error && screen !== "start" && (
        <p role="alert" className="mx-auto mt-4 max-w-7xl rounded-lg border border-red-200 bg-red-50 px-6 py-3 text-sm text-red-800">
          {error}
        </p>
      )}

      {screen === "start" && <StartPage onSubmit={handleReview} isLoading={isLoading} error={error} />}

      {screen === "review" && doc && (
        <ReviewPage
          jurisdiction={doc.jurisdiction}
          draftText={draftText}
          issues={doc.issues}
          activeIssueId={activeIssueId}
          saveState={saveState}
          busy={busy}
          onTextChange={handleTextChange}
          onSelectIssue={setActiveIssueId}
          onAccept={(id) => handleIssueAction(id, "accept")}
          onDismiss={(id) => handleIssueAction(id, "dismiss")}
          onBack={startOver}
        />
      )}

      {screen === "complete" && doc && (
        <CompletePage
          documentId={doc.documentId}
          jurisdiction={doc.jurisdiction}
          issues={doc.issues}
          onKeepEditing={keepEditing}
          onStartOver={startOver}
        />
      )}
    </div>
  );
}

export default App;
