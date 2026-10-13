import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { createSession } from "@/lib/session";

// Hachage factice (même format que hashPassword) : vérifié quand l'email est inconnu,
// pour que le temps de réponse ne révèle pas si un compte existe.
const DUMMY_HASH = `${"0".repeat(32)}:${"0".repeat(128)}`;

// Message volontairement identique que l'email soit inconnu ou le mot de passe faux.
const INVALID_CREDENTIALS = "Email ou mot de passe incorrect.";

// US-A2 : connexion
export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide : corps JSON attendu." }, { status: 400 });
  }

  const { email, password } = (body ?? {}) as { email?: unknown; password?: unknown };
  if (typeof email !== "string" || !email.trim() || typeof password !== "string" || !password) {
    return Response.json({ error: "Email et mot de passe requis." }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
    select: { id: true, email: true, passwordHash: true },
  });

  const passwordOk = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !passwordOk) {
    return Response.json({ error: INVALID_CREDENTIALS }, { status: 401 });
  }

  await createSession(user.id);
  return Response.json({ user: { id: user.id, email: user.email } });
}
