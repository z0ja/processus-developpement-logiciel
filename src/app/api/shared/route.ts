import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";

// US-C2 / US-C3 : Fichiers que d'autres utilisateurs ont partagés avec l'utilisateur connecté.
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  const shares = await prisma.fileShare.findMany({
    where: { recipientId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      createdAt: true,
      file: {
        select: {
          id: true,
          name: true,
          mimeType: true,
          size: true,
          createdAt: true,
          owner: { select: { email: true } },
        },
      },
    },
  });

  return Response.json(
    shares.map(({ createdAt, file: { owner, ...file } }) => ({
      ...file,
      ownerEmail: owner.email,
      sharedAt: createdAt,
    }))
  );
}
