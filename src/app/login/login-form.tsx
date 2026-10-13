"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Status = { kind: "idle" } | { kind: "loading" } | { kind: "error"; message: string };

const inputClassName =
  "h-11 w-full rounded-lg border border-zinc-300 bg-transparent px-3 text-sm outline-none transition focus:border-zinc-900 focus:ring-1 focus:ring-zinc-900 dark:border-zinc-700 dark:focus:border-zinc-100 dark:focus:ring-zinc-100";
const labelClassName = "text-sm font-medium text-zinc-700 dark:text-zinc-300";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setStatus({ kind: "loading" });

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setStatus({ kind: "error", message: data.error ?? "Échec de la connexion." });
        return;
      }

      router.push("/");
      router.refresh();
    } catch {
      setStatus({
        kind: "error",
        message: "Impossible de joindre le serveur. Vérifiez votre connexion.",
      });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <label htmlFor="email" className={labelClassName}>
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
          className={inputClassName}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <label htmlFor="password" className={labelClassName}>
          Mot de passe
        </label>
        <input
          id="password"
          type="password"
          name="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
          required
          disabled={status.kind === "loading"}
          className={inputClassName}
        />
      </div>

      <button
        type="submit"
        disabled={status.kind === "loading"}
        className="mt-2 flex h-11 items-center justify-center rounded-full bg-foreground px-5 font-medium text-background transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {status.kind === "loading" ? "Connexion…" : "Se connecter"}
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
