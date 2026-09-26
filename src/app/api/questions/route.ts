import { MODE_IDS } from "@/engine/orders";
import type { Mode } from "@/engine/types";
import { DEFAULT_MODEL, anthropicGenerator, generateQuestions } from "@/lib/generateQuestions";
import { RECENT_LIMIT } from "@/lib/storage";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "invalid json" }, { status: 400 });
  }
  const { mode, avoid } = (body ?? {}) as { mode?: unknown; avoid?: unknown };
  if (typeof mode !== "string" || !MODE_IDS.includes(mode as Mode)) {
    return Response.json({ error: "invalid mode" }, { status: 400 });
  }
  const avoidList = (Array.isArray(avoid) ? avoid : [])
    .filter((t): t is string => typeof t === "string" && t.length <= 100)
    .slice(-RECENT_LIMIT);

  const apiKey = process.env.ANTHROPIC_API_KEY;
  const generator = apiKey
    ? anthropicGenerator(apiKey, process.env.QUESTION_MODEL || DEFAULT_MODEL)
    : null;
  const result = await generateQuestions(mode as Mode, avoidList, generator);
  return Response.json(result);
}
