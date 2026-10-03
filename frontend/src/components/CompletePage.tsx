import { CheckCircle2, Download, FilePenLine, MapPin, RotateCcw } from "lucide-react";
import { Issue } from "@/types/issue";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Disclaimer } from "./Disclaimer";

interface CompletePageProps {
  jurisdiction: string;
  issues: Issue[];
  onDownload: () => void;
  onKeepEditing: () => void;
  onStartOver: () => void;
}

interface StatProps {
  label: string;
  value: number;
  tone: string;
}

function Stat({ label, value, tone }: StatProps) {
  return (
    <div className="rounded-xl border bg-card p-5 shadow-sm">
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-semibold tabular-nums ${tone}`}>{value}</p>
    </div>
  );
}

/** Step three: the summary of how every flagged issue was handled, and the download. */
export function CompletePage({ jurisdiction, issues, onDownload, onKeepEditing, onStartOver }: CompletePageProps) {
  const total = issues.length;
  const resolved = issues.filter((i) => i.status === "resolved").length;
  const dismissed = issues.filter((i) => i.status === "dismissed").length;
  const resolvedShare = total === 0 ? 100 : Math.round((resolved / total) * 100);

  return (
    <div className="mx-auto grid w-full max-w-4xl gap-8 px-6 py-12">
      <Card className="overflow-hidden border-emerald-200 shadow-md">
        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 px-8 py-10 text-white">
          <CheckCircle2 className="size-12" />
          <h1 className="mt-4 text-3xl font-semibold tracking-tight">All issues resolved</h1>
          <p className="mt-2 flex items-center gap-1.5 text-emerald-50">
            <MapPin className="size-4" /> Reviewed under the law of {jurisdiction}
          </p>
        </div>

        <CardContent className="grid gap-8 p-8">
          <div className="grid gap-3 sm:grid-cols-3">
            <Stat label="Flagged" value={total} tone="text-foreground" />
            <Stat label="Resolved" value={resolved} tone="text-emerald-600" />
            <Stat label="Dismissed" value={dismissed} tone="text-muted-foreground" />
          </div>

          <div className="grid gap-2">
            <div className="flex items-center justify-between text-sm">
              <span className="font-medium">How the suggestions were handled</span>
              <Badge variant="secondary">{resolvedShare}% accepted or edited</Badge>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-muted" role="img" aria-label="Resolved vs dismissed">
              <div className="bg-emerald-500 transition-[width] duration-700" style={{ width: `${resolvedShare}%` }} />
              <div className="bg-slate-300 transition-[width] duration-700" style={{ width: `${100 - resolvedShare}%` }} />
            </div>
            <div className="flex gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-emerald-500" /> Resolved
              </span>
              <span className="flex items-center gap-1.5">
                <span className="size-2 rounded-full bg-slate-300" /> Dismissed
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <Button size="lg" onClick={onDownload}>
              <Download /> Download updated PDF
            </Button>
            <Button variant="outline" size="lg" onClick={onKeepEditing}>
              <FilePenLine /> Keep editing
            </Button>
            <Button variant="ghost" size="lg" onClick={onStartOver}>
              <RotateCcw /> Review another contract
            </Button>
          </div>
        </CardContent>
      </Card>

      <Disclaimer />
    </div>
  );
}
