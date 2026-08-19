const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

interface RateLimitConfig {
  windowMs: number;
  maxRequests: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60_000,
  maxRequests: 30,
};

export function checkRateLimit(
  key: string,
  config: Partial<RateLimitConfig> = {}
): { allowed: boolean; remaining: number; resetMs: number } {
  const { windowMs, maxRequests } = { ...DEFAULT_CONFIG, ...config };
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry || now - entry.windowStart > windowMs) {
    rateLimitMap.set(key, { count: 1, windowStart: now });
    return { allowed: true, remaining: maxRequests - 1, resetMs: windowMs };
  }

  entry.count++;
  const resetMs = windowMs - (now - entry.windowStart);

  if (entry.count > maxRequests) {
    return { allowed: false, remaining: 0, resetMs };
  }

  return { allowed: true, remaining: maxRequests - entry.count, resetMs };
}

const UPLOAD_CONFIG: RateLimitConfig = { windowMs: 60_000, maxRequests: 10 };

export function checkUploadLimit(key: string) {
  return checkRateLimit(`upload:${key}`, UPLOAD_CONFIG);
}

export function purgeExpiredWindows() {
  const now = Date.now();
  for (const [key, val] of rateLimitMap) {
    if (now - val.windowStart > 300_000) rateLimitMap.delete(key);
  }
}

setInterval(purgeExpiredWindows, 60_000);
