"use client";

import { useCallback, useEffect, useState } from "react";

type ShareLink = { id: string; token: string; createdAt: string };

type FileItem = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  shareLinks: ShareLink[];
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`;
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function TrashIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M3 6h18" />
      <path d="M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

export function FileList({ refreshTrigger }: { refreshTrigger: number }) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/files", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? "Erreur lors du chargement.");
        setFiles([]);
        return;
      }
      setFiles(data);
    } catch {
      setError("Impossible de contacter le serveur.");
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load, refreshTrigger]);

  async function handleDelete(file: FileItem) {
    if (!window.confirm(`Supprimer définitivement « ${file.name} » ?`)) return;
    setDeletingId(file.id);
    setError(null);
    try {
      const res = await fetch(`/api/files?id=${encodeURIComponent(file.id)}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "La suppression a échoué.");
        return;
      }
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setDeletingId(null);
    }
  }

  if (loading) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Chargement…</p>;
  }

  if (error && files.length === 0) {
    return <p className="text-sm text-red-600 dark:text-red-400">{error}</p>;
  }

  if (files.length === 0) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">
        Aucun fichier pour le moment.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
        {files.map((file) => {
          const isDeleting = deletingId === file.id;
          return (
            <li
              key={file.id}
              className="flex items-center justify-between gap-3 bg-white px-4 py-3 dark:bg-zinc-900"
            >
              <div className="flex min-w-0 flex-col">
                <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                  {file.name}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatSize(file.size)} · {formatDate(file.createdAt)}
                </span>
              </div>

              <div className="flex shrink-0 items-center gap-2">
                <a
                  href={`/api/files/${encodeURIComponent(file.id)}/download`}
                  className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                  download
                >
                  Télécharger
                </a>

                {/* bouton partage existant (US-C1) : à conserver tel quel */}

                <button
                  type="button"
                  onClick={() => handleDelete(file)}
                  disabled={isDeleting}
                  aria-label={`Supprimer ${file.name}`}
                  title={`Supprimer ${file.name}`}
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-2 text-zinc-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-red-800 dark:hover:bg-red-950 dark:hover:text-red-400"
                >
                  <TrashIcon />
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
