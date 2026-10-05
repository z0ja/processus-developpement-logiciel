import { randomUUID } from "node:crypto";
import { createWriteStream } from "node:fs";
import { mkdir, rm } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { pipeline } from "node:stream/promises";
import type { ReadableStream as WebReadableStream } from "node:stream/web";

// Stockage local des fichiers uploadés (cf. ADR-001, points ouverts).
// Les fichiers sont nommés par un identifiant aléatoire : le nom d'origine,
// fourni par le client, n'est jamais utilisé pour construire un chemin disque.
const UPLOAD_DIR = path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

/** Écrit le contenu sur disque (en streaming) et renvoie son chemin relatif à UPLOAD_DIR. */
export async function saveFile(content: Blob): Promise<string> {
  await mkdir(UPLOAD_DIR, { recursive: true });
  const storagePath = randomUUID();
  const source = Readable.fromWeb(content.stream() as WebReadableStream);
  await pipeline(source, createWriteStream(resolveStoragePath(storagePath)));
  return storagePath;
}

export async function deleteStoredFile(storagePath: string): Promise<void> {
  await rm(resolveStoragePath(storagePath), { force: true });
}

export function resolveStoragePath(storagePath: string): string {
  const absolute = path.resolve(UPLOAD_DIR, storagePath);
  if (path.dirname(absolute) !== UPLOAD_DIR) {
    throw new Error(`Chemin de stockage invalide : ${storagePath}`);
  }
  return absolute;
}
