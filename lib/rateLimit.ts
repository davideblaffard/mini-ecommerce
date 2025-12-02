const rateLimitMap = new Map<string, { count: number; ts: number }>();

export function simpleRateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry) {
    rateLimitMap.set(key, { count: 1, ts: now });
    return { ok: true };
  }

  if (now - entry.ts > windowMs) {
    rateLimitMap.set(key, { count: 1, ts: now });
    return { ok: true };
  }

  if (entry.count >= limit) {
    return { ok: false };
  }

  entry.count += 1;
  rateLimitMap.set(key, entry);
  return { ok: true };
}
