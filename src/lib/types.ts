export type QuestionKind = 'multiple_choice' | 'true_false' | 'fill_blank';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanations: string[];
  /** Step-by-step worked solution for math/quantitative questions ('' if n/a). */
  solution?: string;
  kind?: QuestionKind;
  /** Canonical answer for fill-in-the-blank (exam/test only). */
  blankAnswer?: string;
  /** Short topic/subtopic label for mastery breakdowns ('' if none). */
  topic?: string;
}

export const ROUND_SIZES = [10, 20, 30, 40, 50] as const;
export type RoundSize = (typeof ROUND_SIZES)[number];

/** practice = instant feedback per question; exam = feedback only at the end. */
export type QuizMode = 'practice' | 'exam';

/** What the generator should emphasize in this round. */
export type QuizFocus = 'mixed' | 'definitions' | 'comprehension';

export interface AnswerRecord {
  questionIndex: number;
  chosenIndex: number | null;
  /** For fill-in-the-blank questions. */
  textAnswer?: string;
  correct: boolean;
}

export interface DefinitionTerm {
  term: string;
  definition: string;
  sectionId?: string;
}
