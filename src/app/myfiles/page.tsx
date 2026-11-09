"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type FileEntry = {
  name: string;
  size: number;
  modifiedAt: string;
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} Go`;
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

export default function MyFilesPage() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/myfiles", { cache: "no-store" });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) {
          setError(data.error ?? "Erreur lors de la récupération des fichiers.");
          setFiles([]);
        } else {
          setFiles(data.files ?? []);
        }
      } catch {
        if (!cancelled) {
          setError("Impossible de contacter le serveur.");
          setFiles([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleDelete(name: string) {
    const confirmed = window.confirm(
      `Supprimer définitivement « ${name} » ?`
    );
    if (!confirmed) return;

    setDeleting(name);
    setError(null);

    try {
      const res = await fetch(
        `/api/myfiles?name=${encodeURIComponent(name)}`,
        { method: "DELETE" }
      );
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data.error ?? "La suppression a échoué.");
        return;
      }

      // Retire le fichier de la liste locale sans refetch.
      setFiles((prev) => prev.filter((f) => f.name !== name));
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setDeleting(null);
    }
  }

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <main className="flex w-full max-w-md flex-col gap-6 rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-900 dark:border dark:border-zinc-800">
        <header className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Mes fichiers</h1>
          <Link
            href="/"
            className="rounded-full bg-zinc-100 px-3.5 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Accueil
          </Link>
        </header>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Fichiers présents dans le dossier <strong>partage/</strong>.
        </p>

        <section className="flex flex-col gap-2">
          {loading && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Chargement…</p>
          )}

          {!loading && error && (
            <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
          )}

          {!loading && !error && files.length === 0 && (
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Aucun fichier disponible.
            </p>
          )}

          {!loading && files.length > 0 && (
            <>
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher un fichier par nom…"
                aria-label="Rechercher un fichier par nom"
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-zinc-800 dark:bg-zinc-800/40 dark:text-zinc-100"
              />
              {files.filter((f) => f.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
                .length === 0 ? (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 py-2">
                  Aucun fichier ne correspond à « {searchQuery.trim()} ».
                </p>
              ) : (
                <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                  {files
                    .filter((f) => f.name.toLowerCase().includes(searchQuery.trim().toLowerCase()))
                    .map((file) => {
                      const isDeleting = deleting === file.name;
                      return (
                  <li
                    key={file.name}
                    className="flex items-center justify-between gap-3 bg-white px-4 py-3 dark:bg-zinc-900"
                  >
                    <div className="flex min-w-0 flex-col">
                      <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">
                        {file.name}
                      </span>
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">
                        {formatSize(file.size)} ·{" "}
                        {new Date(file.modifiedAt).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "2-digit",
                          year: "numeric",
                        })}
                      </span>
                    </div>

                    <div className="flex shrink-0 items-center gap-2">
                      <a
                        href={`/partage/${encodeURIComponent(file.name)}`}
                        className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                        download
                      >
                        Télécharger
                      </a>

                      <button
                        type="button"
                        onClick={() => handleDelete(file.name)}
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
              )}
            </>
          )}
        </section>

        <footer className="flex items-center justify-between border-t border-zinc-100 pt-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <span>Sprint 1</span>
          <Link href="/" className="underline hover:text-zinc-800 dark:hover:text-zinc-200">
            Uploader un fichier
          </Link>
        </footer>
      </main>
    </div>
  );
}
