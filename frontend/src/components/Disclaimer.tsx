import { Info } from "lucide-react";

export function Disclaimer() {
  return (
    <div className="flex gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <Info className="mt-0.5 size-4 shrink-0" />
      <p>
        Flag Review does not provide legal advice. It flags wording patterns that may need attention and cannot
        guarantee that any clause is valid or enforceable. Have the final contract reviewed by a licensed attorney in
        the selected jurisdiction.
      </p>
    </div>
  );
}
