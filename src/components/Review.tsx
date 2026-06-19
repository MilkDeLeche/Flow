import { useEffect, useMemo, useState } from 'react';
import { Loader2, Target, CalendarClock, CheckCircle2 } from 'lucide-react';
import TextFade from './TextFade';
import { listMissed, isDue, type MissedQuestion } from '../lib/store';

interface ReviewProps {
  userName: string;
  refreshKey?: number;
  onDrill: (missed: MissedQuestion[]) => void;
}

function daysFromNow(iso: string): number {
  return Math.max(0, Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000));
}

export default function Review({ userName, refreshKey, onDrill }: ReviewProps) {
  const [missed, setMissed] = useState<MissedQuestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setLoading(true);
    listMissed(userName).then((m) => {
      if (active) {
        setMissed(m);
        setLoading(false);
      }
    });
    return () => {
      active = false;
    };
  }, [userName, refreshKey]);

  const due = useMemo(() => missed.filter(isDue), [missed]);

  // Soonest upcoming review (for the "all caught up" state).
  const nextDueDays = useMemo(() => {
    const upcoming = missed.filter((m) => !isDue(m));
    if (!upcoming.length) return null;
    return Math.min(...upcoming.map((m) => daysFromNow(m.dueAt)));
  }, [missed]);

  // Group by material, surfacing how many are due in each.
  const groups = useMemo(() => {
    const map = new Map<string, { title: string; items: MissedQuestion[]; due: number }>();
    for (const m of missed) {
      const g = map.get(m.materialId) || { title: m.materialTitle, items: [], due: 0 };
      g.items.push(m);
      if (isDue(m)) g.due += 1;
      map.set(m.materialId, g);
    }
    return [...map.values()].sort((a, b) => b.due - a.due || b.items.length - a.items.length);
  }, [missed]);

  const startReview = (items: MissedQuestion[], max: number) => {
    const ordered = [...items].sort((a, b) => (a.dueAt < b.dueAt ? -1 : 1));
    onDrill(ordered.slice(0, max));
  };

  const drillHardest = (items: MissedQuestion[], max: number) => {
    const ordered = [...items].sort((a, b) => b.timesWrong - a.timesWrong);
    onDrill(ordered.slice(0, max));
  };

  return (
    <section className="max-w-[760px] mx-auto px-5 md:px-8 pt-10 pb-16">
      <TextFade direction="up">
        <h1 className="font-mondwest text-ink text-[34px] md:text-[48px] mb-2">Review</h1>
        <p className="text-[15px] text-ink-secondary mb-8">
          Questions you’ve missed come back on a schedule — get one right and it waits a little
          longer before resurfacing, until it finally sticks.
        </p>
      </TextFade>

      {loading ? (
        <div className="flex items-center gap-2 text-ink-secondary">
          <Loader2 size={16} className="animate-spin" /> Loading…
        </div>
      ) : missed.length === 0 ? (
        <p className="text-[15px] text-ink-secondary bg-surface-muted rounded-xl px-5 py-4">
          Nothing to review yet — finish some quizzes and any misses show up here.
        </p>
      ) : (
        <>
          {/* Due-today hero */}
          {due.length > 0 ? (
            <div className="mb-8 rounded-2xl border-2 border-accent/30 bg-surface-muted px-5 py-5">
              <div className="flex items-center gap-2 text-[13px] font-medium uppercase tracking-wide text-ink-secondary">
                <CalendarClock size={15} /> Due today
              </div>
              <p className="mt-1 mb-4 font-mondwest text-ink text-[28px] md:text-[34px]">
                {due.length} {due.length === 1 ? 'question' : 'questions'}
              </p>
              <button
                onClick={() => startReview(due, 30)}
                className="btn-primary gap-2 px-5 py-3 text-[15px]"
              >
                <Target size={16} />
                Start review ({Math.min(due.length, 30)})
              </button>
            </div>
          ) : (
            <div className="mb-8 flex items-start gap-3 rounded-2xl border border-line bg-surface-muted px-5 py-4">
              <CheckCircle2 size={20} className="mt-0.5 shrink-0 text-green-600 dark:text-green-400" />
              <div>
                <p className="text-[15px] text-ink">You’re all caught up.</p>
                <p className="text-[13px] text-ink-secondary">
                  {nextDueDays === null
                    ? 'Nothing scheduled.'
                    : nextDueDays === 0
                    ? 'More questions are due later today.'
                    : `Next review in ${nextDueDays} ${nextDueDays === 1 ? 'day' : 'days'}.`}{' '}
                  You can still drill ahead below.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-4">
            {groups.map((g) => (
              <div
                key={g.title}
                className="flex items-center justify-between border-2 border-line rounded-2xl px-5 py-4"
              >
                <div className="min-w-0">
                  <p className="text-[15px] text-ink truncate">{g.title}</p>
                  <p className="text-[13px] text-ink-muted">
                    {g.due > 0 ? `${g.due} due` : 'none due'} · {g.items.length} in review
                  </p>
                </div>
                <button
                  onClick={() =>
                    g.due > 0 ? startReview(g.items.filter(isDue), 20) : drillHardest(g.items, 20)
                  }
                  className="btn-outline shrink-0 ml-4 px-4 py-2 text-[14px]"
                >
                  {g.due > 0 ? `Review ${Math.min(g.due, 20)}` : `Drill ${Math.min(g.items.length, 20)}`}
                </button>
              </div>
            ))}
          </div>

          {due.length === 0 && missed.length > 0 && (
            <button
              onClick={() => drillHardest(missed, 30)}
              className="btn-outline gap-2 px-5 py-3 mt-8 text-[15px]"
            >
              <Target size={16} />
              Drill ahead — hardest first ({Math.min(missed.length, 30)})
            </button>
          )}
        </>
      )}
    </section>
  );
}
