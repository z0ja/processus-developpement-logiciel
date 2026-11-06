import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

// US-C2 : Retirer l'accès d'un destinataire à un fichier partagé.
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string; recipientId: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  const { id: fileId, recipientId } = await params;

  // Le filtre sur le propriétaire garantit qu'un tiers ne peut pas retirer un partage.
  const { count } = await prisma.fileShare.deleteMany({
    where: { recipientId, file: { id: fileId, ownerId: user.id } },
  });

  if (count === 0) {
    return Response.json({ error: "Partage introuvable." }, { status: 404 });
  }

  return Response.json({ message: "Partage retiré avec succès." });
}
