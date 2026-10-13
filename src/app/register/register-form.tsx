"use client";

import { useState } from "react";
import Link from "next/link";

type Status =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "success"; email: string }
  | { kind: "error"; message: string };

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!email.trim()) {
      setStatus({ kind: "error", message: "Veuillez saisir une adresse email." });
      return;
    }

    if (password.length < 8) {
      setStatus({
        kind: "error",
        message: "Le mot de passe doit contenir au moins 8 caractères.",
      });
      return;
    }

    if (password !== confirmPassword) {
      setStatus({
        kind: "error",
        message: "Les deux mots de passe ne correspondent pas.",
      });
      return;
    }

    setStatus({ kind: "loading" });

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, confirmPassword }),
      });

      const data = await response.json();

      if (!response.ok) {
        setStatus({
          kind: "error",
          message: data.error ?? "Une erreur est survenue lors de l'inscription.",
        });
        return;
      }

      setStatus({ kind: "success", email: data.user.email });
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch {
      setStatus({
        kind: "error",
        message: "Impossible de joindre le serveur. Vérifiez votre connexion.",
      });
    }
  }

  if (status.kind === "success") {
    return (
      <div className="flex flex-col gap-4 text-center">
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900/50 dark:bg-green-950/30">
          <p className="font-medium text-green-800 dark:text-green-300">
            Compte créé avec succès !
          </p>
          <p className="mt-1 text-sm text-green-700 dark:text-green-400">
            Votre compte pour <strong>{status.email}</strong> a bien été enregistré.
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href="/login"
            className="flex h-11 items-center justify-center rounded-full bg-foreground px-5 font-medium text-background transition hover:opacity-90"
          >
            Se connecter
          </Link>
          <button
            type="button"
            onClick={() => setStatus({ kind: "idle" })}
            className="text-sm text-zinc-600 hover:underline dark:text-zinc-400"
          >
            Créer un autre compte
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="email"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Adresse email
        </label>
        <input
          id="email"
          type="email"
          name="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="nom@exemple.fr"
          autoComplete="email"
          required
          disabled={status.kind === "loading"}
          className="h-11 w-full rounded-lg border border-zinc-300 bg-transparent px-3 text-sm outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="password"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Mot de passe (8 caractères minimum)
        </label>
        <input
          id="password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={status.kind === "loading"}
          className="h-11 w-full rounded-lg border border-zinc-300 bg-transparent px-3 text-sm outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label
          htmlFor="confirmPassword"
          className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
        >
          Confirmer le mot de passe
        </label>
        <input
          id="confirmPassword"
          type="password"
          name="confirmPassword"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="new-password"
          required
          minLength={8}
          disabled={status.kind === "loading"}
          className="h-11 w-full rounded-lg border border-zinc-300 bg-transparent px-3 text-sm outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100 dark:focus:ring-zinc-100"
        />
      </div>

      <button
        type="submit"
        disabled={status.kind === "loading"}
        className="mt-2 flex h-11 items-center justify-center rounded-full bg-foreground px-5 font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status.kind === "loading" ? "Création du compte…" : "Créer mon compte"}
      </button>

      {status.kind === "error" && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-400"
        >
          {status.message}
        </div>
      )}
    </form>
  );
}
