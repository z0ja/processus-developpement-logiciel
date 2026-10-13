import Link from "next/link";
import { prisma } from "@/lib/prisma";

// US-C3 : Page publique de consultation et de téléchargement d'un fichier partagé.
// Réutilise l'approche ergonomique et le style de src/app/download/page.tsx.
export default async function SharedFilePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      file: {
        select: {
          id: true,
          name: true,
          size: true,
          mimeType: true,
          createdAt: true,
        },
      },
    },
  });

  const isExpired = shareLink?.expiresAt && shareLink.expiresAt < new Date();

  if (!shareLink || isExpired) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-black font-sans">
        <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-4 max-w-md w-full text-center">
          <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-950 flex items-center justify-center text-red-600 dark:text-red-400 font-bold text-lg">
            ✕
          </div>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">
            {isExpired ? "Lien expiré" : "Lien de partage introuvable"}
          </h1>
          <p className="text-zinc-600 dark:text-zinc-400 text-sm">
            {isExpired
              ? "La date limite de validité de ce lien de partage est dépassée."
              : "Ce lien de partage n'existe pas ou a été désactivé par son propriétaire."}
          </p>
          <Link
            href="/"
            className="mt-2 text-xs text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Retour à l&apos;accueil
          </Link>
        </div>
      </main>
    );
  }

  const { file } = shareLink;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-zinc-50 dark:bg-black font-sans">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-2xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-5 max-w-md w-full text-center">
        {/* En-tête avec icône document */}
        <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-100 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl">
          📄
        </div>

        <div className="flex flex-col gap-1 w-full">
          <span className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
            Fichier partagé
          </span>
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100 break-all">
            {file.name}
          </h1>
          <p className="text-zinc-500 dark:text-zinc-400 text-xs mt-1">
            Taille : <strong>{formatSize(file.size)}</strong> • Type : {file.mimeType}
          </p>
        </div>

        {/* Bouton de téléchargement — réutilise la cible /api/share/[token]/download */}
        <a
          href={`/api/share/${shareLink.token}/download`}
          className="w-full flex items-center justify-center gap-2 px-5 py-3 bg-blue-600 text-white font-medium rounded-xl hover:bg-blue-700 transition shadow-sm"
        >
          <span>Télécharger le fichier</span>
          <span>↓</span>
        </a>

        <div className="border-t border-zinc-100 dark:border-zinc-800 w-full pt-4 text-xs text-zinc-400">
          Partagé via le Service de partage de fichiers
        </div>
      </div>
    </main>
  );
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} o`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} Mo`;
}

