import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  BookOpen,
  Check,
  Clock,
  FileText,
  Highlighter,
  ListChecks,
  NotebookPen,
  Play,
  Target,
} from 'lucide-react';
import { readingMinutes, splitChapterSections } from '../../lib/chapter';
import type { Course } from '../../lib/courses';
import type { RecentMaterial } from '../../lib/store';
import {
  loadReaderMarks,
  saveReaderMark,
  type ReaderMarks,
} from '../../lib/readerMarks';
import { ROUND_SIZES, type QuizMode, type RoundSize } from '../../lib/types';
import { useLocale } from '../../lib/i18n';

interface Props {
  course: Course | null;
  material: RecentMaterial;
  focusSectionId?: string;
  onBack: () => void;
  onStartQuiz: (size: RoundSize, mode: QuizMode) => void;
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
  const minutes = useMemo(() => readingMinutes(material.content), [material.content]);
  const [activeId, setActiveId] = useState(sections[0]?.id ?? 'section-1');
  const [roundSize, setRoundSize] = useState<RoundSize>(10);
  const [mode, setMode] = useState<QuizMode>('practice');
  const [marks, setMarks] = useState<ReaderMarks>({ highlights: [], notes: {} });
  const sectionTitle = (title: string, index: number) => {
    if (title === 'Opening') return t.opening;
    if (title === 'Chapter text') return t.chapterText;
    if (/^Part \d+$/.test(title)) return t.part(index + 1);
    return title;
  };
  const noteCount = Object.values(marks.notes).filter((note) => note.trim()).length;

  useEffect(() => {
    let on = true;
    setMarks({ highlights: [], notes: {} });
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

  const toggleHighlight = (sectionId: string) => {
    setMarks((current) => {
      const highlighted = new Set(current.highlights);
      if (highlighted.has(sectionId)) highlighted.delete(sectionId);
      else highlighted.add(sectionId);
      const next = { ...current, highlights: Array.from(highlighted) };
      saveReaderMark({
        materialId: material.id,
        sectionId,
        highlighted: highlighted.has(sectionId),
        note: current.notes[sectionId] || '',
      });
      return next;
    });
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
          <p className="text-[20px] font-semibold text-[#2c2c2c]">
            {marks.highlights.length + noteCount}
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
                onClick={() => onStartQuiz(roundSize, mode)}
                className="inline-flex items-center gap-2 rounded-full bg-black px-5 py-3 text-[14px] text-white transition-colors hover:bg-[#2c2c2c]"
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
                  <h2 className="text-[18px] font-semibold text-[#2c2c2c]">
                    {sectionTitle(section.title, index)}
                  </h2>
                  <button
                    onClick={() => toggleHighlight(section.id)}
                    className={`inline-flex w-fit items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] transition-colors ${
                      marks.highlights.includes(section.id)
                        ? 'border-[#e6cf76] bg-[#fff4bd] text-[#66540f]'
                        : 'border-[#dde3dd] bg-white text-[#646464] hover:bg-[#eef1ed]'
                    }`}
                  >
                    {marks.highlights.includes(section.id) ? (
                      <Check size={13} />
                    ) : (
                      <Highlighter size={13} />
                    )}
                    {marks.highlights.includes(section.id)
                      ? t.highlighted
                      : t.highlight}
                  </button>
                </div>
                <div
                  className={`max-w-[72ch] whitespace-pre-wrap rounded-lg text-[16px] leading-8 text-[#383a38] ${
                    marks.highlights.includes(section.id) ? 'bg-[#fff9d9] px-3 py-2' : ''
                  }`}
                >
                  {section.body}
                </div>
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

        <aside className="lg:sticky lg:top-24 lg:h-fit">
          <div className="rounded-2xl border border-[#dde3dd] bg-white p-4">
            <div className="mb-4 flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#eef1ed]">
                <ListChecks size={17} />
              </span>
              <div>
                <p className="text-[14px] font-medium text-[#2c2c2c]">{t.studyThisChapter}</p>
                <p className="text-[12px] text-[#8a8f8a]">{t.readFirstQuiz}</p>
              </div>
            </div>

            <label className="mb-2 block text-[12px] text-[#646464]">{t.roundSize}</label>
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

            <label className="mb-2 block text-[12px] text-[#646464]">{t.mode}</label>
            <div className="mb-4 grid grid-cols-2 gap-2">
              {(['practice', 'exam'] as const).map((value) => (
                <button
                  key={value}
                  onClick={() => setMode(value)}
                  className={`h-10 rounded-lg text-[13px] transition-colors ${
                    mode === value
                      ? 'bg-black text-white'
                      : 'bg-[#f5f7f3] text-[#2c2c2c] hover:bg-[#eef1ed]'
                  }`}
                >
                  {value === 'practice' ? t.practice : t.exam}
                </button>
              ))}
            </div>

            <button
              onClick={() => onStartQuiz(roundSize, mode)}
              className="mb-2 inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-4 py-3 text-[14px] text-white transition-colors hover:bg-[#2c2c2c]"
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
