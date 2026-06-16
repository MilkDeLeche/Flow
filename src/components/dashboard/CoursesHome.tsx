import { useEffect, useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Plus,
  Search,
  Sparkles,
} from 'lucide-react';
import AddCourseForm from './AddCourseForm';
import JumpBackIn from '../JumpBackIn';
import { listCourses, type Course } from '../../lib/courses';
import { useLocale } from '../../lib/i18n';
import type { RecentMaterial } from '../../lib/store';

interface Props {
  refreshKey: number;
  byokActive: boolean;
  onOpenCourse: (c: Course) => void;
  onCourseCreated: (
    c: Course,
    initialChapter?: { content: string; sourceType: string }
  ) => void;
  onChanged: () => void;
  onQuickQuiz: () => void;
  onResume: (m: RecentMaterial) => void;
}

/** CRM-style course workspace with quick scanning, search, and actions. */
export default function CoursesHome({
  refreshKey,
  byokActive,
  onOpenCourse,
  onCourseCreated,
  onChanged,
  onQuickQuiz,
  onResume,
}: Props) {
  const { t } = useLocale();
  const [courses, setCourses] = useState<Course[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState('');

  const reload = () =>
    listCourses().then((c) => {
      setCourses(c);
      setLoaded(true);
    });

  useEffect(() => {
    let on = true;
    listCourses().then((c) => {
      if (on) {
        setCourses(c);
        setLoaded(true);
      }
    });
    return () => {
      on = false;
    };
  }, [refreshKey]);

  const normalizedQuery = query.trim().toLowerCase();
  const visibleCourses = normalizedQuery
    ? courses.filter((course) =>
        `${course.name} ${course.description} ${course.semester ?? ''} ${course.year ?? ''}`
          .toLowerCase()
          .includes(normalizedQuery)
      )
    : courses;
  const activeCourses = courses.filter((course) => !course.finishedAt).length;
  const finishedCourses = courses.length - activeCourses;
  const chapterTotal = courses.reduce((total, course) => total + course.chapterCount, 0);

  return (
    <div className="mx-auto max-w-[1180px] px-4 pb-16 pt-6 md:px-6">
      <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="mb-1 text-[12px] uppercase tracking-[0.1em] text-ink-muted">
            {t.courseWorkspace}
          </p>
          <h1 className="text-[28px] font-semibold leading-tight text-ink md:text-[34px]">
            {t.yourCourses}
          </h1>
          <p className="mt-1 max-w-[680px] text-[14px] leading-relaxed text-ink-secondary">
            {t.coursesIntro}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={onQuickQuiz}
            className="btn-outline h-10 gap-2 px-4 text-[13px]"
          >
            <Sparkles size={15} /> {t.quickQuizShort}
          </button>
          <button
            onClick={() => setAdding((open) => !open)}
            className="btn-primary h-10 gap-2 px-4 text-[13px]"
          >
            <Plus size={15} /> {t.newCourse}
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-line bg-surface-card px-4 py-3">
          <p className="mb-2 flex items-center gap-2 text-[12px] text-ink-muted">
            <BookOpen size={14} /> {t.activeCourses}
          </p>
          <p className="text-[26px] font-semibold text-ink">{activeCourses}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface-card px-4 py-3">
          <p className="mb-2 flex items-center gap-2 text-[12px] text-ink-muted">
            <FileText size={14} /> {t.chapterModules}
          </p>
          <p className="text-[26px] font-semibold text-ink">{chapterTotal}</p>
        </div>
        <div className="rounded-xl border border-line bg-surface-card px-4 py-3">
          <p className="mb-2 flex items-center gap-2 text-[12px] text-ink-muted">
            <CheckCircle2 size={14} /> {t.finishedCourses}
          </p>
          <p className="text-[26px] font-semibold text-ink">{finishedCourses}</p>
        </div>
      </div>

      {adding && (
        <div className="mb-5 max-w-[820px]">
          <AddCourseForm
            byokActive={byokActive}
            onCreated={(course, initialChapter) => {
              setAdding(false);
              reload();
              onChanged();
              onCourseCreated(course, initialChapter);
            }}
          />
        </div>
      )}

      <section className="overflow-hidden rounded-xl border border-line bg-surface-card">
        <div className="flex flex-col gap-3 border-b border-line px-4 py-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-[15px] font-semibold text-ink">{t.courseList}</h2>
            <p className="mt-0.5 text-[12px] text-ink-muted">{t.courseListHint}</p>
          </div>
          <label className="relative block w-full md:w-[280px]">
            <Search
              size={15}
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink-muted"
            />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t.searchCourses}
              className="input-field h-10 rounded-lg pl-9 pr-3 text-[13px]"
            />
          </label>
        </div>

        <div className="hidden grid-cols-[minmax(0,1.6fr)_0.7fr_0.7fr_0.8fr_80px] gap-3 border-b border-line px-4 py-2 text-[11px] uppercase tracking-[0.08em] text-ink-muted lg:grid">
          <span>{t.course}</span>
          <span>{t.chapters}</span>
          <span>{t.status}</span>
          <span>{t.term}</span>
          <span className="text-right">{t.open}</span>
        </div>

        {loaded && visibleCourses.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <p className="text-[14px] text-ink-muted">
              {courses.length ? t.noCourseMatches : t.noCourses}
            </p>
            {!courses.length && (
              <button
                onClick={() => setAdding(true)}
                className="mt-4 btn-primary h-10 gap-2 px-4 text-[13px]"
              >
                <Plus size={15} /> {t.newCourse}
              </button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-[#edf0ed]">
            {visibleCourses.map((course) => (
              <li key={course.id}>
                <button
                  onClick={() => onOpenCourse(course)}
                  className="grid w-full gap-3 px-4 py-4 text-left transition-colors hover:bg-surface-muted lg:grid-cols-[minmax(0,1.6fr)_0.7fr_0.7fr_0.8fr_80px] lg:items-center"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-[13px] font-semibold text-ink">
                        {course.name.trim().slice(0, 1).toUpperCase() || 'F'}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-[15px] font-semibold text-ink">
                          {course.name}
                        </p>
                        <p className="line-clamp-1 text-[12px] text-ink-muted">
                          {course.description || t.noCourseDescription}
                        </p>
                      </div>
                    </div>
                  </div>

                  <p className="flex items-center gap-2 text-[13px] text-ink-secondary">
                    <FileText size={14} className="text-ink-muted" />
                    {course.chapterCount}{' '}
                    {course.chapterCount === 1 ? t.chapter : t.chapters.toLowerCase()}
                  </p>

                  <p>
                    <span
                      className={`inline-flex h-7 items-center gap-1.5 rounded-full px-2.5 text-[12px] ${
                        course.finishedAt
                          ? 'bg-[#edf7ef] text-[#2f6f3c] dark:bg-green-950/40 dark:text-green-400'
                          : 'bg-[#f4f1e8] text-[#7a632d] dark:bg-amber-950/40 dark:text-amber-400'
                      }`}
                    >
                      {course.finishedAt ? <CheckCircle2 size={13} /> : <Clock3 size={13} />}
                      {course.finishedAt ? t.finished : t.active}
                    </span>
                  </p>

                  <p className="text-[13px] text-ink-secondary">
                    {[course.semester, course.year].filter(Boolean).join(' ') || t.noTerm}
                  </p>

                  <span className="inline-flex justify-end text-ink-secondary">
                    <ArrowRight size={17} />
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <div className="mt-6">
        <JumpBackIn onResume={onResume} refreshKey={refreshKey} />
      </div>
    </div>
  );
}
