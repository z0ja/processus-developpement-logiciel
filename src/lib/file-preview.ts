// US-B5 : Ouverture de fichier dans le navigateur.
// Deux familles de types sont ouvrables :
//  - les médias que le navigateur affiche nativement (PDF, images, audio, vidéo),
//    servis avec leur propre Content-Type ;
//  - tout ce qui est textuel (texte, code, HTML, SVG, XML…), toujours servi en
//    « text/plain » : le navigateur affiche le code source sans jamais l'interpréter,
//    ce qui écarte tout risque de XSS via un fichier uploadé.
// Le type MIME fourni à l'upload est souvent vide ou générique pour les fichiers de
// code : on se rabat alors sur l'extension du nom de fichier.
// Ce module n'importe rien de Node : il est utilisable côté client et serveur.

const MEDIA_MIME_TYPES = new Set([
  "application/pdf",
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "image/avif",
  "image/bmp",
  "image/x-icon",
  "image/vnd.microsoft.icon",
  "audio/mpeg",
  "audio/ogg",
  "audio/wav",
  "audio/webm",
  "audio/aac",
  "audio/flac",
  "audio/mp4",
  "audio/x-m4a",
  "video/mp4",
  "video/webm",
  "video/ogg",
  "video/quicktime",
]);

// Types MIME textuels hors « text/* » (qui est accepté en entier).
const TEXT_MIME_TYPES = new Set([
  "application/json",
  "application/ld+json",
  "application/xml",
  "application/xhtml+xml",
  "application/javascript",
  "application/x-javascript",
  "application/typescript",
  "application/x-typescript",
  "application/x-yaml",
  "application/yaml",
  "application/toml",
  "application/sql",
  "application/x-sh",
  "application/x-httpd-php",
  "application/x-python-code",
  "image/svg+xml",
]);

// Repli par extension pour les médias (type MIME absent ou générique).
const MEDIA_EXTENSIONS: Record<string, string> = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  gif: "image/gif",
  webp: "image/webp",
  avif: "image/avif",
  bmp: "image/bmp",
  ico: "image/x-icon",
  mp3: "audio/mpeg",
  ogg: "audio/ogg",
  oga: "audio/ogg",
  wav: "audio/wav",
  aac: "audio/aac",
  flac: "audio/flac",
  m4a: "audio/mp4",
  mp4: "video/mp4",
  m4v: "video/mp4",
  webm: "video/webm",
  ogv: "video/ogg",
  mov: "video/quicktime",
};

// Repli par extension pour les fichiers texte et code.
const TEXT_EXTENSIONS = new Set([
  // texte et données
  "txt", "md", "markdown", "csv", "tsv", "log", "json", "jsonl", "xml", "yaml", "yml",
  "toml", "ini", "cfg", "conf", "env", "properties", "sql", "tex", "rst", "srt", "vtt",
  // web (affichés en code source)
  "html", "htm", "css", "scss", "sass", "less", "svg", "js", "mjs", "cjs", "jsx", "ts",
  "tsx", "vue", "svelte",
  // langages
  "py", "java", "kt", "kts", "scala", "groovy", "c", "h", "cpp", "cc", "cxx", "hpp",
  "cs", "go", "rs", "rb", "php", "pl", "lua", "r", "swift", "dart", "hs", "ml", "ex",
  "exs", "erl", "clj", "asm", "s", "m",
  // scripts et build
  "sh", "bash", "zsh", "fish", "ps1", "bat", "cmd", "gradle", "cmake", "mk",
  "dockerfile", "gitignore", "editorconfig",
]);

function normalizeMime(mimeType: string): string {
  return (mimeType ?? "").split(";")[0].trim().toLowerCase();
}

function extensionOf(fileName: string): string {
  const base = (fileName ?? "").split(/[\\/]/).pop()?.toLowerCase() ?? "";
  // « Dockerfile », « Makefile » : pas d'extension mais bien du texte.
  if (base === "dockerfile" || base === "makefile") return base === "makefile" ? "mk" : base;
  const dot = base.lastIndexOf(".");
  return dot >= 0 ? base.slice(dot + 1) : "";
}

const TEXT_PLAIN = "text/plain; charset=utf-8";

/**
 * Content-Type à envoyer pour l'ouverture inline, ou null si le fichier n'est pas
 * ouvrable (il est alors servi en téléchargement).
 */
export function inlineContentType(mimeType: string, fileName = ""): string | null {
  const type = normalizeMime(mimeType);
  if (MEDIA_MIME_TYPES.has(type)) return type;
  if (type.startsWith("text/") || TEXT_MIME_TYPES.has(type)) return TEXT_PLAIN;

  const ext = extensionOf(fileName);
  if (ext in MEDIA_EXTENSIONS) return MEDIA_EXTENSIONS[ext];
  if (TEXT_EXTENSIONS.has(ext)) return TEXT_PLAIN;
  return null;
}

/** Taille maximale d'un fichier modifiable dans l'éditeur de texte (US-G1). */
export const MAX_EDITABLE_SIZE = 1024 * 1024; // 1 Mo

/**
 * US-G1 : le fichier peut-il être modifié dans l'éditeur de texte intégré ?
 * Mêmes types que ceux affichés en texte brut à l'ouverture, dans la limite de taille.
 */
export function isEditableText(mimeType: string, fileName: string, size: number): boolean {
  return size <= MAX_EDITABLE_SIZE && inlineContentType(mimeType, fileName) === TEXT_PLAIN;
}

/** Indique si le fichier peut être ouvert directement dans le navigateur. */
export function isPreviewable(mimeType: string, fileName = ""): boolean {
  return inlineContentType(mimeType, fileName) !== null;
}
