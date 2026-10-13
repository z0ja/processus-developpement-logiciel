import { prisma } from "@/lib/prisma";

// US-C3 : Consulter les métadonnées publiques d'un fichier partagé.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
    include: {
      file: {
        select: {
          id: true,
          name: true,
          size: true,
          mimeType: true,
          createdAt: true,
        },
      },
    },
  });

  if (!shareLink) {
    return Response.json({ error: "Lien de partage introuvable ou expiré." }, { status: 404 });
  }

  // Vérification d'expiration si définie (préparation Sprint 3 / US-D1)
  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    return Response.json({ error: "Ce lien de partage a expiré." }, { status: 410 });
  }

  return Response.json({
    token: shareLink.token,
    file: shareLink.file,
    sharedAt: shareLink.createdAt,
  });
}

