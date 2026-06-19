import { useEffect, useState } from 'react';
import { Loader2, BookOpen, ArrowRight, FileText } from 'lucide-react';
import { getSharedCourse, type SharedCourse } from '../lib/courses';

interface Props {
  shareId: string;
  onEnter: () => void;
}

/** Public, read-only view of a shared course — no account required. */
export default function ShareView({ shareId, onEnter }: Props) {
  const [course, setCourse] = useState<SharedCourse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    setLoading(true);
    getSharedCourse(shareId).then((c) => {
      if (on) {
        setCourse(c);
        setLoading(false);
      }
    });
    return () => {
      on = false;
    };
  }, [shareId]);

  return (
    <div className="min-h-screen bg-surface text-ink">
      <header className="sticky top-0 z-10 border-b border-line bg-surface/90 backdrop-blur-sm">
        <div className="mx-auto flex max-w-[820px] items-center justify-between px-5 py-3 md:px-8">
          <span className="inline-flex items-center gap-2 text-[14px] font-semibold">
            <BookOpen size={16} /> Flow
          </span>
          <button
            onClick={onEnter}
            className="btn-primary inline-flex items-center gap-1.5 px-4 py-2 text-[13px]"
          >
            Make your own <ArrowRight size={14} />
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-[820px] px-5 pb-20 pt-10 md:px-8">
        {loading ? (
          <div className="flex items-center gap-2 text-ink-secondary">
            <Loader2 size={16} className="animate-spin" /> Loading…
          </div>
        ) : !course ? (
          <div className="rounded-2xl border border-line bg-surface-muted px-5 py-10 text-center">
            <p className="text-[15px] text-ink">This shared course isn’t available.</p>
            <p className="mt-1 text-[13px] text-ink-secondary">
              The link may be wrong, or sharing was turned off.
            </p>
            <button onClick={onEnter} className="btn-primary mt-5 px-5 py-2.5 text-[14px]">
              Go to Flow
            </button>
          </div>
        ) : (
          <>
            <p className="mb-1 text-[12px] uppercase tracking-[0.1em] text-ink-muted">
              Shared course
            </p>
            <h1 className="font-mondwest text-[34px] leading-tight text-ink md:text-[46px]">
              {course.name}
            </h1>
            {course.description && (
              <p className="mt-2 max-w-[640px] text-[15px] leading-relaxed text-ink-secondary">
                {course.description}
              </p>
            )}

            <div className="mt-8 space-y-3">
              {course.chapters.length === 0 ? (
                <p className="text-[14px] text-ink-muted">No chapters in this course yet.</p>
              ) : (
                course.chapters.map((ch) => (
                  <details
                    key={ch.id}
                    className="group rounded-2xl border border-line bg-surface-card px-5 py-4"
                  >
                    <summary className="flex cursor-pointer list-none items-center justify-between text-[15px] font-medium text-ink">
                      <span className="inline-flex items-center gap-2">
                        <FileText size={15} className="text-ink-muted" />
                        {ch.title}
                      </span>
                      <span className="text-[12px] text-ink-muted group-open:hidden">Read</span>
                    </summary>
                    <div className="mt-3 whitespace-pre-wrap text-[14px] leading-relaxed text-ink-secondary">
                      {ch.content}
                    </div>
                  </details>
                ))
              )}
            </div>

            <div className="mt-10 rounded-2xl border-2 border-line bg-surface-muted px-5 py-6 text-center">
              <p className="text-[16px] font-medium text-ink">Want quizzes on this material?</p>
              <p className="mt-1 text-[13px] text-ink-secondary">
                Flow turns any chapter into progressive quizzes with explanations.
              </p>
              <button onClick={onEnter} className="btn-primary mt-4 gap-2 px-5 py-3 text-[15px]">
                Try Flow free <ArrowRight size={16} />
              </button>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
