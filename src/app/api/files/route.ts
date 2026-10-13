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
        select: { id: true, token: true, createdAt: true },
        take: 1,
        orderBy: { createdAt: "desc" },
      },
    },
  });

  return Response.json(files);
}
