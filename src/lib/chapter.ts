export interface ChapterSection {
  id: string;
  title: string;
  body: string;
}

export interface SourceMatch {
  sectionId: string;
  sectionTitle: string;
  excerpt: string;
}

const HEADING_RE =
  /^(chapter\s+\d+|unit\s+\d+|section\s+\d+|\d+(\.\d+)*\s+|[A-Z][A-Z0-9\s:,-]{8,})/i;

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

  const flush = () => {
    const body = currentBody.join('\n').trim();
    if (!body) return;
    sections.push({
      id: `section-${sections.length + 1}`,
      title: currentTitle,
      body,
    });
    currentBody = [];
  };

  for (const raw of lines) {
    const line = cleanLine(raw);
    const looksLikeHeading =
      line.length >= 4 &&
      line.length <= 90 &&
      HEADING_RE.test(line) &&
      currentBody.join(' ').length > 240;

    if (looksLikeHeading) {
      flush();
      currentTitle = line;
      continue;
    }

    if (raw) currentBody.push(raw);
  }
  flush();

  if (sections.length > 1) return sections.slice(0, 18);

  const paragraphs = content
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

  if (paragraphs.length <= 3) {
    return [
      {
        id: 'section-1',
        title: 'Chapter text',
        body: content.trim(),
      },
    ];
  }

  const grouped: ChapterSection[] = [];
  for (let i = 0; i < paragraphs.length; i += 4) {
    grouped.push({
      id: `section-${grouped.length + 1}`,
      title: `Part ${grouped.length + 1}`,
      body: paragraphs.slice(i, i + 4).join('\n\n'),
    });
  }
  return grouped.slice(0, 18);
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
