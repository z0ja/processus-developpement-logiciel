import { NextResponse } from "next/server";
import fs from "node:fs";
import { prisma } from "@/lib/prisma";
import { isShareLinkUnlocked } from "@/lib/share-auth";
import { resolveStoragePath } from "@/lib/storage";

// US-C3 : Téléchargement public d'un fichier via un lien de partage.
// US-D3 : Le quota de téléchargements est vérifié et consommé de façon atomique.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: { file: true },
  });

  if (!shareLink) {
    return new NextResponse("Lien de partage introuvable ou expiré", { status: 404 });
  }

  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    return new NextResponse("Ce lien de partage a expiré", { status: 410 });
  }

  if (shareLink.password) {
    const unlocked = await isShareLinkUnlocked(shareLink.id, shareLink.password);
    if (!unlocked) {
      return new NextResponse("Mot de passe requis pour télécharger ce fichier", {
        status: 401,
      });
    }
  }

  // US-D3 : consomme une unité du quota en une seule requête conditionnelle.
  // `$executeRaw` renvoie le nombre de lignes affectées : 0 ⇒ quota épuisé
  // ou lien supprimé entre-temps ⇒ on refuse le téléchargement.
  const consumed = await prisma.$executeRaw`
    UPDATE "ShareLink"
    SET "downloadCount" = "downloadCount" + 1
    WHERE "id" = ${shareLink.id}
      AND ("maxDownloads" IS NULL OR "downloadCount" < "maxDownloads")
  `;
  if (consumed === 0) {
    return new NextResponse(
      "Ce lien a atteint sa limite de téléchargements",
      { status: 410 }
    );
  }

  let filePath: string;
  try {
    filePath = resolveStoragePath(shareLink.file.storagePath);
  } catch {
    // Rollback best-effort : on ne devrait pas arriver ici, mais si on a
    // décompté un téléchargement qui ne peut pas aboutir, on le rend.
    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: { downloadCount: { decrement: 1 } },
    });
    return new NextResponse("Chemin de stockage invalide", { status: 500 });
  }

  if (!fs.existsSync(filePath)) {
    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: { downloadCount: { decrement: 1 } },
    });
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

  const safeAsciiName = shareLink.file.name.replace(/[^\x20-\x7E]/g, "_");
  const encodedName = encodeURIComponent(shareLink.file.name);

  const headers = new Headers();
  headers.set("Content-Type", shareLink.file.mimeType || "application/octet-stream");
  headers.set(
    "Content-Disposition",
    `attachment; filename="${safeAsciiName}"; filename*=UTF-8''${encodedName}`
  );
  headers.set("Content-Length", fileStat.size.toString());

  return new NextResponse(stream, { status: 200, headers });
}
