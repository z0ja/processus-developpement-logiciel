import { destroySession } from "@/lib/session";

// US-A2 : déconnexion (sans effet si aucune session n'est ouverte)
export async function POST() {
  await destroySession();
  return Response.json({ message: "Déconnecté." });
}
