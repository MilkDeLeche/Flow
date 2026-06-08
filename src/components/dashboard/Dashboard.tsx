import { useEffect, useMemo, useState } from 'react';
import {
  BookOpen,
  CalendarDays,
  CheckCircle2,
  Circle,
  Clock,
  Plus,
  Trash2,
} from 'lucide-react';
import { listCourses, type Course } from '../../lib/courses';
import {
  buildStudySessions,
  createStudyPlan,
  daysUntil,
  deleteStudyPlan,
  listStudyPlans,
  todayString,
  toggleStudySession,
  type StudyPlan,
} from '../../lib/studyPlan';
import { useLocale } from '../../lib/i18n';

interface Props {
  onOpenCourse: (c: Course) => void;
  refreshKey: number;
}

function fmtDate(date: string): string {
  try {
    return new Date(`${date}T00:00:00`).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
    });
  } catch {
    return date;
  }
}

function readiness(plan: StudyPlan): number {
  const sessions = buildStudySessions(plan);
  if (!sessions.length) return plan.completedSessions.length ? 100 : 0;
  const done = sessions.filter((s) => plan.completedSessions.includes(s.key)).length;
  return Math.round((done / sessions.length) * 100);
}

export default function Dashboard({ onOpenCourse, refreshKey }: Props) {
  const { t } = useLocale();
  const [courses, setCourses] = useState<Course[]>([]);
  const [plans, setPlans] = useState<StudyPlan[]>([]);
  const [courseId, setCourseId] = useState('');
  const [title, setTitle] = useState('');
  const [testDate, setTestDate] = useState(todayString());
  const [quizzesPerWeek, setQuizzesPerWeek] = useState(3);
  const [error, setError] = useState<string | null>(null);

  const reloadPlans = () => setPlans(listStudyPlans());

  useEffect(() => {
    let on = true;
    listCourses().then((items) => {
      if (!on) return;
      setCourses(items);
      setCourseId((current) => current || items[0]?.id || '');
    });
    reloadPlans();
    return () => {
      on = false;
    };
  }, [refreshKey]);

  const selectedCourse = courses.find((c) => c.id === courseId);
  const nextPlans = plans.filter((plan) => daysUntil(plan.testDate) >= 0);
  const dueThisWeek = nextPlans.reduce(
    (count, plan) =>
      count +
      buildStudySessions(plan).filter((session) => {
        const left = daysUntil(session.date);
        return left >= 0 && left <= 7 && !plan.completedSessions.includes(session.key);
      }).length,
    0
  );
  const averageReadiness = useMemo(() => {
    if (!nextPlans.length) return 0;
    return Math.round(
      nextPlans.reduce((total, plan) => total + readiness(plan), 0) / nextPlans.length
    );
  }, [nextPlans]);

  const addPlan = () => {
    if (!selectedCourse) {
      setError(t.plannerChooseCourse);
      return;
    }
    if (daysUntil(testDate) < 0) {
      setError(t.plannerFutureDate);
      return;
    }
    createStudyPlan({
      courseId: selectedCourse.id,
      courseName: selectedCourse.name,
      title,
      testDate,
      quizzesPerWeek,
    });
    setTitle('');
    setError(null);
    reloadPlans();
  };

  const toggle = (planId: string, sessionKey: string) => {
    toggleStudySession(planId, sessionKey);
    reloadPlans();
  };

  const remove = (planId: string) => {
    deleteStudyPlan(planId);
    reloadPlans();
  };

  const openPlanCourse = (plan: StudyPlan) => {
    const course = courses.find((c) => c.id === plan.courseId);
    if (course) onOpenCourse(course);
  };

  return (
    <div className="mx-auto max-w-[1040px] px-5 pb-16 pt-10 md:px-8">
      <div className="mb-8">
        <h1 className="mb-2 text-[32px] font-semibold leading-tight text-[#2c2c2c] md:text-[42px]">
          {t.plannerTitle}
        </h1>
        <p className="max-w-[680px] text-[15px] leading-relaxed text-[#646464]">
          {t.plannerIntro}
        </p>
      </div>

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-[#dde3dd] bg-white p-4">
          <p className="mb-1 flex items-center gap-2 text-[12px] text-[#646464]">
            <CalendarDays size={14} /> {t.upcomingTests}
          </p>
          <p className="text-[28px] font-semibold text-[#2c2c2c]">{nextPlans.length}</p>
        </div>
        <div className="rounded-2xl border border-[#dde3dd] bg-white p-4">
          <p className="mb-1 flex items-center gap-2 text-[12px] text-[#646464]">
            <Clock size={14} /> {t.dueThisWeek}
          </p>
          <p className="text-[28px] font-semibold text-[#2c2c2c]">{dueThisWeek}</p>
        </div>
        <div className="rounded-2xl border border-[#dde3dd] bg-white p-4">
          <p className="mb-1 flex items-center gap-2 text-[12px] text-[#646464]">
            <CheckCircle2 size={14} /> {t.readiness}
          </p>
          <p className="text-[28px] font-semibold text-[#2c2c2c]">
            {averageReadiness}%
          </p>
        </div>
      </div>

      <div className="mb-8 rounded-2xl border-2 border-[#dee2de] bg-[#fbfcf8] p-5">
        <h2 className="mb-4 text-[15px] font-medium text-[#2c2c2c]">{t.addTestDay}</h2>
        <div className="grid gap-3 md:grid-cols-[1.2fr_1fr_150px_150px_auto]">
          <select
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="h-11 rounded-xl border-2 border-[#dde3dd] bg-white px-3 text-[14px] outline-none focus:border-[#b8beb8]"
          >
            {courses.length === 0 ? (
              <option value="">{t.noCoursesPlanner}</option>
            ) : (
              courses.map((course) => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))
            )}
          </select>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={t.testNamePlaceholder}
            className="h-11 rounded-xl border-2 border-[#dde3dd] bg-white px-3 text-[14px] outline-none focus:border-[#b8beb8]"
          />
          <input
            type="date"
            min={todayString()}
            value={testDate}
            onChange={(e) => setTestDate(e.target.value)}
            className="h-11 rounded-xl border-2 border-[#dde3dd] bg-white px-3 text-[14px] outline-none focus:border-[#b8beb8]"
          />
          <select
            value={quizzesPerWeek}
            onChange={(e) => setQuizzesPerWeek(Number(e.target.value))}
            className="h-11 rounded-xl border-2 border-[#dde3dd] bg-white px-3 text-[14px] outline-none focus:border-[#b8beb8]"
          >
            {[2, 3, 4, 5].map((n) => (
              <option key={n} value={n}>
                {t.quizzesWeekly(n)}
              </option>
            ))}
          </select>
          <button
            onClick={addPlan}
            disabled={!courses.length}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-full bg-black px-5 text-[14px] text-white transition-colors hover:bg-[#2c2c2c] disabled:opacity-40"
          >
            <Plus size={15} /> {t.plan}
          </button>
        </div>
        {error && <p className="mt-3 text-[13px] text-red-600">{error}</p>}
      </div>

      {plans.length === 0 ? (
        <div className="rounded-2xl border-2 border-dashed border-[#dde3dd] px-5 py-10 text-center">
          <p className="text-[15px] font-medium text-[#2c2c2c]">{t.noPlans}</p>
          <p className="mt-1 text-[13px] text-[#8a8f8a]">{t.noPlansHint}</p>
        </div>
      ) : (
        <div className="space-y-4">
          {plans.map((plan) => {
            const sessions = buildStudySessions(plan);
            const ready = readiness(plan);
            const left = daysUntil(plan.testDate);
            return (
              <section key={plan.id} className="rounded-2xl border border-[#dde3dd] bg-white p-5">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="mb-1 text-[12px] text-[#646464]">{plan.courseName}</p>
                    <h3 className="text-[20px] font-semibold text-[#2c2c2c]">{plan.title}</h3>
                    <p className="mt-1 text-[13px] text-[#646464]">
                      {fmtDate(plan.testDate)} -{' '}
                      {left === 0 ? t.today : t.daysLeft(Math.max(0, left))}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => openPlanCourse(plan)}
                      className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#dde3dd] px-4 py-2 text-[13px] transition-colors hover:bg-[#eef1ed]"
                    >
                      <BookOpen size={14} /> {t.openCourse}
                    </button>
                    <button
                      onClick={() => remove(plan.id)}
                      title={t.deletePlan}
                      className="inline-flex items-center gap-1.5 rounded-full border-2 border-[#fde2e2] px-3 py-2 text-[13px] text-red-600 transition-colors hover:bg-red-50"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="mb-4 h-2 overflow-hidden rounded-full bg-[#eef1ed]">
                  <div
                    className="h-full rounded-full bg-black transition-all"
                    style={{ width: `${ready}%` }}
                  />
                </div>

                <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {sessions.map((session) => {
                    const done = plan.completedSessions.includes(session.key);
                    return (
                      <button
                        key={session.key}
                        onClick={() => toggle(plan.id, session.key)}
                        className={`flex items-center justify-between rounded-xl border px-3 py-3 text-left transition-colors ${
                          done
                            ? 'border-[#cfe4d3] bg-[#f0f8f1]'
                            : 'border-[#e8e8e8] hover:bg-[#f7f8f5]'
                        }`}
                      >
                        <span>
                          <span className="block text-[13px] font-medium text-[#2c2c2c]">
                            {session.label}
                          </span>
                          <span className="text-[12px] text-[#646464]">
                            {fmtDate(session.date)}
                          </span>
                        </span>
                        {done ? (
                          <CheckCircle2 size={18} className="text-[#2f7d45]" />
                        ) : (
                          <Circle size={18} className="text-[#b4b8b4]" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
