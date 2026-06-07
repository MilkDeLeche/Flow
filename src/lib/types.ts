export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanations: string[];
  /** Step-by-step worked solution for math/quantitative questions ('' if n/a). */
  solution?: string;
}

export const ROUND_SIZES = [10, 20, 30, 40, 50] as const;
export type RoundSize = (typeof ROUND_SIZES)[number];

/** practice = instant feedback per question; exam = feedback only at the end. */
export type QuizMode = 'practice' | 'exam';

export interface AnswerRecord {
  questionIndex: number;
  chosenIndex: number | null;
  correct: boolean;
}
