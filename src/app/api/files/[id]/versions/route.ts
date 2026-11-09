import { getCurrentUser } from "@/lib/current-user";
import { findEditableFile } from "@/lib/file-access";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile, saveFile } from "@/lib/storage";
import { Prisma } from "@/generated/prisma/client";

// US-G1 : modification d'un fichier par publication d'une nouvelle version
// (multipart/form-data, champ « file », et « baseVersion » optionnel envoyé par
// l'éditeur de texte intégré). Le fichier garde son identifiant, donc ses
// liens et partages existants donnent accès à la nouvelle version. L'ancienne
// version est conservée sur disque pour l'historique (US-G2).
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  const { id: fileId } = await params;
  const existing = await findEditableFile(fileId, user.id);
  if (!existing) {
    return Response.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  let formData: FormData;
  try {
    formData = await request.formData();
  } catch {
    return Response.json({ error: "Requête multipart/form-data attendue." }, { status: 400 });
  }

  const upload = formData.get("file");
  if (!(upload instanceof File)) {
    return Response.json({ error: "Aucun fichier fourni (champ « file »)." }, { status: 400 });
  }
  if (upload.size === 0) {
    return Response.json({ error: "Le fichier est vide." }, { status: 400 });
  }

  // L'éditeur de texte envoie la version sur laquelle il a travaillé : si le
  // fichier a changé depuis, on refuse plutôt que d'écraser cette modification.
  const baseVersion = formData.get("baseVersion");
  if (typeof baseVersion === "string" && Number(baseVersion) !== existing.version) {
    return Response.json(
      {
        error: `Le fichier a été modifié entre-temps (version ${existing.version}). Rechargez-le avant d'enregistrer.`,
      },
      { status: 409 }
    );
  }

  const name = upload.name.trim() || existing.name;
  const mimeType = upload.type || "application/octet-stream";
  const nextVersion = existing.version + 1;
  const storagePath = await saveFile(upload);

  try {
    const [, updated] = await prisma.$transaction([
      // L'unicité (fileId, version) fait échouer une modification concurrente.
      prisma.fileVersion.create({
        data: {
          fileId,
          version: nextVersion,
          name,
          mimeType,
          size: upload.size,
          storagePath,
          authorId: user.id,
        },
      }),
      prisma.file.update({
        // La condition sur la version empêche d'écraser une modification faite entre-temps.
        where: { id: fileId, version: existing.version },
        data: { name, mimeType, size: upload.size, storagePath, version: nextVersion },
        select: {
          id: true,
          name: true,
          mimeType: true,
          size: true,
          version: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);
    return Response.json(updated, { status: 201 });
  } catch (error) {
    // Pas de fichier orphelin sur disque si l'enregistrement en base échoue.
    await deleteStoredFile(storagePath);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      (error.code === "P2002" || error.code === "P2025")
    ) {
      return Response.json(
        { error: "Le fichier a été modifié entre-temps. Réessayez." },
        { status: 409 }
      );
    }
    throw error;
  }
}
