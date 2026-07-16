import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': Deno.env.get('ALLOWED_ORIGIN') ?? '',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const response = (status: number, message = '') =>
  new Response(message, { status, headers: corsHeaders });

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return response(204);
  if (request.method !== 'POST') return response(405);
  if (corsHeaders['Access-Control-Allow-Origin'] === '') return response(500, 'Server origin not configured');
  if (request.headers.get('origin') !== corsHeaders['Access-Control-Allow-Origin']) return response(403);

  try {
    const token = request.headers.get('Authorization');
    const auth = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: token ?? '' } },
    });
    const { data: { user } } = await auth.auth.getUser();
    if (!user || user.is_anonymous !== true) return response(401);
    const data = await request.json();
    const events = data?.events;
    const valid = typeof data?.id === 'string' && /^[a-z0-9-]{12,80}$/i.test(data.id)
      && typeof data?.hero === 'string' && data.hero.trim().length > 0 && data.hero.trim().length <= 24
      && Number.isInteger(data?.points) && data.points >= 0 && data.points <= 10_000_000
      && Array.isArray(data?.chapters) && data.chapters.length <= 12
      && events && typeof events === 'object';
    if (!valid) return response(400, 'Invalid aggregate session');

    // Keep the stored shape bounded; do not accept arbitrary request metadata.
    const payload = {
      id: data.id, hero: data.hero.trim(), startedAt: data.startedAt, lastUpdatedAt: data.lastUpdatedAt,
      chapters: data.chapters.map((c: unknown) => c).slice(0, 12),
      events: Object.fromEntries(Object.entries(events).filter(([key, value]) =>
        ['jumps','rolls','attacks','heals','kills','deaths','relics','beacons','damageTaken','bossesDefeated'].includes(key)
        && Number.isFinite(value) && Number(value) >= 0 && Number(value) <= 1_000_000)),
      points: data.points,
      insights: data.insights ?? {},
    };
    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
    const { error } = await admin.from('game_sessions').upsert({
      session_id: data.id, hero_name: data.hero.trim(), score: data.points,
      chapters_completed: data.chapters.length, payload, updated_at: new Date().toISOString(),
    }, { onConflict: 'session_id' });
    if (error) { console.error(error); return response(500); }
    return response(204);
  } catch { return response(400, 'Invalid JSON'); }
});
