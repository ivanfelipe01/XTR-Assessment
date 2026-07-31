import { env } from "cloudflare:workers";

async function ensureSchema() {
  await env.DB.prepare(`CREATE TABLE IF NOT EXISTS assessments (id TEXT PRIMARY KEY, client TEXT NOT NULL, payload TEXT NOT NULL, score INTEGER NOT NULL DEFAULT 0, maturity TEXT NOT NULL, updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP)`).run();
}

export async function GET() {
  await ensureSchema();
  const result = await env.DB.prepare("SELECT id, client, score, maturity, updated_at FROM assessments ORDER BY updated_at DESC LIMIT 50").all();
  return Response.json({ assessments: result.results });
}

export async function POST(request: Request) {
  const data = await request.json() as { id?: string; client?: string; answers?: unknown; score?: number; maturity?: string };
  if (!data.id || !data.client) return Response.json({ error: "Assessment inválido" }, { status: 400 });
  await ensureSchema();
  await env.DB.prepare("INSERT INTO assessments (id, client, payload, score, maturity, updated_at) VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET client=excluded.client, payload=excluded.payload, score=excluded.score, maturity=excluded.maturity, updated_at=CURRENT_TIMESTAMP")
    .bind(data.id, data.client, JSON.stringify(data.answers ?? {}), data.score ?? 0, data.maturity ?? "Preocupante").run();
  return Response.json({ ok: true });
}
