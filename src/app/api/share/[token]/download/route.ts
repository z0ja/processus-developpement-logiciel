import { NextResponse } from "next/server";
import fs from "node:fs";
import { prisma } from "@/lib/prisma";
import { resolveStoragePath } from "@/lib/storage";

// US-C3 : Téléchargement public d'un fichier via un lien de partage.
// Réutilise le modèle de streaming éprouvé dans src/app/api/download/route.ts.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      file: true,
    },
  });

  if (!shareLink) {
    return new NextResponse("Lien de partage introuvable ou expiré", { status: 404 });
  }

  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    return new NextResponse("Ce lien de partage a expiré", { status: 410 });
  }

  let filePath: string;
  try {
    filePath = resolveStoragePath(shareLink.file.storagePath);
  } catch {
    return new NextResponse("Chemin de stockage invalide", { status: 500 });
  }

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Fichier physique introuvable sur le serveur", { status: 404 });
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

  // Encodage propre du nom de fichier pour Content-Disposition (RFC 5987)
  const safeAsciiName = shareLink.file.name.replace(/[^\x20-\x7E]/g, "_");
  const encodedName = encodeURIComponent(shareLink.file.name);

  const headers = new Headers();
  headers.set("Content-Type", shareLink.file.mimeType || "application/octet-stream");
  headers.set(
    "Content-Disposition",
    `attachment; filename="${safeAsciiName}"; filename*=UTF-8''${encodedName}`
  );
  headers.set("Content-Length", fileStat.size.toString());

  return new NextResponse(stream, {
    status: 200,
    headers,
  });
}

