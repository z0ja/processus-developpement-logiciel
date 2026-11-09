"use client";

import { useState } from "react";

// US-B1 : upload de fichiers.
// US-G1 : plusieurs fichiers peuvent être envoyés d'un coup ; si l'un d'eux porte le
// nom d'un fichier déjà présent, l'utilisateur choisit d'en faire une nouvelle
// version (par défaut) ou de l'ajouter comme un fichier distinct.

type ExistingFile = { id: string; name: string };

// Fichier sélectionné, avec le fichier existant de même nom s'il y en a un.
type PendingUpload = { file: File; existingId: string | null; asNewVersion: boolean };

type Status =
  | { kind: "idle" }
  | { kind: "checking" }
  | { kind: "confirm"; uploads: PendingUpload[] }
  | { kind: "uploading"; done: number; total: number }
  | { kind: "done"; created: number; versioned: number; errors: string[] };

export function UploadForm({ onSuccess }: { onSuccess?: () => void } = {}) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [inputKey, setInputKey] = useState(0);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = event.currentTarget.elements.namedItem("file") as HTMLInputElement;
    const selected = Array.from(input.files ?? []);
    if (selected.length === 0) {
      setStatus({ kind: "done", created: 0, versioned: 0, errors: ["Choisissez un fichier."] });
      return;
    }

    setStatus({ kind: "checking" });
    let existing: ExistingFile[] = [];
    try {
      const res = await fetch("/api/files");
      if (res.ok) existing = await res.json();
    } catch {
      // Sans la liste, on se contente d'uploader de nouveaux fichiers.
    }

    // La liste est triée du plus récent au plus ancien : en cas de doublons déjà
    // présents, la nouvelle version s'applique au plus récent.
    const byName = new Map<string, string>();
    for (const f of existing) if (!byName.has(f.name)) byName.set(f.name, f.id);

    const uploads = selected.map((file) => {
      const existingId = byName.get(file.name.trim()) ?? null;
      return { file, existingId, asNewVersion: existingId !== null };
    });

    if (uploads.some((u) => u.existingId)) {
      setStatus({ kind: "confirm", uploads });
    } else {
      await runUploads(uploads);
    }
  }

  async function runUploads(uploads: PendingUpload[]) {
    let created = 0;
    let versioned = 0;
    const errors: string[] = [];

    for (const [index, upload] of uploads.entries()) {
      setStatus({ kind: "uploading", done: index, total: uploads.length });
      const body = new FormData();
      body.append("file", upload.file);
      const asVersion = upload.asNewVersion && upload.existingId;
      const url = asVersion ? `/api/files/${upload.existingId}/versions` : "/api/files";
      try {
        const response = await fetch(url, { method: "POST", body });
        if (response.ok) {
          if (asVersion) versioned++;
          else created++;
        } else {
          const data = await response.json().catch(() => ({}));
          errors.push(`« ${upload.file.name} » : ${data.error ?? "échec de l'envoi."}`);
        }
      } catch {
        errors.push(`« ${upload.file.name} » : impossible de joindre le serveur.`);
      }
    }

    setStatus({ kind: "done", created, versioned, errors });
    setInputKey((k) => k + 1); // vide le champ fichier
    if (created + versioned > 0) onSuccess?.();
  }

  function toggleVersion(index: number) {
    if (status.kind !== "confirm") return;
    const uploads = status.uploads.map((u, i) =>
      i === index ? { ...u, asNewVersion: !u.asNewVersion } : u
    );
    setStatus({ kind: "confirm", uploads });
  }

  const busy = status.kind === "checking" || status.kind === "uploading";

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <input
        key={inputKey}
        type="file"
        name="file"
        multiple
        required
        disabled={busy || status.kind === "confirm"}
        className="block w-full text-sm file:mr-4 file:rounded-full file:border-0 file:bg-foreground file:px-4 file:py-2 file:text-background"
      />

      {status.kind === "confirm" ? (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-900 dark:bg-amber-950/40">
          <p className="text-amber-900 dark:text-amber-200">
            Certains fichiers existent déjà. Cochez ceux à remplacer par une nouvelle version ;
            les autres seront ajoutés comme fichiers distincts.
          </p>
          <ul className="flex flex-col gap-1.5">
            {status.uploads.map((u, i) =>
              u.existingId ? (
                <li key={i}>
                  <label className="flex items-center gap-2 text-zinc-800 dark:text-zinc-200">
                    <input
                      type="checkbox"
                      checked={u.asNewVersion}
                      onChange={() => toggleVersion(i)}
                    />
                    <span className="truncate">
                      <strong className="font-medium">{u.file.name}</strong> — nouvelle version
                    </span>
                  </label>
                </li>
              ) : null
            )}
          </ul>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => runUploads(status.uploads)}
              className="h-9 flex-1 rounded-full bg-foreground px-4 text-sm font-medium text-background"
            >
              Continuer
            </button>
            <button
              type="button"
              onClick={() => setStatus({ kind: "idle" })}
              className="h-9 rounded-full border border-zinc-300 px-4 text-sm font-medium text-zinc-700 dark:border-zinc-700 dark:text-zinc-300"
            >
              Annuler
            </button>
          </div>
        </div>
      ) : (
        <button
          type="submit"
          disabled={busy}
          className="h-11 rounded-full bg-foreground px-5 font-medium text-background disabled:opacity-50"
        >
          {status.kind === "checking" && "Vérification…"}
          {status.kind === "uploading" && `Envoi en cours… (${status.done + 1}/${status.total})`}
          {!busy && "Uploader"}
        </button>
      )}

      <div role="status" className="text-sm">
        {status.kind === "done" && status.created + status.versioned > 0 && (
          <p className="text-green-700 dark:text-green-400">{summary(status.created, status.versioned)}</p>
        )}
        {status.kind === "done" &&
          status.errors.map((message) => (
            <p key={message} className="text-red-700 dark:text-red-400">
              {message}
            </p>
          ))}
      </div>
    </form>
  );
}

function summary(created: number, versioned: number): string {
  const parts: string[] = [];
  if (created > 0) parts.push(`${created} fichier${created > 1 ? "s" : ""} uploadé${created > 1 ? "s" : ""}`);
  if (versioned > 0)
    parts.push(`${versioned} nouvelle${versioned > 1 ? "s" : ""} version${versioned > 1 ? "s" : ""}`);
  return parts.join(", ") + ".";
}
