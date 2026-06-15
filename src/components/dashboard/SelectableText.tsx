import { useCallback, useMemo, useRef } from 'react';
import type { TextHighlight } from '../../lib/textHighlights';

interface Props {
  sectionId: string;
  text: string;
  highlights: TextHighlight[];
  onHighlight: (range: { start: number; end: number; text: string }) => void;
}

interface Segment {
  start: number;
  end: number;
  text: string;
  highlightId?: string;
}

function buildSegments(text: string, highlights: TextHighlight[]): Segment[] {
  const sorted = [...highlights].sort((a, b) => a.start - b.start);
  const segments: Segment[] = [];
  let cursor = 0;

  for (const h of sorted) {
    const start = Math.max(0, Math.min(h.start, text.length));
    const end = Math.max(start, Math.min(h.end, text.length));
    if (end <= start) continue;
    if (start > cursor) {
      segments.push({ start: cursor, end: start, text: text.slice(cursor, start) });
    }
    segments.push({
      start,
      end,
      text: text.slice(start, end),
      highlightId: h.id,
    });
    cursor = end;
  }

  if (cursor < text.length) {
    segments.push({ start: cursor, end: text.length, text: text.slice(cursor) });
  }

  return segments.length ? segments : [{ start: 0, end: text.length, text }];
}

export default function SelectableText({
  sectionId,
  text,
  highlights,
  onHighlight,
}: Props) {
  const rootRef = useRef<HTMLDivElement>(null);

  const segments = useMemo(
    () => buildSegments(text, highlights),
    [text, highlights]
  );

  const handleMouseUp = useCallback(() => {
    const root = rootRef.current;
    const selection = window.getSelection();
    if (!root || !selection || selection.isCollapsed || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    if (!root.contains(range.commonAncestorContainer)) return;

    const pre = document.createRange();
    pre.selectNodeContents(root);
    pre.setEnd(range.startContainer, range.startOffset);
    const start = pre.toString().length;
    const selectedText = range.toString().trim();
    const end = start + range.toString().length;

    if (selectedText.length < 2 || end <= start) return;

    onHighlight({ start, end, text: selectedText });
    selection.removeAllRanges();
  }, [onHighlight]);

  return (
    <div
      ref={rootRef}
      onMouseUp={handleMouseUp}
      className="max-w-[72ch] whitespace-pre-wrap rounded-lg text-[16px] leading-8 text-ink-secondary"
    >
      {segments.map((segment) =>
        segment.highlightId ? (
          <mark
            key={`${sectionId}-${segment.start}-${segment.end}`}
            data-highlight-id={segment.highlightId}
            className="rounded-sm bg-highlight px-0.5 text-ink"
          >
            {segment.text}
          </mark>
        ) : (
          <span key={`${sectionId}-${segment.start}-${segment.end}`}>{segment.text}</span>
        )
      )}
    </div>
  );
}
