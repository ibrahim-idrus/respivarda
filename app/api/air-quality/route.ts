import { getHistory } from '@/lib/airvisual/history';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const history = getHistory();
  const latest = history.length ? history[history.length - 1] : null;
  return Response.json(
    { data: latest, history },
    { headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' } }
  );
}
