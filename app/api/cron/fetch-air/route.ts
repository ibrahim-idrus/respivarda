import crypto from 'node:crypto';
import { refreshAllMonitored } from '@/lib/airvisual/cache';
import { fanoutLocationAlert } from '@/lib/airvisual/fanout';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 120;

function isAuthorized(req: Request): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  const auth = req.headers.get('authorization');
  if (!auth) return false;
  const a = Buffer.from(auth);
  const b = Buffer.from(`Bearer ${secret}`);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function GET(req: Request) {
  if (!isAuthorized(req)) return new Response('Unauthorized', { status: 401 });
  const now = new Date();
  const results = await refreshAllMonitored(now);
  const fanout = [];
  for (const r of results) {
    if (!r.ok || !r.cached) continue;
    try {
      fanout.push(await fanoutLocationAlert(r.locationId, r.cached, now));
    } catch (err) {
      fanout.push({ locationId: r.locationId, city: r.cached.city, triggered: false, sent: 0, skipped: 0, errors: [err instanceof Error ? err.message : 'unknown'] });
    }
  }
  return Response.json({ fetchedAt: now.toISOString(), results, fanout });
}

export async function POST(req: Request) {
  return GET(req);
}
