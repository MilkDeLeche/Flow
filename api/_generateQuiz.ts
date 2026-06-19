// Multi-provider quiz generation. Free tier uses Anthropic Haiku on the server
// key; BYOK users pick their provider (Anthropic / OpenAI / Gemini), key, and
// model. All adapters return the same validated QuizQuestion[].
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Provider } from './_providers.js';
export { FREE_MODEL, isProvider, keyLooksValid, resolveModel, type Provider } from './_providers.js';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanations: string[];
  solution?: string;
  kind?: 'multiple_choice' | 'true_false' | 'fill_blank';
  blankAnswer?: string;
}

export type QuizFocus = 'mixed' | 'definitions' | 'comprehension';

export interface GenerateQuizInput {
  material: string;
  count: number;
  avoid?: string[];
  pdfBase64?: string; // Anthropic vision only
  imageBase64?: string; // photo of notes/textbook — Anthropic vision only
  imageMediaType?: string;
  provider: Provider;
  apiKey: string;
  model: string;
  focus?: QuizFocus;
  /** Full exam at 50 questions — include T/F and fill-in-the-blank. */
  isTest?: boolean;
  definitionsBlock?: string;
}

const SCHEMA = {
  type: 'object',
  additionalProperties: false,
  properties: {
    questions: {
      type: 'array',
      items: {
        type: 'object',
        additionalProperties: false,
        properties: {
          question: { type: 'string' },
          options: { type: 'array', items: { type: 'string' } },
          correctIndex: { type: 'integer' },
          explanations: { type: 'array', items: { type: 'string' } },
          solution: { type: 'string' },
          kind: { type: 'string' },
          blankAnswer: { type: 'string' },
        },
        required: ['question', 'options', 'correctIndex', 'explanations', 'solution', 'kind', 'blankAnswer'],
      },
    },
  },
  required: ['questions'],
} as const;

function systemPrompt(input: GenerateQuizInput): string {
  const count = input.count;
  const focus = input.focus ?? 'mixed';
  const isTest = !!input.isTest;

  const focusLine =
    focus === 'definitions'
      ? 'Focus heavily on vocabulary, definitions, and "what is X" style questions from bold terms and explicit definitions.'
      : focus === 'comprehension'
        ? 'Focus on reading comprehension: main ideas, cause/effect, comparisons, and applying what was read.'
        : 'Mix definition-style, comprehension, and applied questions across the material.';

  const formatLine = isTest
    ? `This is a full TEST (exam simulation). Include a mix of question kinds:
- About 55% standard multiple-choice (4 options, kind "multiple_choice").
- About 25% true/false (kind "true_false", options exactly ["True","False"], correctIndex 0 or 1, explanations length 2).
- About 20% fill-in-the-blank (kind "fill_blank", options [], correctIndex 0, blankAnswer = canonical short answer, explanations length 1 with the accepted answer).
For math, economics, or quantitative material, include applied calculation questions with step-by-step "solution" using LaTeX where helpful.`
    : `Use kind "multiple_choice" for every question (4 options). Do NOT use true/false or fill-in-the-blank in practice quizzes.`;

  return `You are an expert tutor that writes high-quality study quizzes from a student's source material (textbook chapters, lecture slides / "diapositivas", PDFs, notes).

Write exactly ${count} questions based ONLY on the provided material.

${focusLine}
${formatLine}

Rules:
- Detect the language, script, and dialect/register of the material and write every question, option, explanation, and solution in that SAME language.
- If the material intentionally mixes languages, use the dominant study language while preserving original technical terms, names, and quoted phrases.
- For multiple_choice: exactly 4 options; exactly one is correct. Vary the position of the correct answer.
- "correctIndex" is the 0-based index of the correct option (0 for fill_blank).
- "explanations" aligns to options (4 for MCQ, 2 for T/F, 1 for fill_blank).
- "solution": for quantitative/math questions, a step-by-step worked solution (formula then steps). Use LaTeX: $...$ inline and $$...$$ display. For purely conceptual questions, use "".
- "kind": "multiple_choice" | "true_false" | "fill_blank".
- "blankAnswer": required string for fill_blank; empty string "" otherwise.
- Cover the breadth of the material; some overlap across questions is fine for exam readiness.
- Ignore footnotes, endnotes, bibliographies, citation lists, copyright text, page headers/footers, and source metadata unless the main body explicitly teaches that content.
- Base everything strictly on the material; do not invent unsupported facts.${input.definitionsBlock ?? ''}`;
}

const SHAPE = `Return ONLY valid JSON (no markdown, no prose) of the form:
{"questions":[{"question":string,"options":[string,...],"correctIndex":0-3,"explanations":[string,...],"solution":string,"kind":"multiple_choice"|"true_false"|"fill_blank","blankAnswer":string}]}`;

function cleanQuestions(raw: unknown): QuizQuestion[] {
  const parsed = raw as { questions?: QuizQuestion[] };
  const clean = (parsed.questions || [])
    .map((q) => {
      if (!q || typeof q.question !== 'string') return null;
      const kind =
        q.kind === 'true_false' || q.kind === 'fill_blank' || q.kind === 'multiple_choice'
          ? q.kind
          : 'multiple_choice';

      if (kind === 'fill_blank') {
        const blankAnswer =
          typeof q.blankAnswer === 'string' && q.blankAnswer.trim()
            ? q.blankAnswer.trim()
            : '';
        if (!blankAnswer) return null;
        return {
          question: q.question,
          options: [],
          correctIndex: 0,
          explanations: Array.isArray(q.explanations) ? q.explanations : [blankAnswer],
          solution: typeof q.solution === 'string' ? q.solution : '',
          kind,
          blankAnswer,
        } satisfies QuizQuestion;
      }

      if (kind === 'true_false') {
        const options =
          Array.isArray(q.options) && q.options.length === 2
            ? q.options
            : ['True', 'False'];
        const correctIndex = q.correctIndex === 1 ? 1 : 0;
        const explanations =
          Array.isArray(q.explanations) && q.explanations.length >= 2
            ? q.explanations.slice(0, 2)
            : ['', ''];
        return {
          question: q.question,
          options,
          correctIndex,
          explanations,
          solution: typeof q.solution === 'string' ? q.solution : '',
          kind,
          blankAnswer: '',
        } satisfies QuizQuestion;
      }

      if (
        !Array.isArray(q.options) ||
        q.options.length !== 4 ||
        !Array.isArray(q.explanations) ||
        q.explanations.length !== 4 ||
        !Number.isInteger(q.correctIndex) ||
        q.correctIndex < 0 ||
        q.correctIndex >= 4
      ) {
        return null;
      }

      return {
        ...q,
        kind: 'multiple_choice' as const,
        solution: typeof q.solution === 'string' ? q.solution : '',
        blankAnswer: '',
      } satisfies QuizQuestion;
    })
    .filter(Boolean) as QuizQuestion[];

  if (!clean.length) throw new Error('No valid questions were generated.');
  return clean;
}

function parseJsonLoose(text: string): unknown {
  // Strip code fences and grab the outermost JSON object if needed.
  const cleaned = text.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start >= 0 && end > start) return JSON.parse(cleaned.slice(start, end + 1));
    throw new Error('Model returned invalid JSON.');
  }
}

function userText(input: GenerateQuizInput, withShape: boolean): string {
  const avoidNote =
    input.avoid && input.avoid.length
      ? `\n\nVary phrasing/angle from these earlier questions (repetition of concepts is fine):\n- ${input.avoid.slice(0, 60).join('\n- ')}`
      : '';
  return `Create the quiz from this material:\n\n${input.material}${avoidNote}${
    withShape ? `\n\n${SHAPE}` : ''
  }`;
}

// ------------------------------ Anthropic ------------------------------
async function viaAnthropic(input: GenerateQuizInput): Promise<QuizQuestion[]> {
  const client = new Anthropic({ apiKey: input.apiKey });
  const isHaiku = input.model.includes('haiku');

  let content: Anthropic.ContentBlockParam[];
  if (input.pdfBase64) {
    content = [
      {
        type: 'document',
        source: { type: 'base64', media_type: 'application/pdf', data: input.pdfBase64 },
      },
      { type: 'text', text: `Use the attached document, including diagrams/figures.\n\n${userText(input, false)}` },
    ];
  } else if (input.imageBase64) {
    content = [
      {
        type: 'image',
        source: {
          type: 'base64',
          media_type: (input.imageMediaType || 'image/png') as 'image/png',
          data: input.imageBase64,
        },
      },
      {
        type: 'text',
        text: `The attached image is a photo of study material (textbook page, handwritten or typed notes, or slides). Read ALL visible text carefully, including handwriting, and use any diagrams.\n\n${userText(input, false)}`,
      },
    ];
  } else {
    content = [{ type: 'text', text: userText(input, false) }];
  }

  const stream = client.messages.stream({
    model: input.model,
    max_tokens: 32000,
    // Haiku doesn't support adaptive thinking / effort; richer models do.
    ...(isHaiku
      ? { output_config: { format: { type: 'json_schema', schema: SCHEMA } } }
      : {
          thinking: { type: 'adaptive' },
          output_config: {
            effort: 'medium',
            format: { type: 'json_schema', schema: SCHEMA },
          },
        }),
    system: systemPrompt(input),
    messages: [{ role: 'user', content }],
  });
  const message = await stream.finalMessage();
  const block = message.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  if (!block) throw new Error('No text content returned.');
  return cleanQuestions(JSON.parse(block.text));
}

// ------------------------------- OpenAI --------------------------------
async function viaOpenAI(input: GenerateQuizInput): Promise<QuizQuestion[]> {
  const client = new OpenAI({ apiKey: input.apiKey });
  const r = await client.chat.completions.create({
    model: input.model,
    max_tokens: 16000,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt(input) },
      { role: 'user', content: userText(input, true) },
    ],
  });
  const text = r.choices[0]?.message?.content || '';
  return cleanQuestions(parseJsonLoose(text));
}

// ------------------------------- Gemini --------------------------------
async function viaGemini(input: GenerateQuizInput): Promise<QuizQuestion[]> {
  const genAI = new GoogleGenerativeAI(input.apiKey);
  const model = genAI.getGenerativeModel({
    model: input.model,
    systemInstruction: systemPrompt(input),
    generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 16000 },
  });
  const r = await model.generateContent(userText(input, true));
  return cleanQuestions(parseJsonLoose(r.response.text()));
}

export async function generateQuiz(input: GenerateQuizInput): Promise<QuizQuestion[]> {
  switch (input.provider) {
    case 'openai':
      return viaOpenAI(input);
    case 'gemini':
      return viaGemini(input);
    case 'anthropic':
    default:
      return viaAnthropic(input);
  }
}
