// src/auth.ts
import {
  sign,
  verify,
  type Secret,
  type JwtPayload,
  type SignOptions,
} from "jsonwebtoken";
import bcrypt from "bcryptjs";

/** Read required env var (nice error if missing) */
function requiredEnv(name: string): string {
  const v = process.env[name];
  if (!v || v.trim() === "") throw new Error(`Missing ${name} in .env`);
  return v;
}

/** Secrets & TTLs */
const ACCESS_SECRET: Secret = requiredEnv("JWT_SECRET");
const REFRESH_SECRET: Secret = requiredEnv("JWT_REFRESH_SECRET");

type ExpiresIn = SignOptions["expiresIn"];
const ACCESS_TTL: ExpiresIn  = (process.env.JWT_EXPIRES_IN  ?? "15m") as ExpiresIn;
const REFRESH_TTL: ExpiresIn = (process.env.JWT_REFRESH_EXPIRES_IN ?? "7d") as ExpiresIn;

/** Password helpers */
export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}
export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/** Payloads are typed so TS picks the correct sign() overload */
type AccessPayload  = { sub: string; typ: "access" };
type RefreshPayload = { sub: string; typ: "refresh" };

const ACCESS_OPTS: SignOptions  = { expiresIn: ACCESS_TTL };
const REFRESH_OPTS: SignOptions = { expiresIn: REFRESH_TTL };

/** Token signers */
export function signAccessToken(userId: string): string {
  const payload: AccessPayload = { sub: userId, typ: "access" };
  return sign(payload, ACCESS_SECRET, ACCESS_OPTS);
}

export function signRefreshToken(userId: string): string {
  const payload: RefreshPayload = { sub: userId, typ: "refresh" };
  return sign(payload, REFRESH_SECRET, REFRESH_OPTS);
}

/** Token verifiers (throws if invalid/expired) */
export function verifyAccess(token: string): { sub: string; typ: "access" } {
  const p = verify(token, ACCESS_SECRET) as JwtPayload;
  if (p?.typ !== "access") throw new Error("Invalid token type");
  return p as any;
}

export function verifyRefresh(token: string): { sub: string; typ: "refresh" } {
  const p = verify(token, REFRESH_SECRET) as JwtPayload;
  if (p?.typ !== "refresh") throw new Error("Invalid token type");
  return p as any;
}

/** Optional: expose TTLs for logs / responses */
export const tokenConfig = Object.freeze({
  accessTtl: ACCESS_TTL,
  refreshTtl: REFRESH_TTL,
});
