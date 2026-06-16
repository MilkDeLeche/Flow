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
    <div className="min-h-screen bg-surface-muted pb-20 pt-4 md:pt-6">
      <div className="px-5 md:px-8 lg:px-10 xl:px-12">
        <button
          onClick={onBack}
          className="mb-6 inline-flex items-center gap-1.5 text-[14px] text-ink-secondary transition-colors hover:text-ink"
        >
          <ArrowLeft size={15} /> {course ? course.name : t.allMaterial}
        </button>

        <div className="mb-8 grid gap-3 sm:grid-cols-3">
          {[
            { label: t.quizReady, value: ROUND_SIZES.join(' / ') },
            { label: t.sections, value: String(sections.length) },
            {
              label: t.studyMarks,
              value: String(
                marks.highlights.length + textHighlights.length + noteCount + textNoteCount
              ),
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-2xl border border-line bg-surface-card px-5 py-4 shadow-[var(--shadow-card)]"
            >
              <p className="text-[12px] uppercase tracking-[0.08em] text-ink-muted">{stat.label}</p>
              <p className="mt-1 font-mondwest text-[28px] leading-none text-ink">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid gap-8 xl:grid-cols-[minmax(200px,240px)_minmax(0,1fr)_minmax(280px,320px)]">
          <aside className="hidden xl:block">
            <div className="sticky top-24 max-h-[calc(100vh-7rem)] overflow-auto rounded-2xl border border-line bg-surface-card p-4 shadow-[var(--shadow-card)]">
              <p className="mb-3 text-[11px] font-medium uppercase tracking-[0.1em] text-ink-muted">
                {t.contents}
              </p>
              <nav className="space-y-0.5">
                {sections.map((section, index) => (
                  <a
                    key={section.id}
                    href={`#${section.id}`}
                    onClick={() => setActiveId(section.id)}
                    className={`flex items-start gap-2.5 rounded-xl px-3 py-2.5 text-left text-[13px] leading-snug transition-colors ${
                      activeId === section.id
                        ? 'bg-surface-muted text-ink'
                        : 'text-ink-secondary hover:bg-surface-muted/70 hover:text-ink'
                    }`}
                  >
                    <span className="mt-0.5 font-mono text-[11px] text-ink-muted">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="line-clamp-2">{sectionTitle(section.title, index)}</span>
                    {marks.highlights.includes(section.id) && (
                      <Highlighter size={13} className="mt-0.5 shrink-0 text-highlight-strong" />
                    )}
                  </a>
                ))}
              </nav>
            </div>
          </aside>

          <article className="min-w-0">
            <div className="rounded-[28px] border border-line bg-surface-card px-6 py-8 shadow-[var(--shadow-card)] md:px-10 md:py-10 lg:px-12 lg:py-12">
              <header className="mb-10 border-b border-line pb-8">
                <div className="mb-4 flex flex-wrap items-center gap-2 text-[12px] text-ink-secondary">
                  {course && (
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-muted px-3 py-1">
                      <BookOpen size={13} /> {course.name}
                    </span>
                  )}
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-muted px-3 py-1">
                    <Clock size={13} /> {t.minRead(minutes)}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface-muted px-3 py-1">
                    <FileText size={13} /> {t.charsShort(shortCount(material.content.length))}
                  </span>
                </div>
                <h1 className="max-w-[18ch] font-mondwest text-[36px] leading-[1.05] text-ink md:text-[48px] lg:text-[56px]">
                  {material.title}
                </h1>
                <p className="mt-3 text-[14px] text-ink-muted">
                  {t.addedDate(fmtDate(material.createdAt))}
                  {material.lastScore
                    ? ` · ${t.lastQuiz(material.lastScore.score, material.lastScore.total)}`
                    : ''}
                </p>
                <div className="mt-6 flex flex-wrap gap-3 xl:hidden">
                  <button
                    onClick={() => onStartQuiz(roundSize, mode, quizFocus)}
                    className="inline-flex items-center gap-2 rounded-full bg-accent px-5 py-3 text-[14px] text-accent-ink transition-opacity hover:opacity-90"
                  >
                    <Play size={15} /> {t.startQuizPlain}
                  </button>
                  <button
                    onClick={onReview}
                    className="inline-flex items-center gap-2 rounded-full border border-line bg-surface-muted px-4 py-2.5 text-[13px] text-ink transition-colors hover:border-line-strong"
                  >
                    <Target size={14} /> {t.reviewMistakes}
                  </button>
                </div>
              </header>

              <div className="space-y-14">
                {sections.map((section, index) => (
                  <section
                    key={section.id}
                    id={section.id}
                    className={`scroll-mt-28 rounded-2xl transition-colors ${
                      focusSectionId === section.id ? 'bg-highlight/40 px-4 py-4 -mx-4 md:-mx-6' : ''
                    }`}
                    onMouseEnter={() => setActiveId(section.id)}
                  >
                    <div className="mb-5 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <h2 className="font-mondwest text-[26px] leading-tight text-ink md:text-[32px]">
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
                    <div className="mt-6 rounded-2xl border border-line bg-surface-muted px-4 py-4 md:px-5 md:py-5">
                      <label className="mb-3 flex items-center gap-2 text-[12px] font-medium uppercase tracking-[0.06em] text-ink-muted">
                        <NotebookPen size={14} /> {t.sectionNote}
                      </label>
                      <textarea
                        value={marks.notes[section.id] || ''}
                        onChange={(e) => updateNote(section.id, e.target.value)}
                        placeholder={t.notePlaceholder}
                        rows={marks.notes[section.id]?.trim() ? 4 : 3}
                        className="w-full resize-none rounded-xl border border-line bg-surface-card px-4 py-3 text-[14px] leading-relaxed text-ink outline-none transition-colors placeholder:text-ink-muted focus:border-line-strong"
                      />
                    </div>
                  </section>
                ))}
              </div>
            </div>
          </article>

          <aside className="space-y-5 xl:sticky xl:top-24 xl:h-fit">
            <div className="rounded-2xl border border-line bg-surface-card p-5 shadow-[var(--shadow-card)]">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-muted">
                  <NotebookPen size={17} className="text-ink" />
                </span>
                <div>
                  <p className="text-[15px] font-medium text-ink">{t.studyNotesPanel}</p>
                  <p className="text-[12px] text-ink-muted">{t.selectToHighlight}</p>
                </div>
              </div>
              {textHighlights.length === 0 && noteCount === 0 ? (
                <p className="text-[13px] leading-relaxed text-ink-secondary">{t.noHighlightsYet}</p>
              ) : (
                <div className="max-h-[320px] space-y-3 overflow-auto pr-1">
                  {textHighlights.map((h) => {
                    const section = sections.find((s) => s.id === h.sectionId);
                    return (
                      <div
                        key={h.id}
                        className={`rounded-xl border px-3 py-3 ${
                          activeNoteId === h.id
                            ? 'border-line-strong bg-highlight/50'
                            : 'border-line bg-surface-muted'
                        }`}
                      >
                        <p className="mb-1 text-[11px] font-medium uppercase tracking-[0.06em] text-ink-muted">
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
                          className="mb-2 w-full resize-none rounded-lg border border-line bg-surface-card px-2.5 py-2 text-[12px] text-ink outline-none placeholder:text-ink-muted focus:border-line-strong"
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

            <div className="rounded-2xl border border-line bg-surface-card p-5 shadow-[var(--shadow-card)]">
              <div className="mb-5 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-surface-muted">
                  <ListChecks size={17} className="text-ink" />
                </span>
                <div>
                  <p className="text-[15px] font-medium text-ink">{t.studyThisChapter}</p>
                  <p className="text-[12px] text-ink-muted">{t.readFirstQuiz}</p>
                </div>
              </div>

              {definitions.length > 0 && (
                <p className="mb-4 text-[12px] text-ink-secondary">
                  {t.definitionsFound(definitions.length)}
                </p>
              )}

              <label className="mb-2 block text-[12px] text-ink-muted">{t.quizFocus}</label>
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
                    className={`rounded-xl px-3 py-2.5 text-left text-[12px] transition-colors ${
                      quizFocus === value
                        ? 'bg-accent text-accent-ink'
                        : 'border border-line bg-surface-muted text-ink hover:border-line-strong'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <label className="mb-2 block text-[12px] text-ink-muted">{t.roundSize}</label>
              <div className="mb-4 grid grid-cols-5 gap-1.5">
                {ROUND_SIZES.map((n) => (
                  <button
                    key={n}
                    onClick={() => setRoundSize(n)}
                    className={`h-10 rounded-xl text-[13px] transition-colors ${
                      roundSize === n
                        ? 'bg-accent text-accent-ink'
                        : 'border border-line bg-surface-muted text-ink hover:border-line-strong'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              <label className="mb-2 block text-[12px] text-ink-muted">{t.mode}</label>
              <div className="mb-2 grid grid-cols-2 gap-2">
                {(['practice', 'exam'] as const).map((value) => (
                  <button
                    key={value}
                    onClick={() => setMode(value)}
                    className={`h-10 rounded-xl text-[13px] transition-colors ${
                      mode === value
                        ? 'bg-accent text-accent-ink'
                        : 'border border-line bg-surface-muted text-ink hover:border-line-strong'
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
                className="mb-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-4 py-3 text-[14px] text-accent-ink transition-opacity hover:opacity-90"
              >
                <Play size={15} /> {t.startQuizPlain}
              </button>
              <button
                onClick={onReview}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full border border-line bg-surface-muted px-4 py-2.5 text-[13px] text-ink transition-colors hover:border-line-strong"
              >
                <Target size={14} /> {t.reviewMistakes}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
