"use client";

import { useEffect, useState, useCallback } from "react";
import { ShareModal } from "./share-modal";

export type FileItem = {
  id: string;
  name: string;
  mimeType: string;
  size: number;
  createdAt: string;
  shareLinks?: Array<{ id: string; token: string; createdAt: string }>;
};

type FileListProps = {
  refreshTrigger?: number;
};

export function FileList({ refreshTrigger }: FileListProps) {
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // État de la modal de partage
  const [activeShare, setActiveShare] = useState<{
    fileId: string;
    fileName: string;
    shareUrl: string;
  } | null>(null);

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

  async function handleShare(file: FileItem) {
    try {
      const res = await fetch(`/api/files/${file.id}/share`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) {
        alert(data.error ?? "Erreur lors de la génération du lien.");
        return;
      }
      setActiveShare({
        fileId: file.id,
        fileName: file.name,
        shareUrl: data.shareUrl,
      });
      reloadFiles();
    } catch {
      alert("Erreur réseau lors de la génération du lien.");
    }
  }

  if (loading) {
    return <p className="text-xs text-zinc-500 py-4 text-center">Chargement des fichiers…</p>;
  }

  if (error) {
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
      <div className="flex flex-col gap-2">
        {files.map((file) => {
          const isShared = (file.shareLinks?.length ?? 0) > 0;
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
                  {isShared && (
                    <span className="ml-2 inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                      Partagé
                    </span>
                  )}
                </span>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
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
                  onClick={() => handleShare(file)}
                  className="rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-medium text-white transition hover:bg-blue-700"
                  title="Générer ou copier le lien de partage"
                >
                  Partager
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {activeShare && (
        <ShareModal
          fileId={activeShare.fileId}
          fileName={activeShare.fileName}
          shareUrl={activeShare.shareUrl}
          onClose={() => setActiveShare(null)}
          onRevoked={reloadFiles}
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
