// Vercel Cron: POST/GET /api/send-reminders
// Emails students who have spaced-repetition reviews due, via Resend.
//
// To enable:
//   1) Run migration 014 (adds user_id + due_reviews_by_user()).
//   2) Set env: RESEND_API_KEY, SUPABASE_SERVICE_ROLE_KEY, and optionally
//      REMINDER_FROM ("Flow <reminders@yourdomain>"), APP_URL, CRON_SECRET.
//   3) Add a cron in vercel.json, e.g.:
//        { "crons": [{ "path": "/api/send-reminders", "schedule": "0 16 * * *" }] }
//      (16:00 UTC daily.) Vercel cron requests carry an x-vercel-cron header.
//
// Safe by default: no-ops (200) when RESEND_API_KEY is absent.
import type { IncomingMessage, ServerResponse } from 'http';
import { createClient } from '@supabase/supabase-js';

function send(res: ServerResponse, status: number, body: unknown) {
  res.statusCode = status;
  res.setHeader('content-type', 'application/json');
  res.setHeader('cache-control', 'no-store');
  res.end(JSON.stringify(body));
}

interface DueRow {
  user_id: string;
  email: string | null;
  due_count: number;
}

export default async function handler(
  req: IncomingMessage & {
    method?: string;
    headers?: Record<string, string | string[] | undefined>;
  },
  res: ServerResponse
) {
  // Authorize: Vercel cron sets x-vercel-cron; allow a manual CRON_SECRET too.
  const isVercelCron = Boolean(req.headers?.['x-vercel-cron']);
  const secret = process.env.CRON_SECRET;
  const authHeader = req.headers?.['authorization'];
  const secretOk = secret ? authHeader === `Bearer ${secret}` : false;
  if (!isVercelCron && !secretOk) return send(res, 401, { error: 'Unauthorized' });

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) return send(res, 200, { skipped: 'RESEND_API_KEY not set' });

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey)
    return send(res, 503, { error: 'Supabase service role is not configured.' });

  const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await admin.rpc('due_reviews_by_user');
  if (error) {
    console.error('due_reviews_by_user failed:', error.message);
    return send(res, 500, { error: error.message });
  }

  const rows = (data ?? []) as DueRow[];
  const appUrl = (
    process.env.APP_URL ||
    process.env.VITE_APP_URL ||
    'https://flowstudy.app'
  ).replace(/\/+$/, '');
  const from = process.env.REMINDER_FROM || 'Flow <reminders@resend.dev>';

  let sent = 0;
  for (const row of rows) {
    if (!row.email || !row.due_count) continue;
    const n = Number(row.due_count);
    const plural = n === 1 ? '' : 's';
    const subject = `You have ${n} review${plural} due on Flow`;
    const html = `
      <div style="font-family:system-ui,-apple-system,sans-serif;max-width:480px;margin:auto;color:#2c2c2c">
        <h2 style="margin:0 0 8px">Time for a quick review</h2>
        <p style="margin:0 0 16px;line-height:1.5;color:#555">
          You have <b>${n}</b> question${plural} ready to review. A few minutes now keeps them from slipping.
        </p>
        <a href="${appUrl}" style="display:inline-block;background:#242724;color:#fff;text-decoration:none;padding:12px 20px;border-radius:9999px;font-weight:600">
          Start reviewing
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#999">
          You're getting this because you have spaced-repetition reviews due on Flow.
        </p>
      </div>`;

    try {
      const resp = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          authorization: `Bearer ${resendKey}`,
          'content-type': 'application/json',
        },
        body: JSON.stringify({ from, to: row.email, subject, html }),
      });
      if (resp.ok) sent += 1;
      else console.error('resend send failed:', resp.status, await resp.text());
    } catch (err) {
      console.error('resend send error:', err);
    }
  }

  return send(res, 200, { processed: rows.length, sent });
}
