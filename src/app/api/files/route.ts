import { getCurrentUser } from "@/lib/current-user";
import { validateUploadedFile } from "@/lib/file-validation";
import { prisma } from "@/lib/prisma";
import { deleteStoredFile, saveFile } from "@/lib/storage";

// US-B1 & US-E2 : upload et validation d'un fichier (multipart/form-data, champ « file »).
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

  const validation = validateUploadedFile(file);
  if (!validation.valid) {
    return Response.json({ error: validation.error }, { status: validation.status });
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

// US-B2 & US-F2 : Liste et recherche des fichiers de l'utilisateur connecté.
export async function GET(request: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";

  const files = await prisma.file.findMany({
    where: {
      ownerId: user.id,
      ...(query ? { name: { contains: query, mode: "insensitive" } } : {}),
    },
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
      _count: { select: { shares: true } }, // US-C2 : nombre d'utilisateurs destinataires
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
