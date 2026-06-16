import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import TextFade from './TextFade';
import { listAttempts, type Attempt } from '../lib/history';
import { supabaseEnabled } from '../lib/supabase';

export default function History() {
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    listAttempts().then((rows) => {
      if (active) {
        setAttempts(rows);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="max-w-[760px] mx-auto px-5 md:px-8 pt-10 pb-16">
      <TextFade direction="up">
        <h1 className="font-mondwest text-ink text-[34px] md:text-[48px] mb-6">
          History
        </h1>
      </TextFade>

      {!supabaseEnabled ? (
        <p className="text-[15px] text-ink-secondary bg-surface-muted rounded-xl px-5 py-4">
          History isn’t connected yet. Add your Supabase URL and anon key to{' '}
          <code className="text-[13px]">.env</code> (and on Vercel) to save and
          share attempts across devices.
        </p>
      ) : loading ? (
        <div className="flex items-center gap-2 text-ink-secondary">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : attempts.length === 0 ? (
        <p className="text-[15px] text-ink-secondary">
          No attempts yet. Finish a quiz and it’ll show up here.
        </p>
      ) : (
        <div className="border-2 border-line rounded-2xl overflow-hidden">
          {attempts.map((a, i) => {
            const pct = Math.round((a.score / a.total) * 100);
            return (
              <div
                key={a.id}
                className={`flex items-center justify-between px-5 py-4 ${
                  i > 0 ? 'border-t border-line' : ''
                }`}
              >
                <div className="min-w-0">
                  <p className="text-[15px] text-ink truncate">
                    {a.material_title}
                  </p>
                  <p className="text-[13px] text-ink-muted">
                    {a.user_name} · {a.round_size} questions ·{' '}
                    {new Date(a.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-right shrink-0 ml-4">
                  <p className="text-[18px] font-mondwest text-ink">
                    {a.score}/{a.total}
                  </p>
                  <p
                    className={`text-[12px] ${
                      pct >= 90
                        ? 'text-green-600'
                        : pct >= 70
                        ? 'text-ink-secondary'
                        : 'text-red-500'
                    }`}
                  >
                    {pct}%
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
