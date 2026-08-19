import crypto from "crypto";

const SECRET = process.env.JWT_SECRET || crypto.randomBytes(32).toString("hex");

interface TokenPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}

export function signToken(payload: Omit<TokenPayload, "iat" | "exp">): string {
  const now = Math.floor(Date.now() / 1000);
  const full: TokenPayload = { ...payload, iat: now, exp: now + 3600 * 24 };
  const header = Buffer.from(JSON.stringify({ alg: "HS256", typ: "JWT" })).toString("base64url");
  const body = Buffer.from(JSON.stringify(full)).toString("base64url");
  const signature = crypto
    .createHmac("sha256", SECRET)
    .update(`${header}.${body}`)
    .digest("base64url");
  return `${header}.${body}.${signature}`;
}

export function verifyToken(token: string): TokenPayload | null {
  try {
    const [header, body, signature] = token.split(".");
    if (!header || !body || !signature) return null;

    const expected = crypto
      .createHmac("sha256", SECRET)
      .update(`${header}.${body}`)
      .digest("base64url");

    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) return null;

    const payload: TokenPayload = JSON.parse(Buffer.from(body, "base64url").toString());
    if (payload.exp < Math.floor(Date.now() / 1000)) return null;

    return payload;
  } catch {
    return null;
  }
}

export function hashPassword(password: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const salt = crypto.randomBytes(16).toString("hex");
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) return reject(err);
      resolve(`${salt}:${key.toString("hex")}`);
    });
  });
}

export function verifyPassword(password: string, stored: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, hash] = stored.split(":");
    crypto.scrypt(password, salt, 64, (err, key) => {
      if (err) return reject(err);
      resolve(crypto.timingSafeEqual(Buffer.from(key), Buffer.from(hash, "hex")));
    });
  });
}

export function extractBearerToken(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

export function generateApiKey(): string {
  return `xpg_${crypto.randomBytes(24).toString("hex")}`;
}
