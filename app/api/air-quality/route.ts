import { getHistory } from "@/lib/airvisual/history";
import { fetchAndProcessAll } from "@/lib/airvisual/fetcher";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const history = getHistory();
  const url = new URL(req.url);
  const doFetch = url.searchParams.get("fetch") === "1";

  if (doFetch && history.length === 0) {
    await fetchAndProcessAll({ locationIds: ["balikpapan"] });
  }

  const fresh = getHistory();
  const latest = fresh.length ? fresh[fresh.length - 1] : null;
  return Response.json(
    { data: latest, history: fresh, source: doFetch && history.length === 0 ? "airvisual:balikpapan" : "memory" },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate=120" } }
  );
}
