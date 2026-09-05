import { fetchAndProcessAll } from '@/lib/airvisual/fetcher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return true;
  const auth = req.headers.get('authorization');
  return auth === `Bearer ${secret}`;
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return new Response('Unauthorized', { status: 401 });
  const results = await fetchAndProcessAll();
  return Response.json({ fetchedAt: new Date().toISOString(), results });
}

export async function POST(req: Request) {
  return GET(req);
}
