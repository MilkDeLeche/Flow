export interface TextHighlight {
  id: string;
  sectionId: string;
  start: number;
  end: number;
  text: string;
  note: string;
  createdAt: string;
}

const prefix = 'flow_text_highlights_';

function storeKey(materialId: string) {
  return `${prefix}${materialId}`;
}

export function loadTextHighlights(materialId: string): TextHighlight[] {
  try {
    const raw = localStorage.getItem(storeKey(materialId));
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TextHighlight[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveTextHighlights(materialId: string, highlights: TextHighlight[]) {
  localStorage.setItem(storeKey(materialId), JSON.stringify(highlights));
}

export function addTextHighlight(
  materialId: string,
  highlight: Omit<TextHighlight, 'id' | 'createdAt'>
): TextHighlight[] {
  const current = loadTextHighlights(materialId);
  const entry: TextHighlight = {
    ...highlight,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
  };
  const next = [...current, entry].sort((a, b) =>
    a.sectionId === b.sectionId ? a.start - b.start : a.sectionId.localeCompare(b.sectionId)
  );
  saveTextHighlights(materialId, next);
  return next;
}

export function updateTextHighlightNote(
  materialId: string,
  id: string,
  note: string
): TextHighlight[] {
  const next = loadTextHighlights(materialId).map((h) =>
    h.id === id ? { ...h, note } : h
  );
  saveTextHighlights(materialId, next);
  return next;
}

export function removeTextHighlight(materialId: string, id: string): TextHighlight[] {
  const next = loadTextHighlights(materialId).filter((h) => h.id !== id);
  saveTextHighlights(materialId, next);
  return next;
}

export function highlightsForSection(
  highlights: TextHighlight[],
  sectionId: string
): TextHighlight[] {
  return highlights.filter((h) => h.sectionId === sectionId);
}
