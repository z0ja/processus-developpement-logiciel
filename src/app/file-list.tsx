"use client";

import { useEffect, useState, useCallback } from "react";
import { ShareModal } from "./share-modal";
import { isPreviewable } from "@/lib/file-preview";

export type FileItem = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  shareLinks?: Array<{
    id: string;
    token: string;
    createdAt: string;
    expiresAt?: string | null;
    hasPassword?: boolean;
  }>;
  _count?: { shares: number };
};

type FileListProps = {
  refreshTrigger?: number;
};

export function FileList({ refreshTrigger }: FileListProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Fichier dont la modale de partage est ouverte
  const [activeShare, setActiveShare] = useState<FileItem | null>(null);

  const reloadFiles = useCallback(async () => {
    try {
      const res = await fetch("/api/files");
      if (!res.ok) throw new Error("Impossible de charger les fichiers.");
      const data: FileItem[] = await res.json();
      setFiles(data);
    } catch {
      setError("Erreur lors de la récupération des fichiers.");
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    fetch("/api/files")
      .then((res) => {
        if (!res.ok) throw new Error("Impossible de charger les fichiers.");
        return res.json();
      })
      .then((data: FileItem[]) => {
        if (!ignore) {
          setFiles(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!ignore) {
          setError("Erreur lors de la récupération des fichiers.");
          setLoading(false);
        }
      });

    return () => {
      ignore = true;
    };
  }, [refreshTrigger]);

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
    return <p className="text-xs text-zinc-500 py-4 text-center">Chargement des fichiers…</p>;
  }

  // On remplace tout l'écran uniquement si l'erreur empêche d'afficher une liste.
  // Si des fichiers existent, l'erreur est affichée au-dessus de la liste plus bas
  // (sinon un échec de suppression ferait disparaître la liste entière).
  if (error && files.length === 0) {
    return <p className="text-xs text-red-600 py-2">{error}</p>;
  }

  if (files.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 p-6 text-center text-xs text-zinc-500">
        Aucun fichier uploadé pour l&apos;instant.
      </div>
    );
  }

  return (
    <>
      {error && <p className="text-xs text-red-600 py-2">{error}</p>}
      <div className="flex flex-col gap-2">
        {files.map((file) => {
          const latestLink = file.shareLinks?.[0];
          const hasLink = Boolean(latestLink);
          const isPasswordProtected = Boolean(latestLink?.hasPassword);
          const linkExpiresAt = latestLink?.expiresAt ? new Date(latestLink.expiresAt) : null;
          const isLinkExpired = Boolean(linkExpiresAt && linkExpiresAt < new Date());
          const recipientCount = file._count?.shares ?? 0;
          const isDeleting = deletingId === file.id;
          return (
            <div
              key={file.id}
              className="flex items-center justify-between gap-3 rounded-xl border border-zinc-150 bg-zinc-50/60 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-800/40"
            >
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {file.name}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatSize(file.size)} • {new Date(file.createdAt).toLocaleDateString("fr-FR")}
                  {hasLink &&
                    (isLinkExpired ? (
                      <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                        ⚠️ Lien expiré
                      </span>
                    ) : (
                      <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {isPasswordProtected ? "🔒 " : ""}Lien
                        {linkExpiresAt && ` (expire le ${linkExpiresAt.toLocaleDateString("fr-FR")})`}
                      </span>
                    ))}
                  {recipientCount > 0 && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                      {recipientCount} utilisateur{recipientCount > 1 ? "s" : ""}
                    </span>
                  )}
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
                  title="Télécharger directement"
                >
                  Télécharger
                </a>
                <button
                  type="button"
                  onClick={() => setActiveShare(file)}
                  className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-blue-700"
                  title="Partager avec un utilisateur ou par lien"
                >
                  Partager
                </button>
                <button
                  type="button"
                  onClick={() => handleDelete(file)}
                  disabled={isDeleting}
                  aria-label={`Supprimer ${file.name}`}
                  title={`Supprimer ${file.name}`}
                  className="inline-flex items-center justify-center rounded-lg border border-zinc-200 bg-white p-1.5 text-zinc-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:border-red-800 dark:hover:bg-red-950 dark:hover:text-red-400"
                >
                  <TrashIcon />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activeShare && (
        <ShareModal
          fileId={activeShare.id}
          fileName={activeShare.name}
          initialShareUrl={
            activeShare.shareLinks?.[0]
              ? `${window.location.origin}/share/${activeShare.shareLinks[0].token}`
              : null
          }
          initialHasPassword={Boolean(activeShare.shareLinks?.[0]?.hasPassword)}
          initialExpiresAt={activeShare.shareLinks?.[0]?.expiresAt ?? null}
          onClose={() => setActiveShare(null)}
          onChanged={reloadFiles}
        />
      )}
    </>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
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
