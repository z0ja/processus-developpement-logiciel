import { NextResponse } from "next/server";
import { readdir, stat } from "fs/promises";
import path from "path";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const dir = path.join(process.cwd(), "partage");

    const entries = await readdir(dir, { withFileTypes: true });

    const files = await Promise.all(
      entries
        .filter((entry) => entry.isFile())
        .map(async (entry) => {
          const filePath = path.join(dir, entry.name);
          const info = await stat(filePath);
          return {
            name: entry.name,
            size: info.size,
            modifiedAt: info.mtime.toISOString(),
          };
        })
    );

    // Tri alphabétique insensible à la casse
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