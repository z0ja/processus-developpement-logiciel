import { randomUUID } from "node:crypto";
import { getCurrentUser } from "@/lib/current-user";
import { hashPassword } from "@/lib/password";
import { prisma } from "@/lib/prisma";
import { validateSharePassword } from "@/lib/share-auth";

function parseExpiration(
  val: unknown
): { valid: true; date: Date | null } | { valid: false; error: string } {
  if (val === null || val === undefined || val === "") {
    return { valid: true, date: null };
  }
  if (typeof val !== "string" && !(val instanceof Date)) {
    return { valid: false, error: "Format de date d'expiration invalide." };
  }
  const date = new Date(val);
  if (Number.isNaN(date.getTime())) {
    return { valid: false, error: "Date d'expiration invalide." };
  }
  if (date.getTime() <= Date.now()) {
    return { valid: false, error: "La date d'expiration doit être dans le futur." };
  }
  return { valid: true, date };
}

// US-D3 : valide la limite de téléchargements.
// `null` = illimité ; sinon entier ≥ 1.
function parseMaxDownloads(
  val: unknown
): { valid: true; value: number | null } | { valid: false; error: string } {
  if (val === null || val === undefined || val === "") {
    return { valid: true, value: null };
  }
  if (typeof val !== "number" || !Number.isInteger(val) || val < 1) {
    return {
      valid: false,
      error: "Le nombre maximum de téléchargements doit être un entier positif (ou vide pour illimité).",
    };
  }
  return { valid: true, value: val };
}

function serializeLink(shareLink: {
  id: string;
  token: string;
  createdAt: Date;
  expiresAt: Date | null;
  password: string | null;
  maxDownloads: number | null;
  downloadCount: number;
}) {
  return {
    id: shareLink.id,
    token: shareLink.token,
    createdAt: shareLink.createdAt,
    expiresAt: shareLink.expiresAt,
    hasPassword: Boolean(shareLink.password),
    maxDownloads: shareLink.maxDownloads,
    downloadCount: shareLink.downloadCount,
  };
}

// US-C1 : Générer un lien de partage pour un fichier.
// US-D3 : possibilité de fixer une limite de téléchargements dès la création.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  const { id: fileId } = await params;

  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId: user.id },
  });

  if (!file) {
    return Response.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  let hasPasswordField = false;
  let requestedPassword: unknown = undefined;
  let hasExpiresAtField = false;
  let requestedExpiresAt: unknown = undefined;
  let hasMaxDownloadsField = false;
  let requestedMaxDownloads: unknown = undefined;

  try {
    const rawBody = await request.text();
    if (rawBody.trim().length > 0) {
      const parsed = JSON.parse(rawBody) as Record<string, unknown>;
      if (parsed && typeof parsed === "object") {
        if ("password" in parsed) {
          hasPasswordField = true;
          requestedPassword = parsed.password;
        }
        if ("expiresAt" in parsed) {
          hasExpiresAtField = true;
          requestedExpiresAt = parsed.expiresAt;
        }
        if ("maxDownloads" in parsed) {
          hasMaxDownloadsField = true;
          requestedMaxDownloads = parsed.maxDownloads;
        }
      }
    }
  } catch {
    return Response.json({ error: "Corps JSON invalide." }, { status: 400 });
  }

  let passwordHash: string | null | undefined = undefined;
  if (hasPasswordField) {
    if (requestedPassword === null || requestedPassword === "") {
      passwordHash = null;
    } else {
      const check = validateSharePassword(requestedPassword);
      if (!check.valid) {
        return Response.json({ error: check.error }, { status: 400 });
      }
      passwordHash = await hashPassword(requestedPassword as string);
    }
  }

  let nextExpiresAt: Date | null | undefined = undefined;
  if (hasExpiresAtField) {
    const checkExpiration = parseExpiration(requestedExpiresAt);
    if (!checkExpiration.valid) {
      return Response.json({ error: checkExpiration.error }, { status: 400 });
    }
    nextExpiresAt = checkExpiration.date;
  }

  let nextMaxDownloads: number | null | undefined = undefined;
  if (hasMaxDownloadsField) {
    const check = parseMaxDownloads(requestedMaxDownloads);
    if (!check.valid) {
      return Response.json({ error: check.error }, { status: 400 });
    }
    nextMaxDownloads = check.value;
  }

  let shareLink = await prisma.shareLink.findFirst({
    where: { fileId: file.id },
    orderBy: { createdAt: "desc" },
  });

  if (!shareLink) {
    const token = randomUUID();
    shareLink = await prisma.shareLink.create({
      data: {
        token,
        fileId: file.id,
        password: passwordHash ?? null,
        expiresAt: nextExpiresAt ?? null,
        maxDownloads: nextMaxDownloads ?? null,
      },
    });
  } else if (
    passwordHash !== undefined ||
    nextExpiresAt !== undefined ||
    nextMaxDownloads !== undefined
  ) {
    shareLink = await prisma.shareLink.update({
      where: { id: shareLink.id },
      data: {
        ...(passwordHash !== undefined ? { password: passwordHash } : {}),
        ...(nextExpiresAt !== undefined ? { expiresAt: nextExpiresAt } : {}),
        ...(nextMaxDownloads !== undefined ? { maxDownloads: nextMaxDownloads } : {}),
      },
    });
  }

  const url = new URL(request.url);
  const shareUrl = `${url.origin}/share/${shareLink.token}`;

  return Response.json({ ...serializeLink(shareLink), shareUrl }, { status: 200 });
}

// US-C1 : Mettre à jour un lien existant (mot de passe, expiration, quota).
// US-D3 : le propriétaire peut modifier la limite et réinitialiser le compteur.
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "Authentification requise." }, { status: 401 });
  }

  const { id: fileId } = await params;

  const file = await prisma.file.findFirst({
    where: { id: fileId, ownerId: user.id },
  });

  if (!file) {
    return Response.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Corps JSON attendu." }, { status: 400 });
  }

  const existingLink = await prisma.shareLink.findFirst({
    where: { fileId: file.id },
    orderBy: { createdAt: "desc" },
  });

  if (!existingLink) {
    return Response.json(
      { error: "Aucun lien de partage actif pour ce fichier." },
      { status: 404 }
    );
  }

  const updateData: {
    password?: string | null;
    expiresAt?: Date | null;
    maxDownloads?: number | null;
    downloadCount?: number;
  } = {};

  if ("password" in body) {
    if (body.password === null || body.password === "") {
      updateData.password = null;
    } else {
      const check = validateSharePassword(body.password);
      if (!check.valid) {
        return Response.json({ error: check.error }, { status: 400 });
      }
      updateData.password = await hashPassword(body.password as string);
    }
  }

  if ("expiresAt" in body) {
    const checkExpiration = parseExpiration(body.expiresAt);
    if (!checkExpiration.valid) {
      return Response.json({ error: checkExpiration.error }, { status: 400 });
    }
    updateData.expiresAt = checkExpiration.date;
  }

  if ("maxDownloads" in body) {
    const check = parseMaxDownloads(body.maxDownloads);
    if (!check.valid) {
      return Response.json({ error: check.error }, { status: 400 });
    }
    updateData.maxDownloads = check.value;
  }

  // US-D3 : le propriétaire peut remettre le compteur à zéro (ou le fixer à
  // une valeur donnée) pour redonner du crédit au lien.
  if ("downloadCount" in body) {
    const raw = body.downloadCount;
    if (typeof raw !== "number" || !Number.isInteger(raw) || raw < 0) {
      return Response.json(
        { error: "Le compteur de téléchargements doit être un entier positif ou nul." },
        { status: 400 }
      );
    }
    updateData.downloadCount = raw;
  }

  const updated = await prisma.shareLink.update({
    where: { id: existingLink.id },
    data: updateData,
  });

  const url = new URL(request.url);
  const shareUrl = `${url.origin}/share/${updated.token}`;

  return Response.json({ ...serializeLink(updated), shareUrl });
}

// US-C1 : Révoquer le lien de partage d'un fichier.
export async function DELETE(
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
  });

  if (!file) {
    return Response.json({ error: "Fichier introuvable." }, { status: 404 });
  }

  await prisma.shareLink.deleteMany({
    where: { fileId: file.id },
  });

  return Response.json({ message: "Lien de partage révoqué avec succès." });
}
