import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { streamStoredFile } from "@/lib/file-response";

// US-B5 : Ouverture d'un fichier dans le navigateur (sans téléchargement).
// Mêmes droits d'accès que le téléchargement : propriétaire ou destinataire d'un partage.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Authentification requise", { status: 401 });
  }

  const { id: fileId } = await params;

  const file = await prisma.file.findFirst({
    where: {
      id: fileId,
      OR: [{ ownerId: user.id }, { fileShares: { some: { recipientId: user.id } } }],
    },
  });

  if (!file) {
    return new NextResponse("Fichier introuvable", { status: 404 });
  }

  return streamStoredFile(file, "open");
}
