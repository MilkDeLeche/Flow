import { useEffect, useState } from 'react';
import { Check, X, ArrowRight, BookOpen, ExternalLink, Flag } from 'lucide-react';
import MathText from './MathText';
import { findQuestionSource } from '../lib/chapter';
import { useLocale } from '../lib/i18n';
import type { AnswerRecord, QuizMode, QuizQuestion } from '../lib/types';

interface QuizRunnerProps {
  title: string;
  questions: QuizQuestion[];
  mode: QuizMode;
  material?: string;
  onOpenSource?: (sectionId?: string) => void;
  onReport?: (q: QuizQuestion) => void;
  onFinish: (answers: AnswerRecord[]) => void;
  onQuit: () => void;
}

function normalizeAnswer(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}

export default function QuizRunner({
  title,
  questions,
  mode,
  material,
  onOpenSource,
  onReport,
  onFinish,
  onQuit,
}: QuizRunnerProps) {
  const { t } = useLocale();
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [textAnswer, setTextAnswer] = useState('');
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);
  const [reported, setReported] = useState<Set<number>>(new Set());

  const q = questions[index];
  const kind = q.kind ?? 'multiple_choice';
  const isExam = mode === 'exam';
  const revealed = !isExam && chosen !== null;
  const isLast = index === questions.length - 1;
  const blankCorrect =
    kind === 'fill_blank' &&
    normalizeAnswer(textAnswer) === normalizeAnswer(q.blankAnswer || q.explanations[0] || '');

  const choose = (i: number) => {
    if (revealed) return;
    setChosen(i);
  };

  const canContinue =
    kind === 'fill_blank'
      ? textAnswer.trim().length > 0
      : chosen !== null;

  const next = () => {
    const correct =
      kind === 'fill_blank'
        ? blankCorrect
        : chosen === q.correctIndex;

    const record: AnswerRecord = {
      questionIndex: index,
      chosenIndex: kind === 'fill_blank' ? null : chosen,
      textAnswer: kind === 'fill_blank' ? textAnswer.trim() : undefined,
      correct,
    };
    const updated = [...answers, record];
    setAnswers(updated);

    if (isLast) {
      onFinish(updated);
      return;
    }
    setIndex((i) => i + 1);
    setChosen(null);
    setTextAnswer('');
  };

  // Keyboard shortcuts: number keys pick an option, Enter advances. Lets
  // students rip through a round without reaching for the mouse each time.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement | null)?.tagName;
      const typing = tag === 'INPUT' || tag === 'TEXTAREA';

      if (e.key === 'Enter') {
        if (canContinue) {
          e.preventDefault();
          next();
        }
        return;
      }
      if (typing || kind === 'fill_blank' || revealed) return;

      const n = Number(e.key);
      if (Number.isInteger(n) && n >= 1 && n <= q.options.length) {
        e.preventDefault();
        choose(n - 1);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index, chosen, textAnswer, kind, revealed, canContinue]);

  const correctSoFar = answers.filter((a) => a.correct).length;
  const progress = ((index + (canContinue ? 1 : 0)) / questions.length) * 100;
  const source = material ? findQuestionSource(q.question, material) : null;
  const showReveal = revealed || (kind === 'fill_blank' && !isExam && textAnswer.trim());

  return (
    <section className="mx-auto max-w-[860px] px-5 pb-16 pt-8 md:px-8">
      <div className="mb-3 flex items-center justify-between">
        <div className="min-w-0">
          <p className="truncate text-[13px] text-ink-muted">
            {title}
            <span className="ml-2 text-[11px] uppercase tracking-wide">
              · {isExam ? t.exam : t.practice}
              {kind !== 'multiple_choice' ? ` · ${kind.replace('_', ' ')}` : ''}
            </span>
          </p>
          <p className="text-[15px] text-ink">
            {t.questionOf(index + 1, questions.length)}
          </p>
        </div>
        <button
          onClick={onQuit}
          className="ml-4 shrink-0 text-[13px] text-ink-secondary transition-colors hover:text-ink"
        >
          {t.quit}
        </button>
      </div>
      <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-surface-muted">
        <div
          className="h-full bg-accent transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <h2 className="mb-6 font-mondwest text-[24px] leading-[1.15] text-ink md:text-[30px]">
        <MathText text={q.question} />
      </h2>

      {source && (
        <div className="mb-6 rounded-xl border border-line bg-surface-muted px-4 py-3">
          <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
            <p className="inline-flex items-center gap-2 text-[12px] font-medium uppercase text-ink-secondary">
              <BookOpen size={14} /> {t.sourceContext}
            </p>
            {onOpenSource && (
              <button
                onClick={() => onOpenSource(source.sectionId)}
                className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-card px-3 py-1.5 text-[12px] text-ink transition-colors hover:bg-surface-muted"
              >
                {t.openInChapter}
                <ExternalLink size={12} />
              </button>
            )}
          </div>
          <p className="mb-1 text-[13px] font-medium text-ink">{source.sectionTitle}</p>
          <p className="text-[13px] leading-relaxed text-ink-secondary">{source.excerpt}</p>
        </div>
      )}

      {kind === 'fill_blank' ? (
        <div className="space-y-3">
          <input
            value={textAnswer}
            onChange={(e) => setTextAnswer(e.target.value)}
            disabled={revealed}
            placeholder={t.fillBlankPlaceholder}
            className={`w-full rounded-xl border-2 bg-surface-card px-4 py-3.5 text-[15px] outline-none transition-colors ${
              showReveal && !isExam
                ? blankCorrect
                  ? 'border-green-500 bg-green-50 dark:bg-green-950/30'
                  : 'border-red-400 bg-red-50 dark:bg-red-950/30'
                : 'border-line focus:border-line-strong'
            }`}
          />
          {showReveal && !isExam && (
            <p
              className={`text-[13.5px] leading-relaxed ${
                blankCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-300'
              }`}
            >
              {blankCorrect ? '✓ ' : '✗ '}
              <MathText text={q.explanations[0] || q.blankAnswer || ''} />
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {q.options.map((opt, i) => {
            const isCorrect = i === q.correctIndex;
            const isChosen = i === chosen;

            let stateClass =
              'border-line hover:border-line-strong hover:bg-surface-muted';
            if (revealed) {
              if (isCorrect) stateClass = 'border-green-500 bg-green-50 dark:bg-green-950/30';
              else if (isChosen) stateClass = 'border-red-400 bg-red-50 dark:bg-red-950/30';
              else stateClass = 'border-line opacity-70';
            } else if (isChosen) {
              stateClass = 'border-accent bg-surface-muted';
            }

            return (
              <div key={i}>
                <button
                  onClick={() => choose(i)}
                  disabled={revealed}
                  className={`flex w-full items-start gap-3 rounded-xl border-2 px-4 py-3.5 text-left transition-colors ${stateClass} ${
                    revealed ? 'cursor-default' : ''
                  }`}
                >
                  <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full border-2 border-current/20 text-[12px] text-ink-secondary">
                    {revealed && isCorrect ? (
                      <Check size={14} className="text-green-600" />
                    ) : revealed && isChosen ? (
                      <X size={14} className="text-red-500" />
                    ) : kind === 'true_false' ? (
                      i === 0 ? 'T' : 'F'
                    ) : (
                      String.fromCharCode(65 + i)
                    )}
                  </span>
                  <span className="text-[15px] leading-snug text-ink">
                    <MathText text={opt} />
                  </span>
                </button>

                {revealed && (isChosen || isCorrect) && q.explanations[i] && (
                  <p
                    className={`ml-9 mt-2 text-[13.5px] leading-relaxed ${
                      isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-300'
                    }`}
                  >
                    {isCorrect ? '✓ ' : '✗ '}
                    <MathText text={q.explanations[i]} />
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}

      {showReveal && !isExam && q.solution && q.solution.trim() && (
        <div className="ml-0 mt-5 rounded-xl border border-line bg-surface-muted px-4 py-3">
          <p className="mb-1 text-[12px] uppercase tracking-wide text-ink-muted">
            {t.workedSolution}
          </p>
          <div className="text-[13.5px] leading-relaxed text-ink">
            <MathText text={q.solution} />
          </div>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <span className="text-[14px] text-ink-secondary">
          {isExam
            ? t.answered(answers.length, questions.length)
            : t.score(correctSoFar, answers.length)}
        </span>
        <button
          onClick={next}
          disabled={!canContinue}
          className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-[15px] text-accent-ink transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isLast ? t.seeResults : isExam ? t.next : t.nextQuestion}
          <ArrowRight size={16} />
        </button>
      </div>

      {onReport && (
        <div className="mt-6 text-center">
          {reported.has(index) ? (
            <span className="text-[12px] text-ink-muted">{t.reportThanks}</span>
          ) : (
            <button
              onClick={() => {
                onReport(q);
                setReported((prev) => new Set(prev).add(index));
              }}
              className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted transition-colors hover:text-ink-secondary"
            >
              <Flag size={12} /> {t.reportQuestion}
            </button>
          )}
        </div>
      )}
    </section>
  );
}
