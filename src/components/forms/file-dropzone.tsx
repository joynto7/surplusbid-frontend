"use client";

import Image from "next/image";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import { LuFileText, LuImagePlus, LuX } from "react-icons/lu";
import { cn } from "@/lib/utils";

/** Object URLs for local previews, revoked when the files change or the component unmounts. */
function usePreviews(files: File[]) {
  const urls = useMemo(() => files.map((f) => (f.type.startsWith("image/") ? URL.createObjectURL(f) : null)), [files]);
  useEffect(
    () => () => {
      for (const u of urls) if (u) URL.revokeObjectURL(u);
    },
    [urls],
  );
  return urls;
}

const formatSize = (bytes: number) =>
  bytes > 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.ceil(bytes / 1024)} KB`;

/**
 * Drag-and-drop file picker with previews. Validation stays in the Zod schema;
 * this only collects files and shows what was chosen.
 */
export function FileDropzone({
  files,
  onChange,
  accept,
  multiple = false,
  max = 1,
  hint,
  invalid,
  disabled,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  accept: string;
  multiple?: boolean;
  max?: number;
  hint?: string;
  invalid?: boolean;
  disabled?: boolean;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = useState(false);
  const previews = usePreviews(files);

  const add = (list: FileList | null) => {
    if (!list) return;
    const incoming = Array.from(list);
    onChange(multiple ? [...files, ...incoming].slice(0, max) : incoming.slice(0, 1));
  };

  return (
    <div className="space-y-3">
      <label
        htmlFor={inputId}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (!disabled) add(e.dataTransfer.files);
        }}
        className={cn(
          "flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed p-6 text-center transition-colors",
          dragging ? "border-primary bg-primary/5" : "hover:bg-muted/50",
          invalid && "border-destructive/60",
          disabled && "pointer-events-none opacity-60",
        )}
      >
        <LuImagePlus className="size-6 text-muted-foreground" aria-hidden />
        <span className="font-medium text-sm">
          Drop {multiple ? "files" : "a file"} here or <span className="text-primary">browse</span>
        </span>
        {hint && <span className="text-muted-foreground text-xs">{hint}</span>}
        <input
          ref={inputRef}
          id={inputId}
          type="file"
          accept={accept}
          multiple={multiple}
          className="sr-only"
          aria-invalid={invalid}
          disabled={disabled}
          onChange={(e) => {
            add(e.target.files);
            e.target.value = "";
          }}
        />
      </label>

      {files.length > 0 && (
        <ul className={cn("grid gap-2", multiple ? "grid-cols-2 sm:grid-cols-3" : "grid-cols-1")}>
          {files.map((file, i) => (
            <li key={`${file.name}-${file.lastModified}-${i}`} className="relative overflow-hidden rounded-lg border">
              {previews[i] ? (
                <div className="relative aspect-4/3 bg-muted">
                  <Image src={previews[i]} alt={file.name} fill unoptimized className="object-cover" />
                  {i === 0 && multiple && (
                    <span className="absolute bottom-1.5 left-1.5 rounded bg-background/90 px-1.5 py-0.5 font-medium text-[10px]">
                      Cover
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex items-center gap-3 p-3">
                  <LuFileText className="size-8 shrink-0 text-primary" aria-hidden />
                  <div className="min-w-0">
                    <p className="truncate font-medium text-sm">{file.name}</p>
                    <p className="text-muted-foreground text-xs">{formatSize(file.size)}</p>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => onChange(files.filter((_, j) => j !== i))}
                aria-label={`Remove ${file.name}`}
                disabled={disabled}
                className="absolute top-1.5 right-1.5 rounded-full bg-background/90 p-1 shadow hover:bg-background"
              >
                <LuX className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
