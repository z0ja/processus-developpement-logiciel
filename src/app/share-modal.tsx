"use client";

import { useState } from "react";

type ShareModalProps = {
  fileName: string;
  shareUrl: string;
  fileId: string;
  onClose: () => void;
  onRevoked: () => void;
};

export function ShareModal({
  fileName,
  shareUrl,
  fileId,
  onClose,
  onRevoked,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Impossible de copier automatiquement dans le presse-papier.");
    }
  }

  async function handleRevoke() {
    if (!confirm("Voulez-vous vraiment désactiver le lien de partage pour ce fichier ?")) {
      return;
    }
    setRevoking(true);
    setError(null);
    try {
      const res = await fetch(`/api/files/${fileId}/share`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Échec de la révocation.");
        return;
      }
      onRevoked();
      onClose();
    } catch {
      setError("Erreur réseau lors de la révocation.");
    } finally {
      setRevoking(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
    >
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 dark:border dark:border-zinc-800">
        <div className="flex items-start justify-between gap-2 mb-4">
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
              Lien de partage
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate max-w-xs mt-0.5">
              {fileName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-1.5 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            aria-label="Fermer"
          >
            ✕
          </button>
        </div>

        <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
          Toute personne disposant de ce lien peut consulter et télécharger ce fichier sans compte.
        </p>

        <div className="flex items-center gap-2 mb-4">
          <input
            type="text"
            readOnly
            value={shareUrl}
            onClick={(e) => (e.target as HTMLInputElement).select()}
            className="flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-800 font-mono focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          />
          <button
            type="button"
            onClick={handleCopy}
            className="rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700"
          >
            {copied ? "✓ Copié !" : "Copier"}
          </button>
        </div>

        {error && (
          <p className="text-xs text-red-600 dark:text-red-400 mb-3">{error}</p>
        )}

        <div className="flex items-center justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <button
            type="button"
            onClick={handleRevoke}
            disabled={revoking}
            className="text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
          >
            {revoking ? "Révocation…" : "Désactiver le lien"}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full bg-zinc-100 px-4 py-1.5 text-xs font-medium text-zinc-800 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
          >
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}

