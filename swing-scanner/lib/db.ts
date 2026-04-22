// Database wrapper — uses Vercel KV in production, in-memory Map in local dev.
// No setup needed locally. On Vercel: Storage → KV → Create → Connect to project.

const mem = new Map<string, unknown>()

const fallback = {
  async get<T>(key: string): Promise<T | null> {
    return (mem.get(key) as T) ?? null
  },
  async set(key: string, value: unknown): Promise<void> {
    mem.set(key, value)
  },
  async del(key: string): Promise<void> {
    mem.delete(key)
  },
}

type Store = typeof fallback

let _store: Store | null = null

export async function db(): Promise<Store> {
  if (_store) return _store

  if (!process.env.KV_REST_API_URL || !process.env.KV_REST_API_TOKEN) {
    _store = fallback
    return fallback
  }

  try {
    const { kv } = await import('@vercel/kv')
    const kvStore: Store = {
      async get<T>(key: string) { return kv.get<T>(key) },
      async set(key: string, value: unknown) { await kv.set(key, value) },
      async del(key: string) { await kv.del(key) },
    }
    _store = kvStore
    return kvStore
  } catch {
    _store = fallback
    return fallback
  }
}

// Typed helpers
export const KEYS = {
  config:  'dreamer:config',
  journal: 'dreamer:journal',
  learn:   'dreamer:learn',
  paper:   'dreamer:paper',
} as const
