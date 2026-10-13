import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

// US-C1 : Générer un lien de partage pour un fichier.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  const { id: fileId } = await params;

  // Seul le propriétaire peut générer un lien de partage pour son fichier.
  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId: user.id },
  });

  if (!file) {
    return Response.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  // Récupérer un lien existant ou en créer un nouveau
  let shareLink = await prisma.shareLink.findFirst({
    where: { fileId: file.id },
    orderBy: { createdAt: "desc" },
  });

  if (!shareLink) {
    const token = randomUUID();
    shareLink = await prisma.shareLink.create({
      data: {
        token,
        fileId: file.id,
      },
    });
  }

  const url = new URL(request.url);
  const shareUrl = `${url.origin}/share/${shareLink.token}`;

  return Response.json(
    {
      id: shareLink.id,
      token: shareLink.token,
      shareUrl,
      createdAt: shareLink.createdAt,
    },
    { status: 200 }
  );
}

// US-C1 : Révoquer le lien de partage d'un fichier.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  const { id: fileId } = await params;

  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId: user.id },
  });

  if (!file) {
    return Response.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  await prisma.shareLink.deleteMany({
    where: { fileId: file.id },
  });

  return Response.json({ message: "Lien de partage révoqué avec succès." });
}

