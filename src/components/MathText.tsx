import { useMemo } from 'react';
import katex from 'katex';

interface MathTextProps {
  text: string;
  className?: string;
}

type Segment =
  | { type: 'text'; value: string }
  | { type: 'math'; value: string; display: boolean };

// Matches $$...$$ and \[...\] (display) and $...$ and \(...\) (inline).
const MATH_RE =
  /\$\$([\s\S]+?)\$\$|\\\[([\s\S]+?)\\\]|\$([^$\n]+?)\$|\\\(([\s\S]+?)\\\)/g;

function tokenize(input: string): Segment[] {
  const segments: Segment[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  MATH_RE.lastIndex = 0;
  while ((m = MATH_RE.exec(input)) !== null) {
    if (m.index > last) {
      segments.push({ type: 'text', value: input.slice(last, m.index) });
    }
    const display = m[1] !== undefined || m[2] !== undefined;
    const value = m[1] ?? m[2] ?? m[3] ?? m[4] ?? '';
    segments.push({ type: 'math', value, display });
    last = m.index + m[0].length;
  }
  if (last < input.length) {
    segments.push({ type: 'text', value: input.slice(last) });
  }
  return segments;
}

/**
 * Renders a string that mixes prose and LaTeX. Math delimited by $...$ (inline)
 * or $$...$$ (display) is rendered with KaTeX. Newlines in text are preserved.
 * Everything is rendered with <span> elements so it is valid inline content.
 */
export default function MathText({ text, className }: MathTextProps) {
  const segments = useMemo(() => tokenize(text || ''), [text]);

  return (
    <span className={className} style={{ whiteSpace: 'pre-wrap' }}>
      {segments.map((seg, i) => {
        if (seg.type === 'text') return <span key={i}>{seg.value}</span>;
        let html: string;
        try {
          html = katex.renderToString(seg.value, {
            displayMode: seg.display,
            throwOnError: false,
            output: 'html',
          });
        } catch {
          return <span key={i}>{seg.value}</span>;
        }
        return (
          <span key={i} dangerouslySetInnerHTML={{ __html: html }} />
        );
      })}
    </span>
  );
}
