import { Check, X, RotateCcw, ArrowUpRight, FilePlus2 } from 'lucide-react';
import TextFade from './TextFade';
import MathText from './MathText';
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
}: ResultsProps) {
  const score = answers.filter((a) => a.correct).length;
  const total = questions.length;
  const pct = Math.round((score / total) * 100);

  const currentIdx = ROUND_SIZES.indexOf(roundSize);
  const nextSize: RoundSize | null =
    currentIdx >= 0 && currentIdx < ROUND_SIZES.length - 1
      ? ROUND_SIZES[currentIdx + 1]
      : null;

  const byQuestion = new Map(answers.map((a) => [a.questionIndex, a]));

  const verdict =
    pct >= 90 ? 'Exam-ready' : pct >= 70 ? 'Almost there' : 'Keep drilling';

  return (
    <section className="max-w-[760px] mx-auto px-5 md:px-8 pt-10 pb-16">
      <TextFade direction="up" staggerChildren={0.1}>
        <p className="text-[13px] text-[#b4b8b4] mb-1 truncate">{title}</p>
        <h1 className="font-mondwest text-[#2c2c2c] text-[40px] md:text-[60px] leading-[0.95] mb-2">
          {score}/{total}
        </h1>
        <p className="text-[16px] text-[#444141] mb-8">
          {pct}% · {verdict}
        </p>
      </TextFade>

      {/* Review-session actions */}
      {isReview ? (
        <div className="flex flex-wrap gap-3 mb-12">
          <button
            onClick={onRetake}
            className="inline-flex items-center gap-2 px-5 py-3 text-[15px] bg-black text-white rounded-full hover:bg-[#2c2c2c] transition-colors"
          >
            <RotateCcw size={16} />
            Drill remaining mistakes
          </button>
          <button
            onClick={onNewMaterial}
            className="inline-flex items-center gap-2 px-5 py-3 text-[15px] bg-white border-2 border-[#dde3dd] rounded-full hover:bg-[#eef1ed] transition-colors"
          >
            Done
          </button>
        </div>
      ) : (
        <>
          {/* Next actions */}
          <div className="flex flex-wrap gap-3 mb-12">
        {nextSize ? (
          <button
            onClick={() => onRound(nextSize)}
            className="inline-flex items-center gap-2 px-5 py-3 text-[15px] bg-black text-white rounded-full hover:bg-[#2c2c2c] transition-colors"
          >
            Next round: {nextSize} questions
            <ArrowUpRight size={16} />
          </button>
        ) : (
          <button
            onClick={() => onRound(50)}
            className="inline-flex items-center gap-2 px-5 py-3 text-[15px] bg-black text-white rounded-full hover:bg-[#2c2c2c] transition-colors"
          >
            Another 50 — full drill
            <ArrowUpRight size={16} />
          </button>
        )}
        <button
          onClick={onRetake}
          className="inline-flex items-center gap-2 px-5 py-3 text-[15px] bg-white border-2 border-[#dde3dd] rounded-full hover:bg-[#eef1ed] transition-colors"
        >
          <RotateCcw size={16} />
          Retake {roundSize}
        </button>
        <button
          onClick={onNewMaterial}
          className="inline-flex items-center gap-2 px-5 py-3 text-[15px] bg-white border-2 border-[#dde3dd] rounded-full hover:bg-[#eef1ed] transition-colors"
        >
          <FilePlus2 size={16} />
          New material
        </button>
      </div>

      {/* Other round sizes */}
      <div className="mb-12">
        <p className="text-[13px] text-[#646464] mb-2">Jump to a round size</p>
        <div className="flex flex-wrap gap-2">
          {ROUND_SIZES.map((n) => (
            <button
              key={n}
              onClick={() => onRound(n)}
              className={`px-4 py-2 text-[14px] rounded-full border-2 transition-colors ${
                n === roundSize
                  ? 'border-[#b8beb8] bg-[#eef1ed] text-[#2c2c2c]'
                  : 'border-[#dde3dd] bg-white text-[#2c2c2c] hover:bg-[#eef1ed]'
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
      <h2 className="font-mondwest text-[#2c2c2c] text-[24px] md:text-[28px] mb-5">
        Review
      </h2>
      <div className="space-y-6">
        {questions.map((q, qi) => {
          const a = byQuestion.get(qi);
          const chosen = a?.chosenIndex ?? null;
          return (
            <div
              key={qi}
              className="border-2 border-[#dee2de] rounded-2xl p-5"
            >
              <div className="flex items-start gap-2 mb-3">
                <span
                  className={`mt-0.5 w-5 h-5 shrink-0 rounded-full flex items-center justify-center ${
                    a?.correct ? 'bg-green-100' : 'bg-red-100'
                  }`}
                >
                  {a?.correct ? (
                    <Check size={13} className="text-green-600" />
                  ) : (
                    <X size={13} className="text-red-500" />
                  )}
                </span>
                <h3 className="text-[16px] font-medium text-[#2c2c2c] leading-snug">
                  {qi + 1}. <MathText text={q.question} />
                </h3>
              </div>
              <div className="space-y-1.5 ml-7">
                {q.options.map((opt, oi) => {
                  const isCorrect = oi === q.correctIndex;
                  const isChosen = oi === chosen;
                  return (
                    <div key={oi} className="text-[14px]">
                      <span
                        className={`${
                          isCorrect
                            ? 'text-green-700 font-medium'
                            : isChosen
                            ? 'text-red-600'
                            : 'text-[#646464]'
                        }`}
                      >
                        {String.fromCharCode(65 + oi)}. <MathText text={opt} />
                        {isCorrect && ' ✓'}
                        {isChosen && !isCorrect && ' ✗ (your answer)'}
                      </span>
                      {(isCorrect || isChosen) && (
                        <p
                          className={`mt-0.5 text-[13px] leading-relaxed ${
                            isCorrect ? 'text-green-700/90' : 'text-red-500'
                          }`}
                        >
                          <MathText text={q.explanations[oi]} />
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>

              {q.solution && q.solution.trim() && (
                <div className="ml-7 mt-3 rounded-xl border border-[#dde3dd] bg-[#f7f9f6] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-wide text-[#b4b8b4] mb-1">
                    Worked solution
                  </p>
                  <div className="text-[13px] text-[#2c2c2c] leading-relaxed">
                    <MathText text={q.solution} />
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
