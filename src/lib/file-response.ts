import { NextResponse } from "next/server";
import fs from "node:fs";
import { inlineContentType } from "@/lib/file-preview";
import { resolveStoragePath } from "@/lib/storage";

type StoredFile = {
  name: string;
  mimeType: string;
  storagePath: string;
};

/**
 * Construit la réponse HTTP qui sert un fichier stocké, en streaming.
 * - mode "download" : Content-Disposition: attachment (US-B3 / US-C3).
 * - mode "open"     : Content-Disposition: inline si le type est dans la liste
 *   blanche de file-preview.ts (US-B5), sinon repli sur un téléchargement.
 */
export function streamStoredFile(file: StoredFile, mode: "download" | "open"): NextResponse {
  let filePath: string;
  try {
    filePath = resolveStoragePath(file.storagePath);
  } catch {
    return new NextResponse("Chemin de stockage invalide", { status: 500 });
  }

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Fichier introuvable sur le disque", { status: 404 });
  }

  const fileStat = fs.statSync(filePath);
  const nodeStream = fs.createReadStream(filePath);
  const stream = new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => controller.enqueue(chunk));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  const inlineType = mode === "open" ? inlineContentType(file.mimeType, file.name) : null;
  const disposition = inlineType ? "inline" : "attachment";

  // Encodage propre du nom de fichier pour Content-Disposition (RFC 5987)
  const safeAsciiName = file.name.replace(/[^\x20-\x7E]/g, "_").replace(/["\\]/g, "_");
  const encodedName = encodeURIComponent(file.name);

  const headers = new Headers();
  headers.set("Content-Type", inlineType ?? (file.mimeType || "application/octet-stream"));
  headers.set(
    "Content-Disposition",
    `${disposition}; filename="${safeAsciiName}"; filename*=UTF-8''${encodedName}`
  );
  headers.set("Content-Length", fileStat.size.toString());
  // Empêche le navigateur de « deviner » un autre type (ex. du HTML dans un .txt).
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Cache-Control", "private, no-store");

  return new NextResponse(stream, { status: 200, headers });
}
