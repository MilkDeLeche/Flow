// Extract a course name + short description from uploaded material, using the
// user's OWN provider key (BYOK). Anthropic supports PDF/image vision; OpenAI
// and Gemini are text-only here.
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Provider } from './_generateQuiz.js';

export interface ParseCourseInput {
  provider: Provider;
  apiKey: string;
  model: string;
  text?: string;
  pdfBase64?: string;
  imageBase64?: string;
  imageMediaType?: string;
}

export interface CourseMeta {
  name: string;
  description: string;
}

const SYSTEM = `You name a student's course/class from their material (a syllabus, chapter, slides, or a photo of notes).
Return ONLY JSON: {"name": string, "description": string}.
- "name": a short course/class title, max 60 characters (e.g. "Biology 101 — Cell Biology", "Economía: Microeconomía").
- "description": one sentence on what the course covers, max 160 characters.
- Write both in the SAME language as the material. No markdown, no extra keys.`;

const ASK = 'Name this course and describe what it covers, as JSON.';

function clean(raw: string): CourseMeta {
  const cleaned = raw.replace(/^```(?:json)?/i, '').replace(/```$/i, '').trim();
  let obj: { name?: unknown; description?: unknown };
  try {
    obj = JSON.parse(cleaned);
  } catch {
    const s = cleaned.indexOf('{');
    const e = cleaned.lastIndexOf('}');
    if (s < 0 || e <= s) throw new Error('Could not read the course details.');
    obj = JSON.parse(cleaned.slice(s, e + 1));
  }
  const name = String(obj.name ?? '').trim().slice(0, 60) || 'Untitled course';
  const description = String(obj.description ?? '').trim().slice(0, 160);
  return { name, description };
}

async function viaAnthropic(input: ParseCourseInput): Promise<CourseMeta> {
  const client = new Anthropic({ apiKey: input.apiKey });
  const content: Anthropic.ContentBlockParam[] = [];
  if (input.pdfBase64)
    content.push({
      type: 'document',
      source: { type: 'base64', media_type: 'application/pdf', data: input.pdfBase64 },
    });
  if (input.imageBase64)
    content.push({
      type: 'image',
      source: {
        type: 'base64',
        media_type: (input.imageMediaType as 'image/png') || 'image/png',
        data: input.imageBase64,
      },
    });
  content.push({
    type: 'text',
    text: `${ASK}${input.text ? `\n\nMaterial:\n${input.text.slice(0, 12000)}` : ''}`,
  });

  const msg = await client.messages.create({
    model: input.model,
    max_tokens: 400,
    system: SYSTEM,
    messages: [{ role: 'user', content }],
  });
  const block = msg.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
  if (!block) throw new Error('No response from the model.');
  return clean(block.text);
}

async function viaOpenAI(input: ParseCourseInput): Promise<CourseMeta> {
  const client = new OpenAI({ apiKey: input.apiKey });
  const r = await client.chat.completions.create({
    model: input.model,
    max_tokens: 400,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: SYSTEM },
      { role: 'user', content: `${ASK}\n\nMaterial:\n${(input.text || '').slice(0, 12000)}` },
    ],
  });
  return clean(r.choices[0]?.message?.content || '');
}

async function viaGemini(input: ParseCourseInput): Promise<CourseMeta> {
  const genAI = new GoogleGenerativeAI(input.apiKey);
  const model = genAI.getGenerativeModel({
    model: input.model,
    systemInstruction: SYSTEM,
    generationConfig: { responseMimeType: 'application/json', maxOutputTokens: 400 },
  });
  const r = await model.generateContent(
    `${ASK}\n\nMaterial:\n${(input.text || '').slice(0, 12000)}`
  );
  return clean(r.response.text());
}

export async function parseCourse(input: ParseCourseInput): Promise<CourseMeta> {
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
