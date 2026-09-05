import { readAllCached, refreshAllMonitored } from "@/lib/airvisual/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const doFetch = url.searchParams.get("fetch") === "1";

  if (doFetch) await refreshAllMonitored();
  const rows = await readAllCached();
  const byCity: Record<string, (typeof rows)[number]> = {};
  for (const c of rows) byCity[c.city] = c;
  const latest = rows.length ? rows[rows.length - 1] : null;
  return Response.json(
    { data: latest, history: rows, byCity, count: rows.length, source: doFetch ? "airvisual:refresh" : "cache" },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}
