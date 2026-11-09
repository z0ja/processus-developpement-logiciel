import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isShareLinkUnlocked } from "@/lib/share-auth";
import { streamStoredFile } from "@/lib/file-response";

// US-B5 : Ouverture dans le navigateur d'un fichier partagé par lien.
// Mêmes contrôles que /api/share/[token]/download (expiration, mot de passe).
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

  return streamStoredFile(shareLink.file, "open");
}
