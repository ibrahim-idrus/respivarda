import { fetchNearestCity } from "@/lib/airvisual";
import { evaluateRuleEngine } from "@/lib/airvisual/rule-engine";
import { resolveAlertInsight } from "@/lib/airvisual/alert-insight";
import { buildHistoryPayload, storeHistory } from "@/lib/airvisual/history";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Response.json({ error: "lat dan lon wajib diisi" }, { status: 400 });
  }
  const r = await fetchNearestCity({ lat, lon });
  if (r.kind === "unavailable") return Response.json({ error: r.error }, { status: 502 });
  if (r.kind === "incomplete") return Response.json({ error: r.error ?? `Missing: ${r.missingFields.join(", ")}` }, { status: 502 });
  const current = r.data;
  const rule = evaluateRuleEngine({ current });
  const insight = resolveAlertInsight(current, rule);
  const payload = buildHistoryPayload(current, rule, insight);
  storeHistory(payload);
  return Response.json({ data: payload }, { headers: { "Cache-Control": "public, s-maxage=30" } });
}
