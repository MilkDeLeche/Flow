import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Clock,
  FileText,
  Highlighter,
  ListChecks,
  NotebookPen,
  Play,
  Target,
} from 'lucide-react';
import { readingMinutes, splitChapterSections, extractDefinitions } from '../../lib/chapter';
import type { Course } from '../../lib/courses';
import type { RecentMaterial } from '../../lib/store';
import {
  loadReaderMarks,
  saveReaderMark,
  type ReaderMarks,
} from '../../lib/readerMarks';
import {
  addTextHighlight,
  highlightsForSection,
  loadTextHighlights,
  removeTextHighlight,
  updateTextHighlightNote,
  type TextHighlight,
} from '../../lib/textHighlights';
import SelectableText from './SelectableText';
import { ROUND_SIZES, type QuizFocus, type QuizMode, type RoundSize } from '../../lib/types';
import { useLocale } from '../../lib/i18n';

interface Props {
  course: Course | null;
  material: RecentMaterial;
  focusSectionId?: string;
  onBack: () => void;
  onStartQuiz: (size: RoundSize, mode: QuizMode, focus: QuizFocus) => void;
  onReview: () => void;
}

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  } catch {
    return '';
  }
}

function shortCount(n: number): string {
  if (n >= 1000) return `${Math.round(n / 100) / 10}k`;
  return String(n);
}

export default function ChapterReader({
  course,
  material,
  focusSectionId,
  onBack,
  onStartQuiz,
  onReview,
}: Props) {
  const { t } = useLocale();
  const sections = useMemo(() => splitChapterSections(material.content), [material.content]);
  const definitions = useMemo(() => extractDefinitions(material.content), [material.content]);
  const minutes = useMemo(() => readingMinutes(material.content), [material.content]);
  const [activeId, setActiveId] = useState(sections[0]?.id ?? 'section-1');
  const [roundSize, setRoundSize] = useState<RoundSize>(10);
  const [mode, setMode] = useState<QuizMode>('practice');
  const [quizFocus, setQuizFocus] = useState<QuizFocus>('mixed');
  const [marks, setMarks] = useState<ReaderMarks>({ highlights: [], notes: {} });
  const [textHighlights, setTextHighlights] = useState<TextHighlight[]>([]);
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null);
  const sectionTitle = (title: string, index: number) => {
    if (title === 'Opening') return t.opening;
    if (title === 'Chapter text') return t.chapterText;
    if (/^Part \d+$/.test(title)) return t.part(index + 1);
    return title;
  };
  const noteCount = Object.values(marks.notes).filter((note) => note.trim()).length;
  const textNoteCount = textHighlights.filter((h) => h.note.trim()).length;

  useEffect(() => {
    let on = true;
    setMarks({ highlights: [], notes: {} });
    setTextHighlights(loadTextHighlights(material.id));
    loadReaderMarks(material.id).then((loaded) => {
      if (on) setMarks(loaded);
    });
    return () => {
      on = false;
    };
  }, [material.id]);

  useEffect(() => {
    if (!focusSectionId) return;
    setActiveId(focusSectionId);
    window.setTimeout(() => {
      document.getElementById(focusSectionId)?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }, 80);
  }, [focusSectionId]);


  const addSelectionHighlight = (
    sectionId: string,
    range: { start: number; end: number; text: string }
  ) => {
    const next = addTextHighlight(material.id, {
      sectionId,
      start: range.start,
      end: range.end,
      text: range.text,
      note: '',
    });
    setTextHighlights(next);
    const created = next[next.length - 1];
    if (created) setActiveNoteId(created.id);
  };

  const updateNote = (sectionId: string, note: string) => {
    setMarks((current) => {
      saveReaderMark({
        materialId: material.id,
        sectionId,
        highlighted: current.highlights.includes(sectionId),
        note,
      });
      return {
        ...current,
        notes: { ...current.notes, [sectionId]: note },
      };
    });
  };

  return (
    <div className="mx-auto max-w-[1160px] px-5 pb-16 pt-6 md:px-8">
      <button
        onClick={onBack}
        className="mb-5 inline-flex items-center gap-1.5 text-[14px] text-[#646464] transition-colors hover:text-[#2c2c2c]"
      >
        <ArrowLeft size={15} /> {course ? course.name : t.allMaterial}
      </button>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-[#dde3dd] bg-white px-4 py-3">
          <p className="text-[12px] text-[#646464]">{t.quizReady}</p>
          <p className="text-[20px] font-semibold text-[#2c2c2c]">
            {ROUND_SIZES.join(' / ')}
          </p>
        </div>
        <div className="rounded-xl border border-[#dde3dd] bg-white px-4 py-3">
          <p className="text-[12px] text-[#646464]">{t.sections}</p>
          <p className="text-[20px] font-semibold text-[#2c2c2c]">{sections.length}</p>
        </div>
        <div className="rounded-xl border border-[#dde3dd] bg-white px-4 py-3">
          <p className="text-[12px] text-[#646464]">{t.studyMarks}</p>
          <p className="text-[20px] font-semibold text-ink">
            {marks.highlights.length + textHighlights.length + noteCount + textNoteCount}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)_280px]">
        <aside className="lg:sticky lg:top-24 lg:h-[calc(100vh-8rem)] lg:overflow-auto">
          <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.08em] text-[#8a8f8a]">
            {t.contents}
          </p>
          <div className="space-y-1">
            {sections.map((section, index) => (
              <a
                key={section.id}
                href={`#${section.id}`}
                onClick={() => setActiveId(section.id)}
                className={`flex items-start gap-2 rounded-lg px-3 py-2 text-left text-[13px] leading-snug transition-colors ${
                  activeId === section.id
                    ? 'bg-[#eef1ed] text-[#2c2c2c]'
                    : 'text-[#646464] hover:bg-[#f4f6f2] hover:text-[#2c2c2c]'
                }`}
              >
                <span className="mt-[1px] text-[11px] text-[#9a9f9a]">
                  {String(index + 1).padStart(2, '0')}
                </span>
                <span className="line-clamp-2">{sectionTitle(section.title, index)}</span>
                {marks.highlights.includes(section.id) && (
                  <Highlighter size={13} className="mt-[2px] shrink-0 text-[#9b7a18]" />
                )}
              </a>
            ))}
          </div>
        </aside>

        <article className="min-w-0">
          <div className="mb-5 border-b border-[#dde3dd] pb-5">
            <div className="mb-3 flex flex-wrap items-center gap-2 text-[12px] text-[#646464]">
              {course && (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef1ed] px-3 py-1">
                  <BookOpen size={13} /> {course.name}
                </span>
              )}
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef1ed] px-3 py-1">
                <Clock size={13} /> {t.minRead(minutes)}
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eef1ed] px-3 py-1">
                <FileText size={13} /> {t.charsShort(shortCount(material.content.length))}
              </span>
            </div>
            <h1 className="text-[30px] font-semibold leading-tight text-[#242524] md:text-[42px]">
              {material.title}
            </h1>
            <p className="mt-2 text-[13px] text-[#8a8f8a]">
              {t.addedDate(fmtDate(material.createdAt))}
              {material.lastScore
                ? `, ${t.lastQuiz(material.lastScore.score, material.lastScore.total)}`
                : ''}
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button
                onClick={() => onStartQuiz(roundSize, mode, quizFocus)}
                className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-[14px] text-accent-ink transition-colors hover:opacity-90"
              >
                <Play size={15} /> {t.startQuizPlain}
              </button>
              <button
                onClick={onReview}
                className="inline-flex items-center gap-2 rounded-full border-2 border-[#dde3dd] px-4 py-2.5 text-[13px] transition-colors hover:bg-[#eef1ed]"
              >
                <Target size={14} /> {t.reviewMistakes}
              </button>
            </div>
          </div>

          <div className="space-y-8">
            {sections.map((section, index) => (
              <section
                key={section.id}
                id={section.id}
                className={`scroll-mt-24 rounded-xl px-1 py-1 transition-colors ${
                  focusSectionId === section.id ? 'bg-[#fff7d7]' : ''
                }`}
                onMouseEnter={() => setActiveId(section.id)}
              >
                <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <h2 className="text-[18px] font-semibold text-ink">
                    {sectionTitle(section.title, index)}
                  </h2>
                  <p className="text-[12px] text-ink-muted">{t.selectToHighlight}</p>
                </div>
                <SelectableText
                  sectionId={section.id}
                  text={section.body}
                  highlights={highlightsForSection(textHighlights, section.id)}
                  onHighlight={(range) => addSelectionHighlight(section.id, range)}
                />
                <div className="mt-3 max-w-[72ch] rounded-xl border border-[#dde3dd] bg-white px-3 py-3">
                  <label className="mb-2 flex items-center gap-2 text-[12px] font-medium text-[#646464]">
                    <NotebookPen size={14} /> {t.sectionNote}
                  </label>
                  <textarea
                    value={marks.notes[section.id] || ''}
                    onChange={(e) => updateNote(section.id, e.target.value)}
                    placeholder={t.notePlaceholder}
                    rows={marks.notes[section.id]?.trim() ? 3 : 2}
                    className="w-full resize-none rounded-lg border border-[#e1e5df] bg-[#fbfcf8] px-3 py-2 text-[13px] leading-relaxed text-[#2c2c2c] outline-none transition-colors placeholder:text-[#b4b8b4] focus:border-[#b8beb8]"
                  />
                </div>
              </section>
            ))}
          </div>
        </article>

        <aside className="space-y-4 lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-line bg-surface-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-muted">
                <NotebookPen size={17} />
              </span>
              <div>
                <p className="text-[14px] font-medium text-ink">{t.studyNotesPanel}</p>
                <p className="text-[12px] text-ink-muted">{t.selectToHighlight}</p>
              </div>
            </div>
            {textHighlights.length === 0 && noteCount === 0 ? (
              <p className="text-[13px] text-ink-muted">{t.noHighlightsYet}</p>
            ) : (
              <div className="max-h-[280px] space-y-3 overflow-auto pr-1">
                {textHighlights.map((h) => {
                  const section = sections.find((s) => s.id === h.sectionId);
                  return (
                    <div
                      key={h.id}
                      className={`rounded-xl border px-3 py-2 ${
                        activeNoteId === h.id ? 'border-line-strong bg-highlight' : 'border-line'
                      }`}
                    >
                      <p className="mb-1 text-[11px] font-medium uppercase text-ink-muted">
                        {section ? sectionTitle(section.title, section.index - 1) : h.sectionId}
                      </p>
                      <p className="mb-2 line-clamp-2 text-[13px] text-ink">&ldquo;{h.text}&rdquo;</p>
                      <textarea
                        value={h.note}
                        onFocus={() => setActiveNoteId(h.id)}
                        onChange={(e) =>
                          setTextHighlights(
                            updateTextHighlightNote(material.id, h.id, e.target.value)
                          )
                        }
                        placeholder={t.highlightNotePlaceholder}
                        rows={2}
                        className="mb-2 w-full resize-none rounded-lg border border-line bg-surface px-2 py-1.5 text-[12px] outline-none focus:border-line-strong"
                      />
                      <button
                        onClick={() =>
                          setTextHighlights(removeTextHighlight(material.id, h.id))
                        }
                        className="text-[11px] text-ink-muted underline hover:text-ink"
                      >
                        {t.removeHighlight}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-line bg-surface-card p-4">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef1ed]">
                <ListChecks size={17} />
              </span>
              <div>
                <p className="text-[14px] font-medium text-[#2c2c2c]">{t.studyThisChapter}</p>
                <p className="text-[12px] text-[#8a8f8a]">{t.readFirstQuiz}</p>
              </div>
            </div>

            {definitions.length > 0 && (
              <p className="mb-4 text-[12px] text-ink-secondary">
                {t.definitionsFound(definitions.length)}
              </p>
            )}

            <label className="mb-2 block text-[12px] text-ink-secondary">{t.quizFocus}</label>
            <div className="mb-4 grid grid-cols-1 gap-2">
              {(
                [
                  ['mixed', t.quizFocusMixed],
                  ['definitions', t.quizFocusDefinitions],
                  ['comprehension', t.quizFocusComprehension],
                ] as const
              ).map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setQuizFocus(value)}
                  className={`h-9 rounded-lg px-3 text-left text-[12px] transition-colors ${
                    quizFocus === value
                      ? 'bg-accent text-accent-ink'
                      : 'bg-surface-muted text-ink hover:bg-surface-muted/80'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <label className="mb-2 block text-[12px] text-ink-secondary">{t.roundSize}</label>
            <div className="mb-4 grid grid-cols-5 gap-1.5">
              {ROUND_SIZES.map((n) => (
                <button
                  key={n}
                  onClick={() => setRoundSize(n)}
                  className={`h-9 rounded-lg text-[13px] transition-colors ${
                    roundSize === n
                      ? 'bg-black text-white'
                      : 'bg-[#f5f7f3] text-[#2c2c2c] hover:bg-[#eef1ed]'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>

            <label className="mb-2 block text-[12px] text-ink-secondary">{t.mode}</label>
            <div className="mb-2 grid grid-cols-2 gap-2">
              {(['practice', 'exam'] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={`h-10 rounded-lg text-[13px] transition-colors ${
                    mode === value
                      ? 'bg-accent text-accent-ink'
                      : 'bg-surface-muted text-ink hover:bg-surface-muted/80'
                  }`}
                >
                  {value === 'practice' ? t.practice : t.exam}
                </button>
              ))}
            </div>
            {mode === 'exam' && roundSize === 50 && (
              <p className="mb-4 text-[11px] leading-relaxed text-ink-muted">{t.testModeHint}</p>
            )}

            <button
              onClick={() => onStartQuiz(roundSize, mode, quizFocus)}
              className="mb-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-[14px] text-accent-ink transition-colors hover:opacity-90"
            >
              <Play size={15} /> {t.startQuizPlain}
            </button>
            <button
              onClick={onReview}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-[#dde3dd] px-4 py-2.5 text-[13px] transition-colors hover:bg-[#eef1ed]"
            >
              <Target size={14} /> {t.reviewMistakes}
            </button>
          </div>
        </aside>
      </div>
    </div>
  );
}
