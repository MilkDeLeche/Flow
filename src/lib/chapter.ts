export interface ChapterSection {
  id: string;
  title: string;
  body: string;
}

const HEADING_RE =
  /^(chapter\s+\d+|unit\s+\d+|section\s+\d+|\d+(\.\d+)*\s+|[A-Z][A-Z0-9\s:,-]{8,})/i;

function cleanLine(line: string): string {
  return line.replace(/\s+/g, ' ').trim();
}

export function inferChapterTitle(content: string, fallback = 'Untitled chapter'): string {
  const lines = content
    .split(/\r?\n/)
    .map(cleanLine)
    .filter((line) => line.length >= 4 && line.length <= 90);

  const heading = lines.find((line) => HEADING_RE.test(line));
  if (heading) return heading.replace(/^chapter\s*/i, 'Chapter ').slice(0, 80);

  const firstSentence = cleanLine(content).match(/^(.{16,90}?)([.!?]|$)/)?.[1];
  if (firstSentence) return firstSentence.slice(0, 80);

  return fallback;
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
