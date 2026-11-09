"use client";

import { useState } from "react";

type UploadedFile = { id: string; name: string; size: number };

type Status =
  | { kind: "idle" }
  | { kind: "uploading" }
  | { kind: "success"; file: UploadedFile }
  | { kind: "error"; message: string };

export function UploadForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const input = form.elements.namedItem("file") as HTMLInputElement;
    if (!input.files?.length) {
      setStatus({ kind: "error", message: "Choisissez un fichier." });
      return;
    }

    setStatus({ kind: "uploading" });
    try {
      const response = await fetch("/api/files", { method: "POST", body: new FormData(form) });
      const body = await response.json();
      if (!response.ok) {
        setStatus({ kind: "error", message: body.error ?? "Échec de l'upload." });
        return;
      }
      setStatus({ kind: "success", file: body });
      form.reset();
      onSuccess?.();
    } catch {
      setStatus({ kind: "error", message: "Impossible de joindre le serveur." });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        type="file"
        name="file"
        required
        className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-background"
      />
      <button
        type="submit"
        disabled={status.kind === "uploading"}
        className="h-11 rounded-full bg-foreground px-5 font-medium text-background disabled:opacity-50"
      >
        {status.kind === "uploading" ? "Envoi en cours…" : "Uploader"}
      </button>
      <p role="status" className="text-sm">
        {status.kind === "success" && (
          <span className="text-green-700 dark:text-green-400">
            « {status.file.name} » uploadé ({formatSize(status.file.size)}).
          </span>
        )}
        {status.kind === "error" && (
          <span className="text-red-700 dark:text-red-400">{status.message}</span>
        )}
      </p>
    </form>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
