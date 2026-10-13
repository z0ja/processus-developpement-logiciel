import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/current-user";
import { LoginForm } from "./login-form";

export const metadata: Metadata = {
  title: "Connexion — Partage de fichiers",
  description: "Se connecter au service de partage de fichiers.",
};

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/");

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 px-4 py-12 font-sans dark:bg-black">
      <main className="flex w-full max-w-md flex-col gap-6 rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-900 dark:border dark:border-zinc-800">
        <header className="flex flex-col gap-2">
          <Link
            href="/"
            className="text-xs font-medium text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
          >
            ← Retour à l&apos;accueil
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
            Se connecter
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Connectez-vous pour uploader et gérer vos fichiers.
          </p>
        </header>

        <section>
          <LoginForm />
        </section>

        <footer className="border-t border-zinc-100 pt-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <p>
            Pas encore de compte ?{" "}
            <Link href="/register" className="font-medium underline hover:text-zinc-800 dark:hover:text-zinc-200">
              Créer un compte
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
