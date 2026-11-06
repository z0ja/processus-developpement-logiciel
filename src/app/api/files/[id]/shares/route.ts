import { Prisma } from "@/generated/prisma/client";
import { getCurrentUser } from "@/lib/current-user";
import { validateEmail } from "@/lib/password";
import { prisma } from "@/lib/prisma";

// US-C2 : Partage direct d'un fichier avec un autre utilisateur du service.
// Seul le propriétaire du fichier peut consulter, ajouter ou retirer des destinataires.

const shareSelect = {
  id: true,
  createdAt: true,
  recipient: { select: { id: true, email: true } },
} as const;

/** Liste des utilisateurs avec qui le fichier est partagé. */
export async function GET(
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
    select: { id: true },
  });
  if (!file) {
    return Response.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  const shares = await prisma.fileShare.findMany({
    where: { fileId: file.id },
    orderBy: { createdAt: "asc" },
    select: shareSelect,
  });

  return Response.json(shares);
}

/** Partage le fichier avec l'utilisateur dont l'email est fourni (`{ "email": "..." }`). */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Requête invalide : corps JSON attendu." }, { status: 400 });
  }

  const email = (body as { email?: unknown } | null)?.email;
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return Response.json({ error: emailValidation.error }, { status: 400 });
  }
  const emailStr = (email as string).trim().toLowerCase();

  const { id: fileId } = await params;
  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId: user.id },
    select: { id: true },
  });
  if (!file) {
    return Response.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  if (emailStr === user.email) {
    return Response.json(
      { error: "Vous ne pouvez pas partager un fichier avec vous-même." },
      { status: 400 }
    );
  }

  const recipient = await prisma.user.findUnique({
    where: { email: emailStr },
    select: { id: true },
  });
  if (!recipient) {
    return Response.json(
      { error: "Aucun utilisateur du service ne correspond à cet email." },
      { status: 404 }
    );
  }

  try {
    const share = await prisma.fileShare.create({
      data: { fileId: file.id, recipientId: recipient.id },
      select: shareSelect,
    });
    return Response.json(share, { status: 201 });
  } catch (error) {
    // Contrainte d'unicité (fileId, recipientId) : déjà partagé avec cet utilisateur.
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json(
        { error: "Ce fichier est déjà partagé avec cet utilisateur." },
        { status: 409 }
      );
    }
    throw error;
  }
}
