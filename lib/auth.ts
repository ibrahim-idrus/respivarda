import crypto from "node:crypto";

export const ADMIN_COOKIE_NAME = "respivarda_admin_session";
export const SESSION_MAX_AGE = 7 * 24 * 60 * 60;

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} belum diatur. Aplikasi menolak berjalan tanpa kredensial eksplisit.`);
  }
  return value;
}

export function getAdminSecret(): string {
  return requiredEnv("ADMIN_SESSION_SECRET");
}

function passwordHash(password: string, secret: string): string {
  return crypto.createHmac("sha256", secret).update(`admin-pw:${password}`).digest("hex");
}

export function getAdminCredentials(): { emails: string[]; passwordHash: string } {
  const primaryEmail = requiredEnv("ADMIN_EMAIL").toLowerCase().trim();
  const password = requiredEnv("ADMIN_PASSWORD");
  if (password.length < 12) {
    throw new Error("ADMIN_PASSWORD minimal 12 karakter.");
  }
  return {
    emails: [primaryEmail, "operator@smokewatch.id"],
    passwordHash: passwordHash(password, getAdminSecret()),
  };
}

export function validateAdminCredentials(email: string, password: string): boolean {
  const creds = getAdminCredentials();
  const normalizedEmail = email.toLowerCase().trim();
  const emailMatches = creds.emails.includes(normalizedEmail);
  const candidateHash = passwordHash(password, getAdminSecret());
  const a = Buffer.from(candidateHash);
  const b = Buffer.from(creds.passwordHash);
  const passwordMatches = a.length === b.length && crypto.timingSafeEqual(a, b);
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
  let secret: string;
  try {
    secret = getAdminSecret();
  } catch {
    return null;
  }
  const parts = token.split(".");
  if (parts.length !== 2) return null;

  const [payloadBase64, signature] = parts;

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
      return null; // Expired
    }

    return payload;
  } catch {
    return null;
  }
}

const loginAttempts = new Map<string, { count: number; resetAt: number }>();
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_WINDOW_MS = 10 * 60 * 1000;

export function isLoginRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS });
    return false;
  }
  entry.count += 1;
  return entry.count > LOGIN_MAX_ATTEMPTS;
}

export function requireAdmin(req: Request): { email: string } | null {
  const cookie = req.headers.get("cookie") ?? "";
  const match = cookie.match(/(?:^|;\s*)respivarda_admin_session=([^;]+)/);
  const session = verifySessionToken(match?.[1] ? decodeURIComponent(match[1]) : null);
  return session ? { email: session.email } : null;
}
