"use client";

import { useState } from "react";
import { UploadForm } from "./upload-form";
import { FileList } from "./file-list";

export function FileSection() {
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  return (
    <div className="flex flex-col gap-6">
      <section className="flex flex-col gap-3">
        <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Uploader un fichier
        </h2>
        <UploadForm onSuccess={() => setRefreshTrigger((prev) => prev + 1)} />
      </section>

      <section className="flex flex-col gap-3 pt-4 border-t border-zinc-100 dark:border-zinc-800">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Mes fichiers
          </h2>
          <button
            type="button"
            onClick={() => setRefreshTrigger((prev) => prev + 1)}
            className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-300"
            title="Rafraîchir la liste"
          >
            Actualiser
          </button>
        </div>
        <FileList refreshTrigger={refreshTrigger} />
      </section>
    </div>
  );
}

