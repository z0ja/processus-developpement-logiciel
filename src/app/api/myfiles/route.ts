import { NextResponse } from "next/server";
import { readdir, stat, unlink } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

const SHARE_DIR = path.join(process.cwd(), "partage");

export async function GET() {
  try {
    const entries = await readdir(SHARE_DIR, { withFileTypes: true });

    const files = await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .map(async (entry) => {
          const filePath = path.join(SHARE_DIR, entry.name);
          const info = await stat(filePath);
          return {
            name: entry.name,
            size: info.size,
            modifiedAt: info.mtime.toISOString(),
          };
        })
    );

    files.sort((a, b) => a.name.localeCompare(b.name, "fr", { sensitivity: "base" }));

    return NextResponse.json({ files });
  } catch (err) {
    console.error("Erreur lecture dossier partage/", err);
    return NextResponse.json(
      { files: [], error: "Impossible de lire le dossier partage/." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const rawName = searchParams.get("name");

    if (!rawName) {
      return NextResponse.json(
        { error: "Paramètre 'name' manquant." },
        { status: 400 }
      );
    }

    // Empêche toute traversée de répertoire : on n'accepte qu'un basename simple.
    const safeName = path.basename(rawName);
    if (
      safeName !== rawName ||
      safeName === "." ||
      safeName === ".." ||
      safeName.includes("\0")
    ) {
      return NextResponse.json(
        { error: "Nom de fichier invalide." },
        { status: 400 }
      );
    }

    const target = path.join(SHARE_DIR, safeName);

    // Vérifie qu'on reste bien dans SHARE_DIR après résolution.
    if (path.dirname(path.resolve(target)) !== path.resolve(SHARE_DIR)) {
      return NextResponse.json(
        { error: "Chemin non autorisé." },
        { status: 400 }
      );
    }

    // Vérifie que c'est bien un fichier existant (et pas un dossier).
    const info = await stat(target).catch(() => null);
    if (!info || !info.isFile()) {
      return NextResponse.json(
        { error: "Fichier introuvable." },
        { status: 404 }
      );
    }

    await unlink(target);

    return NextResponse.json({ ok: true, deleted: safeName });
  } catch (err) {
    console.error("Erreur suppression fichier partage/", err);
    return NextResponse.json(
      { error: "Impossible de supprimer le fichier." },
      { status: 500 }
    );
  }
}
