import type { Metadata } from "next";
import Link from "next/link";
import { RegisterForm } from "./register-form";

export const metadata: Metadata = {
  title: "Inscription — Partage de fichiers",
  description: "Créer un compte pour accéder au service de partage de fichiers.",
};

export default function RegisterPage() {
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
            Créer un compte
          </h1>
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Inscrivez-vous pour uploader, gérer et partager vos fichiers en toute sécurité.
          </p>
        </header>

        <section>
          <RegisterForm />
        </section>

        <footer className="border-t border-zinc-100 pt-4 text-center text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <p>
            Vous avez déjà un compte ?{" "}
            <Link href="/login" className="font-medium underline hover:text-zinc-800 dark:hover:text-zinc-200">
              Se connecter
            </Link>
          </p>
        </footer>
      </main>
    </div>
  );
}
