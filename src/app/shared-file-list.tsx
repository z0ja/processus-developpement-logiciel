"use client";

import { useEffect, useState } from "react";
import { isPreviewable } from "@/lib/file-preview";

type SharedFileItem = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  ownerEmail: string;
  sharedAt: string;
};

// US-C2 / US-C3 : fichiers que d'autres utilisateurs ont partagés avec l'utilisateur connecté.
export function SharedFileList({ refreshTrigger }: { refreshTrigger?: number }) {
  const [files, setFiles] = useState<SharedFileItem[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let ignore = false;
    fetch("/api/shared")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: SharedFileItem[]) => {
        if (!ignore) {
          setFiles(data);
          setError(null);
        }
      })
      .catch(() => {
        if (!ignore) setError("Erreur lors de la récupération des fichiers partagés.");
      });
    return () => {
      ignore = true;
    };
  }, [refreshTrigger]);

  if (error) {
    return <p className="text-xs text-red-600 py-2">{error}</p>;
  }

  if (files === null) {
    return <p className="text-xs text-zinc-500 py-4 text-center">Chargement…</p>;
  }

  if (files.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center text-xs text-zinc-500">
        Aucun fichier partagé avec vous pour l&apos;instant.
      </div>
    );
  }

  const normalizedQuery = searchQuery.trim().toLowerCase();
  const filteredFiles = normalizedQuery
    ? files.filter((file) => file.name.toLowerCase().includes(normalizedQuery))
    : files;

  return (
    <div className="flex flex-col gap-2.5">
      <input
        type="search"
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        placeholder="Rechercher dans les fichiers partagés…"
        aria-label="Rechercher dans les fichiers partagés"
        className="w-full rounded-xl border border-zinc-200 bg-zinc-50/60 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-100"
      />

      {filteredFiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center text-xs text-zinc-500">
          Aucun fichier partagé ne correspond à « {searchQuery.trim()} ».
        </div>
      ) : (
        filteredFiles.map((file) => (
          <div
            key={file.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-zinc-150 bg-zinc-50/60 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-800/40"
          >
            <div className="flex flex-col min-w-0">
              <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">{file.name}</span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 truncate">
                De <strong className="font-medium">{file.ownerEmail}</strong> • {formatSize(file.size)} •{" "}
                {new Date(file.sharedAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              {isPreviewable(file.mimeType, file.name) && (
                <a
                  href={`/api/files/${file.id}/open`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="rounded-lg bg-zinc-200/80 px-2.5 py-1 text-xs font-medium text-zinc-800 transition hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                  title="Ouvrir dans un nouvel onglet"
                >
                  Ouvrir
                </a>
              )}
              <a
                href={`/api/files/${file.id}/download`}
                download={file.name}
                className="rounded-lg bg-zinc-200/80 px-2.5 py-1 text-xs font-medium text-zinc-800 transition hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
              >
                Télécharger
              </a>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}
