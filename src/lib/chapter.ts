export interface ChapterSection {
  id: string;
  title: string;
  body: string;
  index: number;
}

export interface SourceMatch {
  sectionId: string;
  sectionTitle: string;
  excerpt: string;
}

export interface DefinitionTerm {
  term: string;
  definition: string;
  sectionId?: string;
}

const HEADING_RE =
  /^(chapter\s+\d+|unit\s+\d+|section\s+\d+|part\s+\d+|lesson\s+\d+|\d+(\.\d+)+\s+|\d+\.\s+[A-Z]|[A-Z][A-Z0-9\s:,-]{8,})/i;

const SUBHEADING_RE =
  /^(\d+(\.\d+)+\s+.{3,80}|[A-Z][a-z]+(?:\s+[A-Z][a-z]+){0,5}:?\s*$)/;

function cleanLine(line: string): string {
  return line.replace(/\s+/g, ' ').trim();
}

export function inferChapterTitle(
  content: string,
  fallback = 'Untitled chapter',
  useFirstSentence = true
): string {
  const lines = content
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((line) => line.length >= 4 && line.length <= 90);

  const heading = lines.find((line) => HEADING_RE.test(line));
  if (heading) return heading.replace(/^chapter\s*/i, 'Chapter ').slice(0, 80);

  const firstSentence = cleanLine(content).match(/^(.{16,90}?)([.!?]|$)/)?.[1];
  if (useFirstSentence && firstSentence) return firstSentence.slice(0, 80);

  return fallback;
}

export function prepareStudyMaterial(content: string): string {
  const lines = content.split(/\r?\n/);
  const cleaned: string[] = [];
  let inNotes = false;

  for (const raw of lines) {
    const line = raw.trim();
    const startsNotes =
      /^(footnotes?|endnotes?|references|bibliography|works cited|citations)\b[:\s-]*/i.test(
        line
      );

    if (startsNotes) {
      inNotes = true;
      continue;
    }

    if (inNotes) {
      const looksLikeNewSection =
        line.length >= 4 &&
        line.length <= 90 &&
        HEADING_RE.test(line) &&
        !/^(footnotes?|endnotes?|references|bibliography|works cited|citations)\b/i.test(
          line
        );
      if (!looksLikeNewSection) continue;
      inNotes = false;
    }

    const footnoteOnly =
      /^(\[\d+\]|\d+\.|\d+\)|[*†‡])\s+.{0,240}$/u.test(line) &&
      /(doi|isbn|http|www\.|press|journal|vol\.|pp\.|retrieved|accessed|university|copyright|©)/i.test(
        line
      );
    if (footnoteOnly) continue;

    cleaned.push(raw);
  }

  return cleaned.join('\n').replace(/\n{4,}/g, '\n\n\n').trim();
}

export function readingMinutes(content: string): number {
  const words = cleanLine(content).split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
}

export function splitChapterSections(content: string): ChapterSection[] {
  const lines = content.split(/\r?\n/).map((line) => line.trim());
  const sections: ChapterSection[] = [];
  let currentTitle = 'Opening';
  let currentBody: string[] = [];

  const pushSection = (title: string, body: string) => {
    const trimmed = body.trim();
    if (!trimmed) return;
    sections.push({
      id: `section-${sections.length + 1}`,
      title,
      body: trimmed,
      index: sections.length + 1,
    });
  };

  const flush = () => {
    pushSection(currentTitle, currentBody.join('\n'));
    currentBody = [];
  };

  for (const raw of lines) {
    const line = cleanLine(raw);
    const bodyLen = currentBody.join(' ').length;
    const looksLikeMajorHeading =
      line.length >= 4 &&
      line.length <= 90 &&
      HEADING_RE.test(line) &&
      bodyLen > 180;
    const looksLikeSubHeading =
      !looksLikeMajorHeading &&
      line.length >= 6 &&
      line.length <= 80 &&
      SUBHEADING_RE.test(line) &&
      bodyLen > 900;

    if (looksLikeMajorHeading || looksLikeSubHeading) {
      flush();
      currentTitle = line.replace(/^section\s+/i, 'Section ').replace(/^chapter\s+/i, 'Chapter ');
      continue;
    }

    if (raw) currentBody.push(raw);
  }
  flush();

  if (sections.length > 1) {
    return sections.slice(0, 24).map((s, i) => ({ ...s, index: i + 1 }));
  }

  const paragraphs = content
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length <= 2) {
    return [
      {
        id: 'section-1',
        title: 'Chapter text',
        body: content.trim(),
        index: 1,
      },
    ];
  }

  const targetChars = Math.max(900, Math.ceil(content.length / 8));
  const grouped: ChapterSection[] = [];
  let bucket: string[] = [];
  let bucketLen = 0;

  for (const paragraph of paragraphs) {
    bucket.push(paragraph);
    bucketLen += paragraph.length;
    if (bucketLen >= targetChars) {
      grouped.push({
        id: `section-${grouped.length + 1}`,
        title: `Section ${grouped.length + 1}`,
        body: bucket.join('\n\n'),
        index: grouped.length + 1,
      });
      bucket = [];
      bucketLen = 0;
    }
  }

  if (bucket.length) {
    grouped.push({
      id: `section-${grouped.length + 1}`,
      title: `Section ${grouped.length + 1}`,
      body: bucket.join('\n\n'),
      index: grouped.length + 1,
    });
  }

  return grouped.slice(0, 24);
}

const DEFINITION_PATTERNS: RegExp[] = [
  /^\*\*(.+?)\*\*[:\s—-]+(.+)$/u,
  /^__(.+?)__[:\s—-]+(.+)$/u,
  /^([A-Z][A-Za-z0-9\s/-]{2,40})\s*[—–-]\s*(.{8,})$/u,
  /^([A-Z][A-Za-z0-9\s/-]{2,40}):\s*(.{8,})$/u,
  /^(?:define|definition of)\s+(.+?)[:\s—-]+(.+)$/iu,
  /^"(.+?)"\s+(?:means|refers to|is defined as)\s+(.+)$/iu,
];

export function extractDefinitions(content: string): DefinitionTerm[] {
  const sections = splitChapterSections(content);
  const found: DefinitionTerm[] = [];
  const seen = new Set<string>();

  const add = (term: string, definition: string, sectionId?: string) => {
    const key = term.toLowerCase().trim();
    if (key.length < 2 || seen.has(key)) return;
    seen.add(key);
    found.push({ term: term.trim(), definition: definition.trim(), sectionId });
  };

  for (const section of sections) {
    for (const rawLine of section.body.split(/\r?\n/)) {
      const line = cleanLine(rawLine);
      if (line.length < 10) continue;

      for (const pattern of DEFINITION_PATTERNS) {
        const match = line.match(pattern);
        if (match) {
          add(match[1], match[2], section.id);
          break;
        }
      }

      const boldInline = line.match(/\*\*([^*]{2,48})\*\*\s*[—–:-]?\s*(.{8,})/u);
      if (boldInline) add(boldInline[1], boldInline[2], section.id);
    }
  }

  return found.slice(0, 80);
}

export function definitionsPromptBlock(terms: DefinitionTerm[]): string {
  if (!terms.length) return '';
  const lines = terms
    .slice(0, 40)
    .map((t) => `- ${t.term}: ${t.definition.slice(0, 220)}`);
  return `\n\nKey terms detected in the material (prioritize these in definition-style questions):\n${lines.join('\n')}`;
}

function words(value: string): string[] {
  const rawTerms = value.toLowerCase().match(/[\p{L}\p{N}]+/gu) || [];
  const terms: string[] = [];

  for (const term of rawTerms) {
    const compactScript = /[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Hangul}]/u.test(
      term
    );
    if (term.length > 3 || (compactScript && term.length >= 2)) terms.push(term);

    if (compactScript && term.length > 3) {
      for (let i = 0; i < term.length - 1; i += 1) {
        terms.push(term.slice(i, i + 2));
      }
    }
  }

  return terms;
}

function excerptAround(body: string, terms: string[]): string {
  const compact = cleanLine(body);
  if (compact.length <= 340) return compact;

  const lower = compact.toLowerCase();
  const firstHit = terms
    .map((term) => lower.indexOf(term))
    .filter((index) => index >= 0)
    .sort((a, b) => a - b)[0];
  const start = Math.max(0, (firstHit ?? 0) - 110);
  const end = Math.min(compact.length, start + 320);
  const prefix = start > 0 ? '...' : '';
  const suffix = end < compact.length ? '...' : '';
  return `${prefix}${compact.slice(start, end).trim()}${suffix}`;
}

export function findQuestionSource(
  question: string,
  content: string
): SourceMatch | null {
  const sections = splitChapterSections(content);
  const terms = Array.from(new Set(words(question))).slice(0, 12);
  if (!sections.length || !terms.length) return null;

  const ranked = sections
    .map((section) => {
      const haystack = `${section.title} ${section.body}`.toLowerCase();
      const score = terms.reduce(
        (total, term) => total + (haystack.includes(term) ? 1 : 0),
        0
      );
      return { section, score };
    })
    .sort((a, b) => b.score - a.score);

  const best = ranked[0];
  if (!best || best.score === 0) return null;

  return {
    sectionId: best.section.id,
    sectionTitle: best.section.title,
    excerpt: excerptAround(best.section.body, terms),
  };
}
