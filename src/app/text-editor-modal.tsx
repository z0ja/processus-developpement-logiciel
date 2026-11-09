"use client";

import { useCallback, useEffect, useRef, useState } from "react";

// US-G1 : modification d'un fichier texte directement dans le navigateur.
// Le contenu est chargé, modifié dans un éditeur, puis enregistré comme nouvelle
// version du fichier (POST /api/files/:id/versions).

type TextEditorModalProps = {
  fileId: string;
  fileName: string;
  mimeType: string;
  /** Version courante du fichier au moment de l'ouverture. */
  version: number;
  onClose: () => void;
  /** Appelé après chaque enregistrement réussi. */
  onSaved: () => void;
};

type LoadState =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready" };

// Détails du fichier d'origine à conserver à l'enregistrement.
type Format = { crlf: boolean; bom: boolean };

export function TextEditorModal({
  fileId,
  fileName,
  mimeType,
  version: initialVersion,
  onClose,
  onSaved,
}: TextEditorModalProps) {
  const [load, setLoad] = useState<LoadState>({ kind: "loading" });
  const [content, setContent] = useState("");
  const [savedContent, setSavedContent] = useState("");
  const [version, setVersion] = useState(initialVersion);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ kind: "ok" | "error"; text: string } | null>(null);
  const format = useRef<Format>({ crlf: false, bom: false });
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // Incrémenté par le bouton « Recharger » pour relancer le chargement.
  const [reloadCount, setReloadCount] = useState(0);

  const dirty = load.kind === "ready" && content !== savedContent;

  // Chargement du contenu actuel du fichier.
  useEffect(() => {
    let ignore = false;
    fetch(`/api/files/${fileId}/download`)
      .then(async (res) => {
        if (!res.ok) throw new Error("Impossible de charger le fichier.");
        const loadedVersion = Number(res.headers.get("X-File-Version"));
        const bytes = new Uint8Array(await res.arrayBuffer());
        let text: string;
        try {
          text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
        } catch {
          throw new Error("Ce fichier n'est pas un texte UTF-8 : il ne peut pas être modifié ici.");
        }
        if (ignore) return;
        // Le TextDecoder retire le BOM et la zone de texte remplace les fins de ligne
        // Windows par « \n » : on les mémorise pour les restituer à l'enregistrement.
        format.current = {
          bom: bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf,
          crlf: text.includes("\r\n"),
        };
        const normalized = text.replace(/\r\n/g, "\n");
        setContent(normalized);
        setSavedContent(normalized);
        // La version enregistrée ensuite partira de celle qui vient d'être chargée.
        if (loadedVersion > 0) setVersion(loadedVersion);
        if (reloadCount > 0) {
          setMessage({ kind: "ok", text: `Rechargé — version ${loadedVersion || "actuelle"}.` });
        }
        setLoad({ kind: "ready" });
        setTimeout(() => textareaRef.current?.focus(), 0);
      })
      .catch((error: Error) => {
        if (!ignore) setLoad({ kind: "error", message: error.message });
      });
    return () => {
      ignore = true;
    };
  }, [fileId, reloadCount]);

  // Recharge la dernière version du fichier depuis le serveur.
  function reload() {
    if (dirty && !window.confirm("Recharger le fichier et abandonner vos modifications ?")) return;
    setMessage(null);
    setLoad({ kind: "loading" });
    setReloadCount((n) => n + 1);
  }

  const save = useCallback(async () => {
    if (!dirty || saving) return;
    if (content.length === 0) {
      setMessage({ kind: "error", text: "Le fichier ne peut pas être vide." });
      return;
    }
    setSaving(true);
    setMessage(null);
    try {
      let text = format.current.crlf ? content.replace(/\n/g, "\r\n") : content;
      if (format.current.bom) text = "﻿" + text;
      const body = new FormData();
      body.append("file", new File([text], fileName, { type: mimeType }));
      body.append("baseVersion", String(version));
      const res = await fetch(`/api/files/${fileId}/versions`, { method: "POST", body });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMessage({ kind: "error", text: data.error ?? "L'enregistrement a échoué." });
        return;
      }
      setVersion(data.version);
      setSavedContent(content);
      setMessage({ kind: "ok", text: `Enregistré — version ${data.version}.` });
      onSaved();
    } catch {
      setMessage({ kind: "error", text: "Impossible de contacter le serveur." });
    } finally {
      setSaving(false);
    }
  }, [content, dirty, fileId, fileName, mimeType, onSaved, saving, version]);

  const requestClose = useCallback(() => {
    if (dirty && !window.confirm("Fermer sans enregistrer les modifications ?")) return;
    onClose();
  }, [dirty, onClose]);

  // Raccourcis : Ctrl/Cmd+S pour enregistrer, Échap pour fermer.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "s") {
        event.preventDefault();
        save();
      } else if (event.key === "Escape") {
        requestClose();
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [save, requestClose]);

  // Avertit avant de quitter la page avec des modifications non enregistrées.
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => event.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  // Tabulation : insère une tabulation au lieu de quitter la zone de texte.
  function onTextareaKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key !== "Tab" || event.shiftKey) return;
    event.preventDefault();
    const el = event.currentTarget;
    const { selectionStart, selectionEnd } = el;
    const next = content.slice(0, selectionStart) + "\t" + content.slice(selectionEnd);
    setContent(next);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = selectionStart + 1;
    });
  }

  const lineCount = content.length === 0 ? 0 : content.split("\n").length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      aria-label={`Modifier ${fileName}`}
    >
      <div className="flex h-[85vh] w-full max-w-4xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl dark:border dark:border-zinc-800 dark:bg-zinc-900">
        <header className="flex items-center justify-between gap-3 border-b border-zinc-100 px-5 py-3 dark:border-zinc-800">
          <div className="flex min-w-0 flex-col">
            <span className="text-xs font-medium uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Modifier
            </span>
            <h2 className="truncate text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {fileName}
              {dirty && <span className="ml-1 text-zinc-400" title="Modifications non enregistrées">•</span>}
            </h2>
          </div>
          <span className="shrink-0 rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
            version {version}
          </span>
        </header>

        <div className="relative min-h-0 flex-1">
          {load.kind === "loading" && (
            <p className="p-5 text-sm text-zinc-500">Chargement du fichier…</p>
          )}
          {load.kind === "error" && <p className="p-5 text-sm text-red-600">{load.message}</p>}
          {load.kind === "ready" && (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(event) => setContent(event.target.value)}
              onKeyDown={onTextareaKeyDown}
              spellCheck={false}
              aria-label={`Contenu de ${fileName}`}
              className="h-full w-full resize-none bg-zinc-50 p-5 font-mono text-[13px] leading-relaxed text-zinc-900 outline-none dark:bg-zinc-950 dark:text-zinc-100"
              style={{ tabSize: 4 }}
            />
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-zinc-100 px-5 py-3 dark:border-zinc-800">
          <div className="text-xs">
            {message ? (
              <span
                className={
                  message.kind === "ok"
                    ? "text-green-700 dark:text-green-400"
                    : "text-red-600 dark:text-red-400"
                }
              >
                {message.text}
              </span>
            ) : (
              load.kind === "ready" && (
                <span className="text-zinc-500">
                  {lineCount} ligne{lineCount > 1 ? "s" : ""} · {content.length} caractère
                  {content.length > 1 ? "s" : ""} · Ctrl/⌘ + S pour enregistrer
                </span>
              )
            )}
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={reload}
              disabled={load.kind === "loading" || saving}
              title="Recharger la dernière version enregistrée"
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Recharger
            </button>
            <button
              type="button"
              onClick={requestClose}
              className="rounded-lg border border-zinc-200 px-3 py-1.5 text-sm font-medium text-zinc-700 transition hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Fermer
            </button>
            <button
              type="button"
              onClick={save}
              disabled={!dirty || saving}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {saving ? "Enregistrement…" : "Enregistrer"}
            </button>
          </div>
        </footer>
      </div>
    </div>
  );
}
