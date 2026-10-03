import { useState, DragEvent } from "react";
import { FileUp } from "lucide-react";
import { cn } from "@/lib/utils";

interface DropZoneProps {
  onFileSelected: (file: File) => void;
  disabled: boolean;
}

/** Drag-and-drop or click-to-browse area for a PDF or PNG contract. */
export function DropZone({ onFileSelected, disabled }: DropZoneProps) {
  const [isDragging, setIsDragging] = useState(false);

  function handleDrop(e: DragEvent<HTMLLabelElement>) {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file && !disabled) onFileSelected(file);
  }

  return (
    <label
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors",
        isDragging ? "border-primary bg-accent" : "border-border hover:border-primary/50 hover:bg-muted/60",
        disabled && "pointer-events-none opacity-60"
      )}
    >
      <span className="flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
        <FileUp className="size-5" />
      </span>
      <span className="font-medium">
        {disabled ? "Reading your file..." : "Drop a PDF or PNG here, or click to browse"}
      </span>
      <span className="text-sm text-muted-foreground">Up to 10 MB. Text is extracted so you can edit it.</span>
      <input
        type="file"
        accept="application/pdf,image/png"
        className="sr-only"
        disabled={disabled}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = ""; // allow picking the same file again
          if (file) onFileSelected(file);
        }}
      />
    </label>
  );
}
