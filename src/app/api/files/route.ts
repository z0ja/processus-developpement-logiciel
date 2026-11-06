import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile, saveFile } from "@/lib/storage";

// US-B1 : upload d'un fichier (multipart/form-data, champ « file »).
// La validation taille max / types autorisés relève de US-E2.
export async function POST(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Requête multipart/form-data attendue." }, { status: 400 });
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return Response.json({ error: "Aucun fichier fourni (champ « file »)." }, { status: 400 });
  }
  if (file.size === 0) {
    return Response.json({ error: "Le fichier est vide." }, { status: 400 });
  }

  const storagePath = await saveFile(file);
  try {
    const saved = await prisma.file.create({
      data: {
        name: file.name.trim() || "sans-nom",
        mimeType: file.type || "application/octet-stream",
        size: file.size,
        storagePath,
        ownerId: user.id,
      },
      select: { id: true, name: true, mimeType: true, size: true, createdAt: true },
    });
    return Response.json(saved, { status: 201 });
  } catch (error) {
    // Pas de fichier orphelin sur disque si l'enregistrement en base échoue.
    await deleteStoredFile(storagePath);
    throw error;
  }
}

// US-B2 : Liste des fichiers de l'utilisateur connecté avec l'état du partage (US-C1).
export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  const files = await prisma.file.findMany({
    where: { ownerId: user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      mimeType: true,
      size: true,
      createdAt: true,
      shareLinks: {
        select: { id: true, token: true, createdAt: true, password: true, expiresAt: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  const sanitized = files.map((f) => ({
    ...f,
    shareLinks: f.shareLinks.map(({ id, token, createdAt, password, expiresAt }) => ({
      id,
      token,
      createdAt,
      expiresAt,
      hasPassword: Boolean(password),
    })),
  }));

  return Response.json(sanitized);
}

// US-B4 : Suppression d'un fichier par son propriétaire.
// Le scoping sur `ownerId` empêche un utilisateur de supprimer le fichier d'un autre.
// Les ShareLink associés sont supprimés automatiquement (onDelete: Cascade dans le schéma).
export async function DELETE(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  if (!id) {
    return Response.json({ error: "Identifiant de fichier requis." }, { status: 400 });
  }

  const file = await prisma.file.findFirst({
    where: { id, ownerId: user.id },
    select: { id: true, storagePath: true },
  });
  if (!file) {
    return Response.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  // Best-effort : on supprime d'abord le blob physique. S'il n'existe déjà
  // plus sur le disque, on continue pour nettoyer la base dans tous les cas.
  try {
    await deleteStoredFile(file.storagePath);
  } catch (err) {
    console.error("Suppression du fichier physique échouée", err);
  }

  await prisma.file.delete({ where: { id: file.id } });

  return Response.json({ ok: true });
}
