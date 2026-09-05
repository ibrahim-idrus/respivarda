import { refreshAllMonitored } from "@/lib/airvisual/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const doFetch = url.searchParams.get("fetch") === "1";

  const results = doFetch ? await refreshAllMonitored() : [];
  const rows = results.map((r) => r.cached).filter((c): c is NonNullable<typeof c> => c !== null);
  const byCity: Record<string, (typeof rows)[number]> = {};
  for (const c of rows) byCity[c.city] = c;
  const latest = rows.length ? rows[rows.length - 1] : null;
  return Response.json(
    { data: latest, history: rows, byCity, source: doFetch ? "airvisual:kaltim" : "cache" },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}
