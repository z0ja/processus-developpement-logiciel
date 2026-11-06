import { createHash, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

const SHARE_UNLOCK_DURATION_SECONDS = 24 * 60 * 60;

function getCookieName(shareLinkId: string): string {
  return `share_unlock_${shareLinkId}`;
}

function computeUnlockToken(shareLinkId: string, passwordHash: string): string {
  return createHash("sha256")
    .update(`share-unlock:${shareLinkId}:${passwordHash}`)
    .digest("hex");
}

export async function setShareUnlockCookie(
  shareLinkId: string,
  passwordHash: string
): Promise<void> {
  const token = computeUnlockToken(shareLinkId, passwordHash);
  const cookieStore = await cookies();
  cookieStore.set(getCookieName(shareLinkId), token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SHARE_UNLOCK_DURATION_SECONDS,
  });
}

export async function isShareLinkUnlocked(
  shareLinkId: string,
  passwordHash: string
): Promise<boolean> {
  const cookieValue = (await cookies()).get(getCookieName(shareLinkId))?.value;
  if (!cookieValue) {
    return false;
  }

  const expected = Buffer.from(computeUnlockToken(shareLinkId, passwordHash), "utf-8");
  const actual = Buffer.from(cookieValue, "utf-8");

  if (expected.length !== actual.length) {
    return false;
  }

  return timingSafeEqual(expected, actual);
}

export function validateSharePassword(password: unknown): {
  valid: boolean;
  error?: string;
} {
  if (typeof password !== "string" || password.trim().length === 0) {
    return { valid: false, error: "Le mot de passe ne peut pas être vide." };
  }

  if (password.length > 128) {
    return {
      valid: false,
      error: "Le mot de passe est trop long (maximum 128 caractères).",
    };
  }

  return { valid: true };
}
