// Multi-provider quiz generation. Free tier uses Anthropic Haiku on the server
// key; BYOK users pick their provider (Anthropic / OpenAI / Gemini), key, and
// model. All adapters return the same validated QuizQuestion[].
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { PROVIDER_MODELS, type Provider } from './_providers.js';
export { FREE_MODEL, isProvider, keyLooksValid, resolveModel, type Provider } from './_providers.js';

export interface QuizQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanations: string[];
  solution?: string;
}

export interface GenerateQuizInput {
  material: string;
  count: number;
  avoid?: string[];
  pdfBase64?: string; // Anthropic vision only
  provider: Provider;
  apiKey: string;
  model: string;
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
        },
        required: ['question', 'options', 'correctIndex', 'explanations', 'solution'],
      },
    },
  },
  required: ['questions'],
} as const;

function systemPrompt(count: number): string {
  return `You are an expert tutor that writes high-quality multiple-choice study quizzes from a student's source material (textbook chapters, lecture slides / "diapositivas", PDFs, notes).

Write exactly ${count} multiple-choice questions based ONLY on the provided material.

Rules:
- Detect the language of the material and write every question, option, and explanation in that SAME language.
- Each question has exactly 4 options; exactly one is correct. Vary the position of the correct answer.
- "correctIndex" is the 0-based index (0-3) of the correct option.
- "explanations" has exactly 4 entries aligned to the options. For the correct one, say why it's right; for each wrong one, say specifically WHY it's wrong so the student learns. 1-3 sentences each.
- "solution": for quantitative/math questions, a step-by-step worked solution (formula then steps). Use LaTeX for math: $...$ inline and $$...$$ for display equations. For purely conceptual questions, use an empty string "".
- Cover the breadth of the material; some overlap across questions is fine for exam readiness.
- Base everything strictly on the material; do not invent unsupported facts.`;
}

// For providers without schema enforcement (OpenAI/Gemini) — describe the shape.
const SHAPE = `Return ONLY valid JSON (no markdown, no prose) of the form:
{"questions":[{"question":string,"options":[string,string,string,string],"correctIndex":0-3,"explanations":[string,string,string,string],"solution":string}]}`;

function cleanQuestions(raw: unknown): QuizQuestion[] {
  const parsed = raw as { questions?: QuizQuestion[] };
  const clean = (parsed.questions || [])
    .filter(
      (q) =>
        q &&
        typeof q.question === 'string' &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        Array.isArray(q.explanations) &&
        q.explanations.length === 4 &&
        Number.isInteger(q.correctIndex) &&
        q.correctIndex >= 0 &&
        q.correctIndex < 4
    )
    .map((q) => ({ ...q, solution: typeof q.solution === 'string' ? q.solution : '' }));
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

  const content: Anthropic.ContentBlockParam[] = input.pdfBase64
    ? [
        {
          type: 'document',
          source: { type: 'base64', media_type: 'application/pdf', data: input.pdfBase64 },
        },
        { type: 'text', text: `Use the attached document, including diagrams/figures.\n\n${userText(input, false)}` },
      ]
    : [{ type: 'text', text: userText(input, false) }];

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
    system: systemPrompt(input.count),
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
      { role: 'system', content: systemPrompt(input.count) },
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
    systemInstruction: systemPrompt(input.count),
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
