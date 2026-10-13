import { randomBytes, scrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";

const scryptAsync = promisify(scrypt);

const KEY_LENGTH = 64;

/**
 * Hache un mot de passe en utilisant scrypt (recommandé par l'OWASP, natif Node.js).
 * Format de sortie : salt:derivedKey (en hexadécimal)
 */
export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

/**
 * Vérifie un mot de passe en clair par rapport au hachage stocké (prêt pour US-A2).
 * Utilise timingSafeEqual pour prévenir les attaques temporelles (timing attacks).
 */
export async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const parts = storedHash.split(":");
  if (parts.length !== 2) {
    return false;
  }

  const [salt, key] = parts;
  const keyBuffer = Buffer.from(key, "hex");
  const derivedKey = (await scryptAsync(password, salt, KEY_LENGTH)) as Buffer;

  if (keyBuffer.length !== derivedKey.length) {
    return false;
  }

  return timingSafeEqual(keyBuffer, derivedKey);
}

/**
 * Valide le format d'une adresse email.
 */
export function validateEmail(email: unknown): { valid: boolean; error?: string } {
  if (typeof email !== "string" || !email.trim()) {
    return { valid: false, error: "L'adresse email est requise." };
  }

  const trimmed = email.trim();
  if (trimmed.length > 255) {
    return { valid: false, error: "L'adresse email est trop longue (max 255 caractères)." };
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: "Format d'adresse email invalide." };
  }

  return { valid: true };
}

/**
 * Valide les exigences de complexité minimale d'un mot de passe.
 */
export function validatePassword(password: unknown): { valid: boolean; error?: string } {
  if (typeof password !== "string" || !password) {
    return { valid: false, error: "Le mot de passe est requis." };
  }

  if (password.length < 8) {
    return { valid: false, error: "Le mot de passe doit contenir au moins 8 caractères." };
  }

  if (password.length > 128) {
    return { valid: false, error: "Le mot de passe est trop long (max 128 caractères)." };
  }

  return { valid: true };
}
