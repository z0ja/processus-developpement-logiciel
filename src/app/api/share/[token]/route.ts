import { verifyPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { isShareLinkUnlocked, setShareUnlockCookie } from "@/lib/share-auth";

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

  if (shareLink.password) {
    const unlocked = await isShareLinkUnlocked(shareLink.id, shareLink.password);
    if (!unlocked) {
      return Response.json(
        {
          error: "Ce lien de partage est protégé par un mot de passe.",
          passwordProtected: true,
        },
        { status: 401 }
      );
    }
  }

  return Response.json({
    token: shareLink.token,
    file: shareLink.file,
    sharedAt: shareLink.createdAt,
    passwordProtected: Boolean(shareLink.password),
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const shareLink = await prisma.shareLink.findUnique({
    where: { token },
  });

  if (!shareLink) {
    return Response.json({ error: "Lien de partage introuvable." }, { status: 404 });
  }

  if (shareLink.expiresAt && shareLink.expiresAt < new Date()) {
    return Response.json({ error: "Ce lien de partage a expiré." }, { status: 410 });
  }

  if (!shareLink.password) {
    return Response.json({ unlocked: true });
  }

  let body: { password?: unknown };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corps JSON attendu." }, { status: 400 });
  }

  if (typeof body.password !== "string" || body.password.length === 0) {
    return Response.json({ error: "Veuillez saisir le mot de passe." }, { status: 400 });
  }

  const isValid = await verifyPassword(body.password, shareLink.password);
  if (!isValid) {
    return Response.json({ error: "Mot de passe incorrect." }, { status: 401 });
  }

  await setShareUnlockCookie(shareLink.id, shareLink.password);

  return Response.json({ unlocked: true });
}
