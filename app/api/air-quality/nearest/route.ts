import { getAqiForCoords } from "@/lib/airvisual/cache";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return Response.json({ error: "lat dan lon wajib diisi" }, { status: 400 });
  }
  const { cached } = await getAqiForCoords(lat, lon);
  if (!cached) return Response.json({ error: "Data kualitas udara belum tersedia" }, { status: 502 });
  return Response.json({ data: cached }, { headers: { "Cache-Control": "public, s-maxage=60" } });
}
