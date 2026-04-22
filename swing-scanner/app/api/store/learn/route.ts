import { db, KEYS } from '@/lib/db'

// Stores an array of completed lesson IDs
export async function GET() {
  const store = await db()
  const completed = await store.get<string[]>(KEYS.learn)
  return Response.json(completed ?? [])
}

export async function POST(req: Request) {
  const store = await db()
  const { id, completed }: { id: string; completed: boolean } = await req.json()
  const current = (await store.get<string[]>(KEYS.learn)) ?? []
  const updated = completed
    ? Array.from(new Set([...current, id]))
    : current.filter(x => x !== id)
  await store.set(KEYS.learn, updated)
  return Response.json(updated)
}
