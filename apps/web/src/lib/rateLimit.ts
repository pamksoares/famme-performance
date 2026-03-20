type Entry = { count: number; resetAt: number };
type Store = Map<string, Entry>;

const stores = new Map<string, Store>();

function getStore(name: string): Store {
  if (!stores.has(name)) stores.set(name, new Map());
  return stores.get(name)!;
}

function evictExpired(store: Store) {
  const now = Date.now();
  for (const [key, entry] of store) {
    if (now > entry.resetAt) store.delete(key);
  }
}

interface Options {
  limit: number;
  windowMs: number;
  name?: string;
}

interface Result {
  allowed: boolean;
  remaining: number;
  resetAt: number;
}

/**
 * In-memory rate limiter. Safe for single-instance deployments.
 *
 * @param key     Unique identifier (IP address, userId, etc.)
 * @param options limit, windowMs, name (separate bucket per name)
 */
export function checkRateLimit(key: string, options: Options): Result {
  const { limit, windowMs, name = "default" } = options;
  const store = getStore(name);

  // Probabilistic cleanup to cap memory growth (~1% of calls)
  if (Math.random() < 0.01) evictExpired(store);

  const now = Date.now();
  const entry = store.get(key);

  if (!entry || now > entry.resetAt) {
    const resetAt = now + windowMs;
    store.set(key, { count: 1, resetAt });
    return { allowed: true, remaining: limit - 1, resetAt };
  }

  if (entry.count >= limit) {
    return { allowed: false, remaining: 0, resetAt: entry.resetAt };
  }

  entry.count++;
  return { allowed: true, remaining: limit - entry.count, resetAt: entry.resetAt };
}

/**
 * Extracts the client IP from a Next.js request, respecting reverse-proxy headers.
 */
export function getClientIp(req: Request): string {
  return (
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ??
    req.headers.get("x-real-ip") ??
    "unknown"
  );
}
