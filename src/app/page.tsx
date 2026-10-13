import Link from "next/link";
import { getCurrentUser } from "@/lib/current-user";
import { LogoutButton } from "./logout-button";
import { UploadForm } from "./upload-form";

const headerLinkClassName =
  "rounded-full bg-zinc-100 px-3.5 py-1.5 text-xs font-medium text-zinc-800 transition hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-200 dark:hover:bg-zinc-700";

export default async function Home() {
  const user = await getCurrentUser();

  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black p-4">
      <main className="flex w-full max-w-md flex-col gap-6 rounded-2xl bg-white p-8 shadow-sm dark:bg-zinc-900 dark:border dark:border-zinc-800">
        <header className="flex items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold tracking-tight">Partage de fichiers</h1>
          {user ? (
            <LogoutButton />
          ) : (
            <Link href="/login" className={headerLinkClassName}>
              Se connecter
            </Link>
          )}
        </header>

        {user ? (
          <section className="flex flex-col gap-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Connecté en tant que <strong>{user.email}</strong>
            </p>
            <h2 className="text-lg font-medium">Uploader un fichier</h2>
            <UploadForm />
          </section>
        ) : (
          <section className="flex flex-col gap-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Connectez-vous pour uploader et gérer vos fichiers.
            </p>
            <Link
              href="/login"
              className="flex h-11 items-center justify-center rounded-full bg-foreground px-5 font-medium text-background transition hover:opacity-90"
            >
              Se connecter
            </Link>
            <Link href="/register" className="text-center text-sm underline text-zinc-600 dark:text-zinc-400">
              Créer un compte
            </Link>
          </section>
        )}

        <footer className="flex items-center justify-between border-t border-zinc-100 pt-4 text-xs text-zinc-500 dark:border-zinc-800 dark:text-zinc-400">
          <span>Sprint 1</span>
          <div className="flex gap-3">
            <Link href="/register" className="underline hover:text-zinc-800 dark:hover:text-zinc-200">
              Inscription (US-A1)
            </Link>
            <Link href="/download" className="underline hover:text-zinc-800 dark:hover:text-zinc-200">
              Démo download (US-B3)
            </Link>
          </div>
        </footer>
      </main>
    </div>
  );
}
