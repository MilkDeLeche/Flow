import { useState } from 'react';
import { Check, X, RotateCcw, ArrowUpRight, FilePlus2, Flag } from 'lucide-react';
import TextFade from './TextFade';
import MathText from './MathText';
import { useLocale } from '../lib/i18n';
import { ROUND_SIZES, type AnswerRecord, type QuizQuestion, type RoundSize } from '../lib/types';

interface ResultsProps {
  title: string;
  questions: QuizQuestion[];
  answers: AnswerRecord[];
  roundSize: RoundSize;
  /** When true, this was a review drill — show review-specific actions. */
  isReview?: boolean;
  onRound: (size: RoundSize) => void;
  onRetake: () => void;
  onNewMaterial: () => void;
  onReport?: (q: QuizQuestion) => void;
}

export default function Results({
  title,
  questions,
  answers,
  roundSize,
  isReview = false,
  onRound,
  onRetake,
  onNewMaterial,
  onReport,
}: ResultsProps) {
  const { t } = useLocale();
  const [reported, setReported] = useState<Set<number>>(new Set());
  const score = answers.filter((a) => a.correct).length;
  const total = questions.length;
  const pct = total > 0 ? Math.round((score / total) * 100) : 0;

  const currentIdx = ROUND_SIZES.indexOf(roundSize);
  const nextSize: RoundSize | null =
    currentIdx >= 0 && currentIdx < ROUND_SIZES.length - 1
      ? ROUND_SIZES[currentIdx + 1]
      : null;

  const byQuestion = new Map(answers.map((a) => [a.questionIndex, a]));

  const verdict =
    pct >= 90 ? t.examReady : pct >= 70 ? t.almostThere : t.keepDrilling;

  return (
    <section className="max-w-[760px] mx-auto px-5 md:px-8 pt-10 pb-16">
      <TextFade direction="up" staggerChildren={0.1}>
        <p className="text-[13px] text-ink-muted mb-1 truncate">{title}</p>
        <h1 className="font-mondwest text-ink text-[40px] md:text-[60px] leading-[0.95] mb-2">
          {score}/{total}
        </h1>
        <p className="text-[16px] text-ink-secondary mb-8">
          {pct}% · {verdict}
        </p>
      </TextFade>

      {/* Review-session actions */}
      {isReview ? (
        <div className="flex flex-wrap gap-3 mb-12">
          <button
            onClick={onRetake}
            className="btn-primary gap-2 px-5 py-3 text-[15px]"
          >
            <RotateCcw size={16} />
            {t.drillMistakes}
          </button>
          <button
            onClick={onNewMaterial}
            className="btn-outline gap-2 px-5 py-3 text-[15px]"
          >
            {t.done}
          </button>
        </div>
      ) : (
        <>
          {/* Next actions */}
          <div className="flex flex-wrap gap-3 mb-12">
        {nextSize ? (
          <button
            onClick={() => onRound(nextSize)}
            className="btn-primary gap-2 px-5 py-3 text-[15px]"
          >
            {t.nextRound(nextSize)}
            <ArrowUpRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => onRound(50)}
            className="btn-primary gap-2 px-5 py-3 text-[15px]"
          >
            {t.another50}
            <ArrowUpRight size={16} />
          </button>
        )}
        <button
          onClick={onRetake}
          className="btn-outline gap-2 px-5 py-3 text-[15px]"
        >
          <RotateCcw size={16} />
          {t.retake(roundSize)}
        </button>
        <button
          onClick={onNewMaterial}
          className="btn-outline gap-2 px-5 py-3 text-[15px]"
        >
          <FilePlus2 size={16} />
          {t.newMaterial}
        </button>
      </div>

      {/* Other round sizes */}
      <div className="mb-12">
        <p className="text-[13px] text-ink-secondary mb-2">{t.jumpRound}</p>
        <div className="flex flex-wrap gap-2">
          {ROUND_SIZES.map((n) => (
            <button
              key={n}
              onClick={() => onRound(n)}
              className={`px-4 py-2 text-[14px] transition-colors ${
                n === roundSize ? 'btn-pill-active' : 'btn-pill'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
        </>
      )}

      {/* Review */}
      <h2 className="font-mondwest text-ink text-[24px] md:text-[28px] mb-5">
        {t.review}
      </h2>
      <div className="space-y-6">
        {questions.map((q, qi) => {
          const a = byQuestion.get(qi);
          const chosen = a?.chosenIndex ?? null;
          const isFillBlank = (q.kind ?? 'multiple_choice') === 'fill_blank';
          const correctText = q.blankAnswer || q.explanations[0] || '';
          return (
            <div
              key={qi}
              className="border-2 border-line rounded-2xl p-5"
            >
              <div className="flex items-start gap-2 mb-3">
                <span
                  className={`mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center ${
                    a?.correct ? 'bg-green-100 dark:bg-green-950/40' : 'bg-red-100 dark:bg-red-950/40'
                  }`}
                >
                  {a?.correct ? (
                    <Check size={13} className="text-green-600 dark:text-green-400" />
                  ) : (
                    <X size={13} className="text-red-500 dark:text-red-400" />
                  )}
                </span>
                <h3 className="text-[16px] font-medium text-ink leading-snug">
                  {qi + 1}. <MathText text={q.question} />
                </h3>
              </div>
              {isFillBlank ? (
                <div className="space-y-1.5 ml-7 text-[14px]">
                  <p className={a?.correct ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-300'}>
                    {a?.textAnswer?.trim()
                      ? <>{t.yourAnswer}: <span className="font-medium">{a.textAnswer}</span>{a?.correct ? ' ✓' : ' ✗'}</>
                      : t.noAnswerGiven}
                  </p>
                  {!a?.correct && correctText && (
                    <p className="text-green-700 dark:text-green-300">
                      {t.correctAnswer}: <span className="font-medium"><MathText text={correctText} /></span>
                    </p>
                  )}
                </div>
              ) : (
              <div className="space-y-1.5 ml-7">
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === q.correctIndex;
                  const isChosen = oi === chosen;
                  return (
                    <div key={oi} className="text-[14px]">
                      <span
                        className={`${
                          isCorrect
                            ? 'text-green-700 dark:text-green-300 font-medium'
                            : isChosen
                            ? 'text-red-600 dark:text-red-300'
                            : 'text-ink-secondary'
                        }`}
                      >
                        {String.fromCharCode(65 + oi)}. <MathText text={opt} />
                        {isCorrect && ' ✓'}
                        {isChosen && !isCorrect && ` ✗ (${t.yourAnswer})`}
                      </span>
                      {(isCorrect || isChosen) && q.explanations[oi] && (
                        <p
                          className={`mt-0.5 text-[13px] leading-relaxed ${
                            isCorrect ? 'text-green-700/90 dark:text-green-300/90' : 'text-red-500 dark:text-red-300'
                          }`}
                        >
                          <MathText text={q.explanations[oi]} />
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
              )}

              {q.solution && q.solution.trim() && (
                <div className="ml-7 mt-3 rounded-xl border border-line bg-surface-muted px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-ink-muted mb-1">
                    {t.workedSolution}
                  </p>
                  <div className="text-[13px] text-ink leading-relaxed">
                    <MathText text={q.solution} />
                  </div>
                </div>
              )}

              {onReport && (
                <div className="ml-7 mt-3">
                  {reported.has(qi) ? (
                    <span className="text-[12px] text-ink-muted">{t.reportThanks}</span>
                  ) : (
                    <button
                      onClick={() => {
                        onReport(q);
                        setReported((prev) => new Set(prev).add(qi));
                      }}
                      className="inline-flex items-center gap-1.5 text-[12px] text-ink-muted transition-colors hover:text-ink-secondary"
                    >
                      <Flag size={12} /> {t.reportQuestion}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
