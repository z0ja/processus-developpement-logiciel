import { prisma } from "@/lib/prisma";

// US-G1 : qui peut publier une nouvelle version d'un fichier ?
// Pour l'instant, seul son propriétaire. US-H1 (droits lecture / lecture-écriture)
// étendra cette règle aux utilisateurs ayant reçu un droit d'écriture : c'est le
// seul endroit à modifier.
export async function findEditableFile(fileId: string, userId: string) {
  return prisma.file.findFirst({
    where: { id: fileId, ownerId: userId },
  });
}
