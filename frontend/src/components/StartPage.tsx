import { useEffect, useState } from "react";
import { ArrowRight, Link2, Loader2, PenLine, Scale, Sparkles } from "lucide-react";
import { getJurisdictions } from "@/api/jurisdictions";
import { extractTextFromFile } from "@/api/extract";
import { Jurisdiction } from "@/types/issue";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "./Disclaimer";
import { DropZone } from "./DropZone";
import { JurisdictionSelect } from "./JurisdictionSelect";

export interface ContractSubmission {
  text: string;
  country: string;
  region: string;
}

interface StartPageProps {
  onSubmit: (submission: ContractSubmission) => void;
  isLoading: boolean;
  error: string | null;
}

const CHECKS = [
  { icon: Scale, title: "Enforceability", body: "Wording that may be weak or hard to enforce under local law." },
  { icon: PenLine, title: "Precision", body: "Vague deadlines, undefined terms, and loosely defined duties." },
  { icon: Link2, title: "Consistency", body: "Names and terms that drift between sections of the contract." },
];

/** Step one of the flow: pick a jurisdiction, then add the contract by upload or paste. */
export function StartPage({ onSubmit, isLoading, error }: StartPageProps) {
  const [text, setText] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [jurisdictions, setJurisdictions] = useState<Jurisdiction[]>([]);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [isReadingFile, setIsReadingFile] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  useEffect(() => {
    getJurisdictions()
      .then(setJurisdictions)
      .catch((err: Error) => setLoadError(err.message));
  }, []);

  function handleCountryChange(next: string) {
    setCountry(next);
    setRegion("");
  }

  async function handleFileSelected(file: File) {
    setIsReadingFile(true);
    setUploadError(null);
    try {
      setText(await extractTextFromFile(file));
    } catch (err) {
      setUploadError(err instanceof Error ? err.message : "Failed to read text from the file.");
    } finally {
      setIsReadingFile(false);
    }
  }

  const canSubmit = !isLoading && !isReadingFile && text.trim().length > 0 && country !== "" && region !== "";
  const shownError = error ?? uploadError ?? loadError;

  return (
    <div className="mx-auto grid w-full max-w-6xl gap-8 px-6 py-12 lg:grid-cols-[1fr_340px]">
      <section className="grid gap-6">
        <div className="grid gap-3">
          <Badge variant="secondary" className="w-fit">
            Contract review · United States &amp; Canada
          </Badge>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Review a contract against your local law
          </h1>
          <p className="max-w-2xl text-muted-foreground">
            Choose where the contract is governed, add the text, and work through the flagged wording one suggestion at
            a time.
          </p>
        </div>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>1. Jurisdiction</CardTitle>
            <CardDescription>The law the contract will be reviewed under.</CardDescription>
          </CardHeader>
          <CardContent>
            <JurisdictionSelect
              jurisdictions={jurisdictions}
              country={country}
              region={region}
              onCountryChange={handleCountryChange}
              onRegionChange={setRegion}
            />
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle>2. Contract</CardTitle>
            <CardDescription>Upload a PDF or PNG, or paste the text directly.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4">
            <DropZone onFileSelected={handleFileSelected} disabled={isReadingFile} />

            <div className="flex items-center gap-3 text-xs uppercase tracking-wide text-muted-foreground">
              <span className="h-px flex-1 bg-border" />
              or paste text
              <span className="h-px flex-1 bg-border" />
            </div>

            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="Paste the full text of your contract here..."
              rows={10}
              className="min-h-56 resize-y font-serif text-[15px] leading-relaxed"
            />
            <div className="flex justify-end text-xs text-muted-foreground">
              {text.trim().split(/\s+/).filter(Boolean).length} words
            </div>
          </CardContent>
        </Card>

        {shownError && (
          <p role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
            {shownError}
          </p>
        )}

        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-sm text-muted-foreground">
            {canSubmit ? "Ready to review." : "Select a jurisdiction and add contract text to continue."}
          </p>
          <Button size="lg" disabled={!canSubmit} onClick={() => onSubmit({ text, country, region })}>
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" /> Reviewing contract...
              </>
            ) : (
              <>
                Review contract <ArrowRight />
              </>
            )}
          </Button>
        </div>
      </section>

      <aside className="grid content-start gap-4">
        <Card className="bg-muted/40 shadow-none">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Sparkles className="size-4 text-primary" /> What we check
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-5">
            {CHECKS.map(({ icon: Icon, title, body }) => (
              <div key={title} className="flex gap-3">
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-background text-primary shadow-sm">
                  <Icon className="size-4" />
                </span>
                <div>
                  <p className="font-medium">{title}</p>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Disclaimer />
      </aside>
    </div>
  );
}
