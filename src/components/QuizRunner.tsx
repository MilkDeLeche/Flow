import { useState } from 'react';
import { Check, X, ArrowRight } from 'lucide-react';
import MathText from './MathText';
import { useLocale } from '../lib/i18n';
import type { AnswerRecord, QuizMode, QuizQuestion } from '../lib/types';

interface QuizRunnerProps {
  title: string;
  questions: QuizQuestion[];
  mode: QuizMode;
  onFinish: (answers: AnswerRecord[]) => void;
  onQuit: () => void;
}

export default function QuizRunner({
  title,
  questions,
  mode,
  onFinish,
  onQuit,
}: QuizRunnerProps) {
  const { t } = useLocale();
  const [index, setIndex] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  const q = questions[index];
  const isExam = mode === 'exam';
  // Practice locks + reveals on first click; exam lets you change until Next.
  const revealed = !isExam && chosen !== null;
  const isLast = index === questions.length - 1;

  const choose = (i: number) => {
    if (revealed) return; // locked after reveal in practice mode
    setChosen(i);
  };

  const next = () => {
    const record: AnswerRecord = {
      questionIndex: index,
      chosenIndex: chosen,
      correct: chosen === q.correctIndex,
    };
    const updated = [...answers, record];
    setAnswers(updated);

    if (isLast) {
      onFinish(updated);
      return;
    }
    setIndex((i) => i + 1);
    setChosen(null);
  };

  const correctSoFar = answers.filter((a) => a.correct).length;
  const progress = ((index + (chosen !== null ? 1 : 0)) / questions.length) * 100;

  return (
    <section className="max-w-[760px] mx-auto px-5 md:px-8 pt-8 pb-16">
      <div className="flex items-center justify-between mb-3">
        <div className="min-w-0">
          <p className="text-[13px] text-[#b4b8b4] truncate">
            {title}
            <span className="ml-2 uppercase tracking-wide text-[11px]">
              · {isExam ? t.exam : t.practice}
            </span>
          </p>
          <p className="text-[15px] text-[#2c2c2c]">
            {t.questionOf(index + 1, questions.length)}
          </p>
        </div>
        <button
          onClick={onQuit}
          className="text-[13px] text-[#646464] hover:text-[#2c2c2c] transition-colors shrink-0 ml-4"
        >
          {t.quit}
        </button>
      </div>
      <div className="h-1.5 w-full bg-[#eef1ed] rounded-full overflow-hidden mb-8">
        <div
          className="h-full bg-black transition-[width] duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <h2 className="font-mondwest text-[#2c2c2c] text-[24px] md:text-[30px] leading-[1.15] mb-6">
        <MathText text={q.question} />
      </h2>

      <div className="space-y-3">
        {q.options.map((opt, i) => {
          const isCorrect = i === q.correctIndex;
          const isChosen = i === chosen;

          let stateClass =
            'border-[#dde3dd] hover:border-[#b8beb8] hover:bg-[#eef1ed]';
          if (revealed) {
            if (isCorrect) stateClass = 'border-green-500 bg-green-50';
            else if (isChosen) stateClass = 'border-red-400 bg-red-50';
            else stateClass = 'border-[#e8e8e8] opacity-70';
          } else if (isChosen) {
            // exam mode (or pre-reveal): just highlight the selection
            stateClass = 'border-[#2c2c2c] bg-[#eef1ed]';
          }

          return (
            <div key={i}>
              <button
                onClick={() => choose(i)}
                disabled={revealed}
                className={`w-full text-left flex items-start gap-3 px-4 py-3.5 rounded-xl border-2 transition-colors ${stateClass} ${
                  revealed ? 'cursor-default' : ''
                }`}
              >
                <span className="mt-0.5 w-6 h-6 shrink-0 rounded-full border-2 border-current/20 flex items-center justify-center text-[12px] text-[#646464]">
                  {revealed && isCorrect ? (
                    <Check size={14} className="text-green-600" />
                  ) : revealed && isChosen ? (
                    <X size={14} className="text-red-500" />
                  ) : (
                    String.fromCharCode(65 + i)
                  )}
                </span>
                <span className="text-[15px] text-[#2c2c2c] leading-snug">
                  <MathText text={opt} />
                </span>
              </button>

              {revealed && (isChosen || isCorrect) && (
                <p
                  className={`mt-2 ml-9 text-[13.5px] leading-relaxed ${
                    isCorrect ? 'text-green-700' : 'text-red-600'
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

      {/* Worked solution (math/steps) — practice mode only */}
      {revealed && q.solution && q.solution.trim() && (
        <div className="mt-5 ml-9 rounded-xl border border-[#dde3dd] bg-[#f7f9f6] px-4 py-3">
          <p className="text-[12px] uppercase tracking-wide text-[#b4b8b4] mb-1">
            {t.workedSolution}
          </p>
          <div className="text-[13.5px] text-[#2c2c2c] leading-relaxed">
            <MathText text={q.solution} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mt-8">
        <span className="text-[14px] text-[#646464]">
          {isExam
            ? t.answered(answers.length, questions.length)
            : t.score(correctSoFar, answers.length)}
        </span>
        <button
          onClick={next}
          disabled={chosen === null}
          className="inline-flex items-center gap-2 px-5 py-3 text-[15px] bg-black text-white rounded-full hover:bg-[#2c2c2c] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isLast ? t.seeResults : isExam ? t.next : t.nextQuestion}
          <ArrowRight size={16} />
        </button>
      </div>
    </section>
  );
}
