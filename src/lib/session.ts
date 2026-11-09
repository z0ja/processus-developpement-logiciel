import { createHash, randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

// US-A2 : sessions de connexion stockées en base.
// Le cookie contient un jeton aléatoire ; la base n'en conserve que l'empreinte SHA-256,
// de sorte qu'une fuite de la table Session ne permet pas d'usurper une session.
const SESSION_COOKIE = "session";
const SESSION_DURATION_MS = 7 * 24 * 60 * 60 * 1000;

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

/** Ouvre une session pour l'utilisateur et pose le cookie correspondant. */
export async function createSession(userId: string): Promise<void> {
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);
  await prisma.session.create({ data: { tokenHash: hashToken(token), userId, expiresAt } });

  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    expires: expiresAt,
  });
}

/** Renvoie l'utilisateur de la session courante, ou `null` si elle est absente ou expirée. */
export async function getSessionUser(): Promise<{ id: string; email: string } | null> {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  if (!token) return null;

  const session = await prisma.session.findUnique({
    where: { tokenHash: hashToken(token) },
    select: { expiresAt: true, user: { select: { id: true, email: true } } },
  });
  if (!session || session.expiresAt <= new Date()) return null;
  return session.user;
}

/** Ferme la session courante (suppression en base et du cookie). */
export async function destroySession(): Promise<void> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (token) {
    await prisma.session.deleteMany({ where: { tokenHash: hashToken(token) } });
  }
  cookieStore.delete(SESSION_COOKIE);
}
