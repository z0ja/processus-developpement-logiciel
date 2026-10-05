import { UploadForm } from "./upload-form";

export default function Home() {
  return (
    <div className="flex flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex w-full max-w-md flex-col gap-6 rounded-2xl bg-white p-8 dark:bg-zinc-900">
        <h1 className="text-2xl font-semibold tracking-tight">Partage de fichiers</h1>
        <section className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Uploader un fichier</h2>
          <UploadForm />
        </section>
      </main>
    </div>
  );
}
