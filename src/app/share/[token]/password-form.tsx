"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function SharePasswordForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!password) {
      setError("Veuillez saisir le mot de passe.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/share/${token}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error ?? "Mot de passe incorrect.");
        return;
      }

      router.refresh();
    } catch {
      setError("Erreur réseau lors de la vérification.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full flex flex-col gap-3">
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="Mot de passe du lien…"
        autoFocus
        disabled={loading}
        className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-2.5 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-blue-500/40 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100"
      />

      {error && (
        <p className="text-xs text-red-600 dark:text-red-400 text-left">{error}</p>
      )}

      <button
        type="submit"
        disabled={loading || !password}
        className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-sm disabled:opacity-50"
      >
        <span>{loading ? "Vérification…" : "Déverrouiller le fichier"}</span>
      </button>
    </form>
  );
}
