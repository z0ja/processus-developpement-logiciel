"use client";

import { useState } from "react";

type ShareModalProps = {
  fileName: string;
  shareUrl: string;
  fileId: string;
  initialHasPassword?: boolean;
  onClose: () => void;
  onRevoked: () => void;
  onUpdated?: () => void;
};

export function ShareModal({
  fileName,
  shareUrl,
  fileId,
  initialHasPassword = false,
  onClose,
  onRevoked,
  onUpdated,
}: ShareModalProps) {
  const [copied, setCopied] = useState(false);
  const [revoking, setRevoking] = useState(false);
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [passwordInput, setPasswordInput] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
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

  async function handleSavePassword(e: React.FormEvent) {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setError("Veuillez saisir un mot de passe.");
      return;
    }

    setSavingPassword(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch(`/api/files/${fileId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: passwordInput }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Impossible d'enregistrer le mot de passe.");
        return;
      }
      setHasPassword(Boolean(data.hasPassword));
      setPasswordInput("");
      setFeedback(
        hasPassword
          ? "Mot de passe mis à jour avec succès."
          : "Lien désormais protégé par mot de passe."
      );
      onUpdated?.();
    } catch {
      setError("Erreur réseau lors de l'enregistrement du mot de passe.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleRemovePassword() {
    setSavingPassword(true);
    setError(null);
    setFeedback(null);

    try {
      const res = await fetch(`/api/files/${fileId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Impossible de retirer le mot de passe.");
        return;
      }
      setHasPassword(false);
      setPasswordInput("");
      setFeedback("Protection par mot de passe retirée.");
      onUpdated?.();
    } catch {
      setError("Erreur réseau lors de la suppression du mot de passe.");
    } finally {
      setSavingPassword(false);
    }
  }

  async function handleRevoke() {
    if (!confirm("Voulez-vous vraiment désactiver le lien de partage pour ce fichier ?")) {
      return;
    }
    setRevoking(true);
    setError(null);
    setFeedback(null);
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
          {hasPassword
            ? "Ce lien est protégé par un mot de passe. Le destinataire devra le saisir avant de pouvoir télécharger le fichier."
            : "Toute personne disposant de ce lien peut consulter et télécharger ce fichier sans compte."}
        </p>

        <div className="flex items-center gap-2 mb-5">
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

        <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 mb-4 dark:border-zinc-800 dark:bg-zinc-800/40">
          <div className="flex items-center justify-between gap-2 mb-2.5">
            <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">
              Protection par mot de passe
            </span>
            {hasPassword ? (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-[11px] font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                🔒 Activée
              </span>
            ) : (
              <span className="inline-flex items-center rounded-full bg-zinc-200/80 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
                Désactivée
              </span>
            )}
          </div>

          <form onSubmit={handleSavePassword} className="flex items-center gap-2">
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder={
                hasPassword ? "Nouveau mot de passe…" : "Définir un mot de passe…"
              }
              maxLength={128}
              disabled={savingPassword}
              className="flex-1 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
            />
            <button
              type="submit"
              disabled={savingPassword || !passwordInput.trim()}
              className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
            >
              {savingPassword
                ? "…"
                : hasPassword
                  ? "Modifier"
                  : "Protéger"}
            </button>
          </form>

          {hasPassword && (
            <div className="mt-2 flex justify-end">
              <button
                type="button"
                onClick={handleRemovePassword}
                disabled={savingPassword}
                className="text-[11px] text-zinc-500 hover:text-red-600 hover:underline disabled:opacity-50 dark:text-zinc-400 dark:hover:text-red-400"
              >
                Retirer le mot de passe
              </button>
            </div>
          )}
        </div>

        {feedback && (
          <p className="text-xs text-emerald-600 dark:text-emerald-400 mb-3">
            {feedback}
          </p>
        )}

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
