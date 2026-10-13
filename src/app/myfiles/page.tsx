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

export default function MyFilesPage() {
  const [files, setFiles] = useState<FileEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

          {!loading && !error && files.length > 0 && (
            <ul className="flex flex-col divide-y divide-zinc-100 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden">
              {files.map((file) => (
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
                  <a
                    href={`/partage/${encodeURIComponent(file.name)}`}
                    className="shrink-0 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700"
                    download
                  >
                    Télécharger
                  </a>
                </li>
              ))}
            </ul>
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