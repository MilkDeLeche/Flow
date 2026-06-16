import { useEffect, useMemo, useState } from 'react';
import { Loader2, Target } from 'lucide-react';
import TextFade from './TextFade';
import { listMissed, type MissedQuestion } from '../lib/store';

interface ReviewProps {
  userName: string;
  refreshKey?: number;
  onDrill: (missed: MissedQuestion[]) => void;
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

  // Group by material.
  const groups = useMemo(() => {
    const map = new Map<string, { title: string; items: MissedQuestion[] }>();
    for (const m of missed) {
      const g = map.get(m.materialId) || { title: m.materialTitle, items: [] };
      g.items.push(m);
      map.set(m.materialId, g);
    }
    return [...map.values()].sort((a, b) => b.items.length - a.items.length);
  }, [missed]);

  const drill = (items: MissedQuestion[], max: number) => {
    const ordered = [...items].sort((a, b) => b.timesWrong - a.timesWrong);
    onDrill(ordered.slice(0, max));
  };

  return (
    <section className="max-w-[760px] mx-auto px-5 md:px-8 pt-10 pb-16">
      <TextFade direction="up">
        <h1 className="font-mondwest text-ink text-[34px] md:text-[48px] mb-2">
          Review
        </h1>
        <p className="text-[15px] text-ink-secondary mb-8">
          Questions you’ve gotten wrong. Drill them until they stick — get one
          right and it leaves the pile.
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
          <button
            onClick={() => drill(missed, 30)}
            className="btn-primary gap-2 px-5 py-3 mb-8 text-[15px]"
          >
            <Target size={16} />
            Drill everything ({Math.min(missed.length, 30)})
          </button>

          <div className="space-y-4">
            {groups.map((g) => {
              const hardCount = g.items.filter((i) => i.timesWrong >= 2).length;
              return (
                <div
                  key={g.title}
                  className="flex items-center justify-between border-2 border-line rounded-2xl px-5 py-4"
                >
                  <div className="min-w-0">
                    <p className="text-[15px] text-ink truncate">
                      {g.title}
                    </p>
                    <p className="text-[13px] text-ink-muted">
                      {g.items.length} to review
                      {hardCount > 0 && ` · ${hardCount} you keep missing`}
                    </p>
                  </div>
                  <button
                    onClick={() => drill(g.items, 20)}
                    className="btn-outline shrink-0 ml-4 px-4 py-2 text-[14px]"
                  >
                    Drill {Math.min(g.items.length, 20)}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
