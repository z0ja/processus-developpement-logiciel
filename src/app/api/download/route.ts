import { NextResponse } from "next/server";
import path from "path";
import fs from "fs";

export async function GET() {
  const filePath = path.join(process.cwd(), "partage", "test.txt");

  if (!fs.existsSync(filePath)) {
    return new NextResponse("Fichier introuvable", { status: 404 });
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

  const headers = new Headers();
  headers.set("Content-Type", "text/plain; charset=utf-8");
  headers.set("Content-Disposition", 'attachment; filename="test.txt"');
  headers.set("Content-Length", fileStat.size.toString());

  return new NextResponse(stream, {
    status: 200,
    headers,
  });
}