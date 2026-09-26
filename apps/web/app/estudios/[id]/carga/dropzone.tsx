"use client";

import { FileSpreadsheet, Loader2, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={disabled || pending} size="lg">
      {pending ? <Loader2 className="h-4 w-4 animate-spin" /> : <UploadCloud className="h-4 w-4" />}
      {pending ? "Procesando archivo…" : "Cargar menciones"}
    </Button>
  );
}

export function Dropzone() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);

  function accept(list: FileList | null) {
    const picked = list?.[0] || null;
    setFile(picked);
    if (picked && input.current && list) {
      input.current.files = list;
    }
  }

  return (
    <div className="space-y-4">
      <label
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(event) => {
          event.preventDefault();
          setDragging(false);
          accept(event.dataTransfer.files);
        }}
        className={cn(
          "relative flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition",
          dragging ? "border-primary bg-primary/10" : "border-line bg-canvas/40 hover:border-primary/40 hover:bg-primary/5",
        )}
      >
        <input
          ref={input}
          name="file"
          type="file"
          required
          accept=".csv,.xlsx,.json,text/csv,application/json"
          className="sr-only"
          onChange={(event) => accept(event.target.files)}
        />
        <span className={cn("flex h-14 w-14 items-center justify-center rounded-2xl border border-line bg-elevated transition", dragging ? "scale-110 text-primary" : "text-muted")}>
          <UploadCloud className="h-6 w-6" />
        </span>
        <p className="mt-4 font-display text-base text-fg">Arrastra tu archivo aquí</p>
        <p className="mt-1 text-sm text-muted">
          o <span className="text-primary underline-offset-2 hover:underline">elígelo de tu equipo</span> · CSV, XLSX o JSON hasta 5 MB
        </p>
      </label>

      {file ? (
        <div className="flex items-center gap-3 rounded-xl border border-line bg-elevated/60 p-3 animate-fade-up">
          <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-pos/15 text-pos">
            <FileSpreadsheet className="h-5 w-5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-fg">{file.name}</p>
            <p className="text-xs text-muted">{(file.size / 1024).toLocaleString("es-MX", { maximumFractionDigits: 1 })} KB</p>
          </div>
          <button
            type="button"
            onClick={() => {
              setFile(null);
              if (input.current) input.current.value = "";
            }}
            className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-fg"
            title="Quitar archivo"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : null}
      <SubmitButton disabled={!file} />
    </div>
  );
}
