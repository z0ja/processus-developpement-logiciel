import { getSessionUser } from "@/lib/session";

export type CurrentUser = { id: string; email: string };

// Utilisateur connecté (US-A2), lu depuis la session.
// Renvoyer `null` signifie « non authentifié » : les routes répondent alors 401.
export async function getCurrentUser(): Promise<CurrentUser | null> {
  return getSessionUser();
}
