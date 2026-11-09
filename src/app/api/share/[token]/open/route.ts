import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isShareLinkUnlocked } from "@/lib/share-auth";
import { streamStoredFile } from "@/lib/file-response";

// US-B5 : Ouverture dans le navigateur d'un fichier partagé par lien.
// Mêmes contrôles que /api/share/[token]/download (expiration, mot de passe, quota US-D3).
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
      return new NextResponse("Mot de passe requis pour ouvrir ce fichier", { status: 401 });
    }
  }

  // US-D3 : ouvrir le fichier donne accès à son contenu, comme un téléchargement :
  // on consomme donc une unité du quota, de façon atomique (même règle que
  // /api/share/[token]/download), sinon l'ouverture permettrait de contourner la limite.
  const consumed = await prisma.$executeRaw`
    UPDATE "ShareLink"
    SET "downloadCount" = "downloadCount" + 1
    WHERE "id" = ${shareLink.id}
      AND ("maxDownloads" IS NULL OR "downloadCount" < "maxDownloads")
  `;
  if (consumed === 0) {
    return new NextResponse("Ce lien a atteint sa limite de téléchargements", { status: 410 });
  }

  const response = streamStoredFile(shareLink.file, "open");
  if (!response.ok) {
    // Le fichier n'a pas pu être servi : on rend l'unité consommée.
    await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: { downloadCount: { decrement: 1 } },
    });
  }
  return response;
}
