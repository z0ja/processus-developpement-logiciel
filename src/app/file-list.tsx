"use client";

import { useEffect, useState, useCallback } from "react";
import { ShareModal } from "./share-modal";
import { TextEditorModal } from "./text-editor-modal";
import { isEditableText, isPreviewable } from "@/lib/file-preview";

export type FileItem = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  updatedAt?: string;
  version?: number; // US-G1
  shareLinks?: Array<{
    id: string;
    token: string;
    createdAt: string;
    expiresAt?: string | null;
    hasPassword?: boolean;
    maxDownloads?: number | null;
    downloadCount?: number;
  }>;
  _count?: { fileShares: number };
};

type FileListProps = {
  refreshTrigger?: number;
};

export function FileList({ refreshTrigger }: FileListProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Fichier dont la modale de partage est ouverte
  const [activeShare, setActiveShare] = useState<FileItem | null>(null);
  // US-G1 : fichier texte ouvert dans l'éditeur
  const [activeEdit, setActiveEdit] = useState<FileItem | null>(null);

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

  // US-B4 : suppression d'un fichier par son propriétaire.
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

  // US-G1 : publication d'une nouvelle version d'un fichier existant.
  async function handleNewVersion(file: FileItem, upload: File) {
    setUpdatingId(file.id);
    setError(null);
    setNotice(null);
    try {
      const body = new FormData();
      body.append("file", upload);
      const res = await fetch(`/api/files/${file.id}/versions`, { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "La modification a échoué.");
        return;
      }
      setNotice(`« ${data.name} » mis à jour (version ${data.version}).`);
      await reloadFiles();
    } catch {
      setError("Impossible de contacter le serveur.");
    } finally {
      setUpdatingId(null);
    }
  }

  if (loading) {
    return <p className="text-xs text-zinc-500 py-4 text-center">Chargement des fichiers…</p>;
  }

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
      {notice && <p className="text-xs text-green-700 dark:text-green-400 py-2">{notice}</p>}
      <div className="flex flex-col gap-2">
        {files.map((file) => {
          const latestLink = file.shareLinks?.[0];
          const hasLink = Boolean(latestLink);
          const isPasswordProtected = Boolean(latestLink?.hasPassword);
          const linkExpiresAt = latestLink?.expiresAt ? new Date(latestLink.expiresAt) : null;
          const isLinkExpired = Boolean(linkExpiresAt && linkExpiresAt < new Date());

          const maxDownloads = latestLink?.maxDownloads ?? null;
          const downloadCount = latestLink?.downloadCount ?? 0;
          const isLinkExhausted =
            maxDownloads !== null && downloadCount >= maxDownloads;

          const recipientCount = file._count?.fileShares ?? 0;
          const isDeleting = deletingId === file.id;
          const isUpdating = updatingId === file.id;
          const version = file.version ?? 1;
          return (
            <div
              key={file.id}
              className="flex flex-col gap-2 rounded-xl border border-zinc-150 bg-zinc-50/60 p-3 text-sm dark:border-zinc-800 dark:bg-zinc-800/40"
            >
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate">
                  {file.name}
                </span>
                <span className="text-xs text-zinc-500 dark:text-zinc-400">
                  {formatSize(file.size)} •{" "}
                  {version > 1 && file.updatedAt
                    ? `modifié le ${new Date(file.updatedAt).toLocaleDateString("fr-FR")}`
                    : new Date(file.createdAt).toLocaleDateString("fr-FR")}
                  {version > 1 && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      v{version}
                    </span>
                  )}
                  {hasLink &&
                    (isLinkExpired ? (
                      <span className="ml-2 inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
                        ⚠️ Lien expiré
                      </span>
                    ) : isLinkExhausted ? (
                      <span className="ml-2 inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-[10px] font-medium text-orange-700 dark:bg-orange-950 dark:text-orange-300">
                        ⛔ Quota épuisé
                      </span>
                    ) : (
                      <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                        {isPasswordProtected ? "🔒 " : ""}Lien
                        {linkExpiresAt && ` (expire le ${linkExpiresAt.toLocaleDateString("fr-FR")})`}
                        {maxDownloads !== null &&
                          ` · ${downloadCount}/${maxDownloads} téléch.`}
                      </span>
                    ))}
                  {recipientCount > 0 && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-[10px] font-medium text-violet-700 dark:bg-violet-950 dark:text-violet-300">
                      {recipientCount} utilisateur{recipientCount > 1 ? "s" : ""}
                    </span>
                  )}
                </span>
              </div>

              <div className="flex flex-wrap items-center gap-1.5">
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
                {isEditableText(file.mimeType, file.name, file.size) ? (
                  <button
                    type="button"
                    onClick={() => setActiveEdit(file)}
                    className="rounded-lg bg-zinc-200/80 px-2.5 py-1 text-xs font-medium text-zinc-800 transition hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600"
                    title="Modifier le contenu dans l'éditeur"
                  >
                    Modifier
                  </button>
                ) : (
                  <label
                    className={`rounded-lg bg-zinc-200/80 px-2.5 py-1 text-xs font-medium text-zinc-800 transition hover:bg-zinc-300 dark:bg-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-600 ${
                      isUpdating ? "pointer-events-none opacity-50" : "cursor-pointer"
                    }`}
                    title="Remplacer par une nouvelle version (upload)"
                  >
                    {isUpdating ? "Envoi…" : "Remplacer"}
                    <input
                      type="file"
                      className="sr-only"
                      disabled={isUpdating}
                      aria-label={`Nouvelle version de ${file.name}`}
                      onChange={(event) => {
                        const upload = event.target.files?.[0];
                        event.target.value = "";
                        if (upload) handleNewVersion(file, upload);
                      }}
                    />
                  </label>
                )}
                <button
                  type="button"
                  onClick={() => setActiveShare(file)}
                  className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-blue-700"
                  title="Partager avec un utilisateur ou par lien"
                >
                  Partager
                </button>
                {/* US-B4 : bouton poubelle */}
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
          initialMaxDownloads={activeShare.shareLinks?.[0]?.maxDownloads ?? null}
          initialDownloadCount={activeShare.shareLinks?.[0]?.downloadCount ?? 0}
          onClose={() => setActiveShare(null)}
          onChanged={reloadFiles}
        />
      )}

      {activeEdit && (
        <TextEditorModal
          fileId={activeEdit.id}
          fileName={activeEdit.name}
          mimeType={activeEdit.mimeType}
          version={activeEdit.version ?? 1}
          onClose={() => setActiveEdit(null)}
          onSaved={reloadFiles}
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
