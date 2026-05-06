import type { VercelRequest, VercelResponse } from "@vercel/node";
import { kv } from "@vercel/kv";

type Snapshot = {
  v: 1;
  updatedAt: number;
  data: {
    motoristas: unknown;
    caminhoes: unknown;
    historico: unknown;
    config: unknown;
  };
};

function bad(res: VercelResponse, status: number, message: string) {
  res.status(status).json({ ok: false, error: message });
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const key = String(req.query.key || "").trim();
    if (!key) return bad(res, 400, "missing key");
    if (key.length < 6) return bad(res, 400, "key too short");

    const storageKey = `frota:${key}`;

    if (req.method === "GET") {
      const snap = (await kv.get<Snapshot>(storageKey)) || null;
      return res.status(200).json({ ok: true, snapshot: snap });
    }

    if (req.method === "POST") {
      const body = (req.body || {}) as Partial<Snapshot>;
      if (body.v !== 1) return bad(res, 400, "invalid snapshot version");
      if (typeof body.updatedAt !== "number") return bad(res, 400, "invalid updatedAt");
      if (!body.data) return bad(res, 400, "missing data");

      const next: Snapshot = {
        v: 1,
        updatedAt: body.updatedAt,
        data: body.data as Snapshot["data"],
      };

      await kv.set(storageKey, next);
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "GET, POST");
    return bad(res, 405, "method not allowed");
  } catch (e: any) {
    return bad(res, 500, e?.message || "internal error");
  }
}

