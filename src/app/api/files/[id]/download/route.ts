import { NextResponse } from "next/server";
import fs from "node:fs";
import { getCurrentUser } from "@/lib/current-user";
import { prisma } from "@/lib/prisma";
import { resolveStoragePath } from "@/lib/storage";

// US-B3 : Téléchargement direct d'un fichier par son propriétaire.
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return new NextResponse("Authentification requise", { status: 401 });
  }

  const { id: fileId } = await params;

  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId: user.id },
  });

  if (!file) {
    return new NextResponse("Fichier introuvable", { status: 404 });
  }

  let filePath: string;
  try {
    filePath = resolveStoragePath(file.storagePath);
  } catch {
    return new NextResponse("Chemin de stockage invalide", { status: 500 });
  }

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Fichier introuvable sur le disque", { status: 404 });
  }

  const fileStat = fs.statSync(filePath);
  const nodeStream = fs.createReadStream(filePath);
  const stream = new ReadableStream({
    start(controller) {
      nodeStream.on("data", (chunk) => controller.enqueue(chunk));
      nodeStream.on("end", () => controller.close());
      nodeStream.on("error", (err) => controller.error(err));
    },
    cancel() {
      nodeStream.destroy();
    },
  });

  const safeAsciiName = file.name.replace(/[^\x20-\x7E]/g, "_");
  const encodedName = encodeURIComponent(file.name);

  const headers = new Headers();
  headers.set("Content-Type", file.mimeType || "application/octet-stream");
  headers.set(
    "Content-Disposition",
    `attachment; filename="${safeAsciiName}"; filename*=UTF-8''${encodedName}`
  );
  headers.set("Content-Length", fileStat.size.toString());

  return new NextResponse(stream, {
    status: 200,
    headers,
  });
}

