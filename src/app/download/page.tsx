export default function DownloadPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-zinc-50 dark:bg-black">
      <div className="bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-sm border border-zinc-200 dark:border-zinc-800 flex flex-col items-center gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">
          Téléchargement
        </h1>
        <p className="text-zinc-600 dark:text-zinc-400 text-sm">
          Fichier disponible : <strong>test.txt</strong>
        </p>

        {/* Le bouton ciblant ta route d'API */}
        <a
          href="/api/download"
          className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
        >
          Télécharger test.txt
        </a>
      </div>
    </main>
  );
}