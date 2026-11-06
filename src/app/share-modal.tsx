"use client";

import { useEffect, useState } from "react";

type ShareModalProps = {
  fileId: string;
  fileName: string;
  /** URL du lien de partage existant (US-C1), ou `null` s'il n'y en a pas. */
  initialShareUrl: string | null;
  /** Le lien existant est-il protégé par mot de passe (US-D2) ? */
  initialHasPassword?: boolean;
  /** Date d'expiration du lien existant (US-D1), au format ISO, ou `null`. */
  initialExpiresAt?: string | null;
  onClose: () => void;
  /** Appelé après toute modification du partage (lien ou destinataires). */
  onChanged: () => void;
};

type Recipient = {
  id: string;
  createdAt: string;
  recipient: { id: string; email: string };
};

const sectionTitleClassName = "text-sm font-semibold text-zinc-900 dark:text-zinc-100";
const primaryButtonClassName =
  "rounded-xl bg-blue-600 px-4 py-2 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50";
const inputClassName =
  "flex-1 min-w-0 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-800 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200";

export function ShareModal({
  fileId,
  fileName,
  initialShareUrl,
  initialHasPassword = false,
  initialExpiresAt = null,
  onClose,
  onChanged,
}: ShareModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-modal-title"
    >
      <div className="w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl dark:bg-zinc-900 dark:border dark:border-zinc-800">
        <div className="flex items-start justify-between gap-2 mb-5">
          <div className="min-w-0">
            <h2
              id="share-modal-title"
              className="text-lg font-semibold tracking-tight text-zinc-900 dark:text-zinc-100"
            >
              Partager
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 truncate mt-0.5">{fileName}</p>
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

        <UserShareSection fileId={fileId} onChanged={onChanged} />

        <div className="my-5 border-t border-zinc-100 dark:border-zinc-800" />

        <LinkShareSection
          fileId={fileId}
          initialShareUrl={initialShareUrl}
          initialHasPassword={initialHasPassword}
          initialExpiresAt={initialExpiresAt}
          onChanged={onChanged}
        />

        <div className="flex justify-end border-t border-zinc-100 pt-4 mt-5 dark:border-zinc-800">
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

// US-C2 : partage direct avec un autre utilisateur du service, désigné par son email.
function UserShareSection({ fileId, onChanged }: { fileId: string; onChanged: () => void }) {
  const [recipients, setRecipients] = useState<Recipient[] | null>(null);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    fetch(`/api/files/${fileId}/shares`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data: Recipient[]) => {
        if (!ignore) setRecipients(data);
      })
      .catch(() => {
        if (!ignore) {
          setRecipients([]);
          setError("Impossible de charger la liste des destinataires.");
        }
      });
    return () => {
      ignore = true;
    };
  }, [fileId]);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/files/${fileId}/shares`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Échec du partage.");
        return;
      }
      setRecipients((prev) => [...(prev ?? []), data as Recipient]);
      setSuccess(`Fichier partagé avec ${data.recipient.email}.`);
      setEmail("");
      onChanged();
    } catch {
      setError("Erreur réseau lors du partage.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRemove(share: Recipient) {
    if (!confirm(`Retirer l'accès de ${share.recipient.email} à ce fichier ?`)) return;
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/files/${fileId}/shares/${share.recipient.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Échec du retrait du partage.");
        return;
      }
      setRecipients((prev) => (prev ?? []).filter((r) => r.id !== share.id));
      onChanged();
    } catch {
      setError("Erreur réseau lors du retrait du partage.");
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className={sectionTitleClassName}>Avec un utilisateur du service</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Le fichier apparaîtra dans ses « Fichiers partagés avec moi ».
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@exemple.fr"
          aria-label="Email du destinataire"
          className={inputClassName}
        />
        <button type="submit" disabled={submitting || !email.trim()} className={primaryButtonClassName}>
          {submitting ? "Partage…" : "Partager"}
        </button>
      </form>

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      {success && <p className="text-xs text-green-700 dark:text-green-400">{success}</p>}

      {recipients === null ? (
        <p className="text-xs text-zinc-500">Chargement…</p>
      ) : recipients.length === 0 ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Partagé avec personne pour l&apos;instant.</p>
      ) : (
        <ul className="flex flex-col gap-1.5">
          {recipients.map((share) => (
            <li
              key={share.id}
              className="flex items-center justify-between gap-2 rounded-lg bg-zinc-50 px-3 py-1.5 text-xs dark:bg-zinc-800/60"
            >
              <span className="truncate text-zinc-800 dark:text-zinc-200">{share.recipient.email}</span>
              <button
                type="button"
                onClick={() => handleRemove(share)}
                className="shrink-0 text-red-600 hover:underline dark:text-red-400"
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

// US-C1 : lien de partage public (généré à la demande).
// US-D2 : protection facultative du lien par mot de passe.
// US-D1 : date d'expiration facultative du lien.
function LinkShareSection({
  fileId,
  initialShareUrl,
  initialHasPassword,
  initialExpiresAt,
  onChanged,
}: {
  fileId: string;
  initialShareUrl: string | null;
  initialHasPassword: boolean;
  initialExpiresAt: string | null;
  onChanged: () => void;
}) {
  const [shareUrl, setShareUrl] = useState(initialShareUrl);
  const [hasPassword, setHasPassword] = useState(initialHasPassword);
  const [expiresAt, setExpiresAt] = useState<string | null>(initialExpiresAt);
  const isExpired = Boolean(expiresAt && new Date(expiresAt) < new Date());
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerate() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/files/${fileId}/share`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Erreur lors de la génération du lien.");
        return;
      }
      setShareUrl(data.shareUrl);
      setHasPassword(Boolean(data.hasPassword));
      setExpiresAt(data.expiresAt ?? null);
      onChanged();
    } catch {
      setError("Erreur réseau lors de la génération du lien.");
    } finally {
      setBusy(false);
    }
  }

  async function handleCopy() {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setError("Impossible de copier automatiquement dans le presse-papier.");
    }
  }

  async function handleRevoke() {
    if (!confirm("Voulez-vous vraiment désactiver le lien de partage pour ce fichier ?")) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/files/${fileId}/share`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Échec de la révocation.");
        return;
      }
      setShareUrl(null);
      setHasPassword(false);
      setExpiresAt(null);
      onChanged();
    } catch {
      setError("Erreur réseau lors de la révocation.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h3 className={sectionTitleClassName}>Par lien public</h3>
        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          {shareUrl && isExpired
            ? "Ce lien a expiré. Définissez une nouvelle date d'expiration pour le réactiver."
            : shareUrl && hasPassword
              ? "Le lien est protégé : le mot de passe sera demandé avant le téléchargement."
              : "Toute personne disposant du lien peut télécharger le fichier, sans compte."}
        </p>
      </div>

      {shareUrl ? (
        <>
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={shareUrl}
              aria-label="Lien de partage"
              onClick={(e) => (e.target as HTMLInputElement).select()}
              className={`${inputClassName} font-mono`}
            />
            <button type="button" onClick={handleCopy} className={primaryButtonClassName}>
              {copied ? "✓ Copié !" : "Copier"}
            </button>
          </div>
          <LinkPasswordForm
            fileId={fileId}
            hasPassword={hasPassword}
            onPasswordChange={(value) => {
              setHasPassword(value);
              onChanged();
            }}
          />
          <LinkExpirationForm
            fileId={fileId}
            expiresAt={expiresAt}
            onExpirationChange={(value) => {
              setExpiresAt(value);
              onChanged();
            }}
          />
          <button
            type="button"
            onClick={handleRevoke}
            disabled={busy}
            className="self-start text-xs text-red-600 hover:underline disabled:opacity-50 dark:text-red-400"
          >
            {busy ? "Révocation…" : "Désactiver le lien"}
          </button>
        </>
      ) : (
        <button
          type="button"
          onClick={handleGenerate}
          disabled={busy}
          className="self-start rounded-xl bg-zinc-100 px-4 py-2 text-xs font-medium text-zinc-800 transition hover:bg-zinc-200 disabled:opacity-50 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700"
        >
          {busy ? "Génération…" : "Générer un lien"}
        </button>
      )}

      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
    </section>
  );
}

// US-D2 : définir, modifier ou retirer le mot de passe du lien de partage.
function LinkPasswordForm({
  fileId,
  hasPassword,
  onPasswordChange,
}: {
  fileId: string;
  hasPassword: boolean;
  onPasswordChange: (hasPassword: boolean) => void;
}) {
  const [passwordInput, setPasswordInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function updatePassword(password: string | null) {
    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await fetch(`/api/files/${fileId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Impossible de mettre à jour le mot de passe.");
        return;
      }
      const nowProtected = Boolean(data.hasPassword);
      setPasswordInput("");
      setFeedback(
        !nowProtected
          ? "Protection par mot de passe retirée."
          : hasPassword
            ? "Mot de passe mis à jour avec succès."
            : "Lien désormais protégé par mot de passe."
      );
      onPasswordChange(nowProtected);
    } catch {
      setError("Erreur réseau lors de la mise à jour du mot de passe.");
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!passwordInput.trim()) {
      setError("Veuillez saisir un mot de passe.");
      return;
    }
    updatePassword(passwordInput);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
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

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="password"
          value={passwordInput}
          onChange={(e) => setPasswordInput(e.target.value)}
          placeholder={hasPassword ? "Nouveau mot de passe…" : "Définir un mot de passe…"}
          aria-label="Mot de passe du lien"
          maxLength={128}
          disabled={saving}
          className="flex-1 min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={saving || !passwordInput.trim()}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving ? "…" : hasPassword ? "Modifier" : "Protéger"}
        </button>
      </form>

      {hasPassword && (
        <div className="mt-2 flex justify-end">
          <button
            type="button"
            onClick={() => updatePassword(null)}
            disabled={saving}
            className="text-[11px] text-zinc-500 hover:text-red-600 hover:underline disabled:opacity-50 dark:text-zinc-400 dark:hover:text-red-400"
          >
            Retirer le mot de passe
          </button>
        </div>
      )}

      {feedback && <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{feedback}</p>}
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}

const quickExpirationButtonClassName =
  "rounded-md bg-white border border-zinc-200 px-2 py-1 text-[11px] font-medium text-zinc-700 hover:bg-zinc-100 disabled:opacity-50 dark:bg-zinc-900 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800";

const HOUR_MS = 60 * 60 * 1000;
const QUICK_EXPIRATIONS = [
  { label: "+1 h", ms: HOUR_MS },
  { label: "+24 h", ms: 24 * HOUR_MS },
  { label: "+7 j", ms: 7 * 24 * HOUR_MS },
  { label: "+30 j", ms: 30 * 24 * HOUR_MS },
];

// US-D1 : définir, modifier ou retirer la date d'expiration du lien de partage.
function LinkExpirationForm({
  fileId,
  expiresAt,
  onExpirationChange,
}: {
  fileId: string;
  expiresAt: string | null;
  onExpirationChange: (expiresAt: string | null) => void;
}) {
  const [customDateTime, setCustomDateTime] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [minDateTime] = useState(() => new Date(Date.now() + 60000).toISOString().slice(0, 16));

  const isExpired = Boolean(expiresAt && new Date(expiresAt) < new Date());

  async function updateExpiration(targetDate: Date | null) {
    setSaving(true);
    setError(null);
    setFeedback(null);
    try {
      const res = await fetch(`/api/files/${fileId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expiresAt: targetDate ? targetDate.toISOString() : null }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Impossible de modifier la date d'expiration.");
        return;
      }
      setCustomDateTime("");
      setFeedback(
        data.expiresAt
          ? `Date d'expiration définie au ${new Date(data.expiresAt).toLocaleString("fr-FR", { dateStyle: "short", timeStyle: "short" })}.`
          : "Date d'expiration retirée (lien permanent)."
      );
      onExpirationChange(data.expiresAt ?? null);
    } catch {
      setError("Erreur réseau lors de la modification de l'expiration.");
    } finally {
      setSaving(false);
    }
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!customDateTime) {
      setError("Veuillez sélectionner une date et heure.");
      return;
    }
    const chosen = new Date(customDateTime);
    if (Number.isNaN(chosen.getTime()) || chosen.getTime() <= Date.now()) {
      setError("Veuillez choisir une date future.");
      return;
    }
    updateExpiration(chosen);
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3.5 dark:border-zinc-800 dark:bg-zinc-800/40">
      <div className="flex items-center justify-between gap-2 mb-2.5">
        <span className="text-xs font-medium text-zinc-800 dark:text-zinc-200">Date d&apos;expiration</span>
        {isExpired ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700 dark:bg-red-950 dark:text-red-300">
            ⚠️ Expiré
          </span>
        ) : expiresAt ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-[11px] font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            ⏱️ {new Date(expiresAt).toLocaleDateString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-zinc-200/80 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-700 dark:text-zinc-300">
            Désactivée (illimité)
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-1.5 mb-2.5">
        {QUICK_EXPIRATIONS.map(({ label, ms }) => (
          <button
            key={label}
            type="button"
            disabled={saving}
            onClick={() => updateExpiration(new Date(Date.now() + ms))}
            className={quickExpirationButtonClassName}
          >
            {label}
          </button>
        ))}
        {expiresAt && (
          <button
            type="button"
            disabled={saving}
            onClick={() => updateExpiration(null)}
            className={`${quickExpirationButtonClassName} hover:text-red-600 dark:hover:text-red-400`}
          >
            Sans limite
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <input
          type="datetime-local"
          value={customDateTime}
          min={minDateTime}
          onChange={(e) => setCustomDateTime(e.target.value)}
          aria-label="Date d'expiration personnalisée"
          disabled={saving}
          className="flex-1 min-w-0 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-xs text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
        />
        <button
          type="submit"
          disabled={saving || !customDateTime}
          className="rounded-lg bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-zinc-800 disabled:opacity-50 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {saving ? "…" : "Définir"}
        </button>
      </form>

      {feedback && <p className="mt-2 text-xs text-emerald-600 dark:text-emerald-400">{feedback}</p>}
      {error && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  );
}
