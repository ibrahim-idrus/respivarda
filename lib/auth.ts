import crypto from "node:crypto";

const DEFAULT_SECRET = "respivarda-super-secret-admin-session-key-2026";
export const ADMIN_COOKIE_NAME = "respivarda_admin_session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

export function getAdminSecret(): string {
  return process.env.ADMIN_SESSION_SECRET || DEFAULT_SECRET;
}

export function getAdminCredentials(): { emails: string[]; password: string } {
  const primaryEmail = (process.env.ADMIN_EMAIL || "admin@respivarda.id").toLowerCase().trim();
  const secondaryEmail = "operator@smokewatch.id";
  const password = process.env.ADMIN_PASSWORD || "admin123";

  return {
    emails: [primaryEmail, secondaryEmail],
    password,
  };
}

export function validateAdminCredentials(email: string, password: string): boolean {
  const creds = getAdminCredentials();
  const normalizedEmail = email.toLowerCase().trim();
  const emailMatches = creds.emails.includes(normalizedEmail);
  const passwordMatches = password === creds.password;

  return emailMatches && passwordMatches;
}

type SessionPayload = {
  email: string;
  iat: number;
  exp: number;
};

export function createSessionToken(email: string): string {
  const secret = getAdminSecret();
  const payload: SessionPayload = {
    email: email.toLowerCase().trim(),
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + SESSION_MAX_AGE,
  };

  const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64url");
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payloadBase64);
  const signature = hmac.digest("base64url");

  return `${payloadBase64}.${signature}`;
}

export function verifySessionToken(token: string | undefined | null): SessionPayload | null {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadBase64, signature] = parts;
  const secret = getAdminSecret();

  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(payloadBase64);
  const expectedSignature = hmac.digest("base64url");

 
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  try {
    const payloadJson = Buffer.from(payloadBase64, "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson) as SessionPayload;

    if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
      return null; 
    }

    return payload;
  } catch {
    return null;
  }
}
