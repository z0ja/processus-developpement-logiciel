import { prisma } from "@/lib/prisma";

export type CurrentUser = { id: string; email: string };

// TODO(US-A2) : remplacer par la lecture de la session une fois l'authentification en place.
// En attendant, toutes les requêtes sont attribuées à un utilisateur de démo, ce qui
// permet de développer et démontrer l'Epic B indépendamment de l'Epic A.
// Renvoyer `null` signifie « non authentifié » : les routes répondent alors 401.
const DEMO_EMAIL = "demo@partage.local";

export async function getCurrentUser(): Promise<CurrentUser | null> {
  return prisma.user.upsert({
    where: { email: DEMO_EMAIL },
    update: {},
    create: { email: DEMO_EMAIL, passwordHash: "!" },
    select: { id: true, email: true },
  });
}
