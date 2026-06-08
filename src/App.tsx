import { useCallback, useEffect, useState } from 'react';
import { Loader2, ArrowLeft } from 'lucide-react';
import TopBar from './components/TopBar';
import Uploader from './components/Uploader';
import QuizRunner from './components/QuizRunner';
import Results from './components/Results';
import History from './components/History';
import Review from './components/Review';
import Login from './components/Login';
import Landing from './components/landing/Landing';
import CoursesHome from './components/dashboard/CoursesHome';
import Dashboard from './components/dashboard/Dashboard';
import CourseDetail from './components/dashboard/CourseDetail';
import ChapterReader from './components/dashboard/ChapterReader';
import Settings from './components/Settings';
import { generateQuiz } from './lib/api';
import { saveAttempt } from './lib/history';
import { supabase } from './lib/supabase';
import { loadKeyStatus } from './lib/byok';
import { useAuth } from './lib/useAuth';
import { useLocale } from './lib/i18n';
import { inferChapterTitle, prepareStudyMaterial } from './lib/chapter';
import { parseCourseFromInput } from './lib/parseCourse';
import type { Course } from './lib/courses';
import {
  addToBank,
  countMissed,
  gradeReviewResults,
  listBank,
  listMissed,
  recordMaterial,
  recordRoundResults,
  setLocalMaterialScore,
  type MissedQuestion,
  type RecentMaterial,
} from './lib/store';
import type {
  AnswerRecord,
  QuizMode,
  QuizQuestion,
  RoundSize,
} from './lib/types';

type View =
  | 'home'
  | 'dashboard'
  | 'course'
  | 'reader'
  | 'upload'
  | 'loading'
  | 'quiz'
  | 'results'
  | 'history'
  | 'review'
  | 'settings';

const USER_KEY = 'flow_user';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const { t } = useLocale();
  const { session, loading: authLoading, authRequired } = useAuth();

  // Top-level screen: the Flow landing page (front door) vs. the quiz app.
  const [screen, setScreen] = useState<'landing' | 'app'>('landing');

  const [view, setView] = useState<View>('home');
  const [localName, setLocalName] = useState('Student');

  // Courses
  const [currentCourse, setCurrentCourse] = useState<Course | null>(null);
  const [uploadCourseId, setUploadCourseId] = useState<string | null>(null);
  const [roundCourse, setRoundCourse] = useState<Course | null>(null);
  const [readerMaterial, setReaderMaterial] = useState<RecentMaterial | null>(null);
  const [readerFocusId, setReaderFocusId] = useState<string | undefined>();

  // Active material
  const [title, setTitle] = useState('');
  const [material, setMaterial] = useState('');
  const [materialId, setMaterialId] = useState<string>('');
  const [pdfBase64, setPdfBase64] = useState<string | undefined>();

  // Active round / session
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [roundSize, setRoundSize] = useState<RoundSize>(10);
  const [mode, setMode] = useState<QuizMode>('practice');
  const [answers, setAnswers] = useState<AnswerRecord[]>([]);

  // Review session
  const [isReview, setIsReview] = useState(false);
  const [reviewMissed, setReviewMissed] = useState<MissedQuestion[]>([]);

  const [missedCount, setMissedCount] = useState(0);
  const [refreshKey, setRefreshKey] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [byokActive, setByokActive] = useState(false);

  const userName = authRequired ? session?.user.email ?? 'Student' : localName;

  useEffect(() => {
    const saved = localStorage.getItem(USER_KEY);
    if (saved) setLocalName(saved);
  }, []);

  // Whether the user has their own key configured (stored on their account in
  // prod, or in this browser in dev). Re-checked when the session changes.
  const reloadKeyStatus = useCallback(() => {
    loadKeyStatus().then((s) => setByokActive(s.configured));
  }, []);

  useEffect(() => {
    reloadKeyStatus();
  }, [reloadKeyStatus, session]);

  const refreshMissed = useCallback(() => {
    countMissed(userName).then(setMissedCount);
  }, [userName]);

  useEffect(() => {
    refreshMissed();
  }, [refreshMissed, refreshKey]);

  const changeUser = (name: string) => {
    setLocalName(name);
    localStorage.setItem(USER_KEY, name);
  };

  // Build a round, serving from the cached question bank and only calling the
  // API to top up when the bank doesn't have enough questions yet.
  const runRound = async (
    size: RoundSize,
    mat: string,
    mId: string,
    mTitle: string,
    pdf?: string
  ) => {
    setRoundSize(size);
    setIsReview(false);
    setError(null);
    setView('loading');
    try {
      const bank = await listBank(mId);
      let pool = bank;
      if (pdf && bank.length === 0) {
        const fresh = await generateQuiz(mat, 50, [], pdf);
        await addToBank(mId, mTitle, fresh);
        pool = fresh;
      } else if (bank.length < size) {
        const need = size - bank.length;
        const avoid = bank.map((q) => q.question).slice(0, 60);
        const fresh = await generateQuiz(mat, need, avoid);
        await addToBank(mId, mTitle, fresh);
        pool = [...bank, ...fresh];
      }
      setQuestions(shuffle(pool).slice(0, size));
      setAnswers([]);
      setView('quiz');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    }
  };

  const resolveMaterialTitle = async (
    rawTitle: string,
    content: string,
    pdf?: string
  ) => {
    const typed = rawTitle.trim();
    if (typed) return typed;

    if (uploadCourseId) {
      return inferChapterTitle(content, 'Chapter material', false);
    }

    if (byokActive) {
      try {
        const meta = await parseCourseFromInput({
          text: content.slice(0, 12000),
          pdfBase64: pdf,
        });
        if (meta.name.trim()) return meta.name.trim().slice(0, 80);
      } catch {
        // Fall back to local title inference when AI auto-fill is unavailable.
      }
    }

    return inferChapterTitle(content, 'Untitled chapter');
  };

  const handleStart = async (args: {
    title: string;
    material: string;
    sourceType: string;
    roundSize: RoundSize;
    mode: QuizMode;
    pdfBase64?: string;
  }) => {
    const studyMaterial = prepareStudyMaterial(args.material) || args.material;
    const finalTitle = await resolveMaterialTitle(
      args.title,
      studyMaterial,
      args.pdfBase64
    );
    setTitle(finalTitle);
    setMaterial(studyMaterial);
    setMode(args.mode);
    setPdfBase64(args.pdfBase64);
    // Attach to a course when adding a chapter from inside one.
    setRoundCourse(uploadCourseId ? currentCourse : null);
    const id = await recordMaterial(
      finalTitle,
      studyMaterial,
      args.sourceType,
      uploadCourseId ?? undefined
    );
    setMaterialId(id);
    setRefreshKey((k) => k + 1);

    if (uploadCourseId) {
      const savedMaterial: RecentMaterial = {
        id,
        title: finalTitle,
        content: studyMaterial,
        sourceType: args.sourceType,
        createdAt: new Date().toISOString(),
        courseId: uploadCourseId,
      };
      setReaderMaterial(savedMaterial);
      setView('reader');
      setUploadCourseId(null);
      return;
    }

    await runRound(args.roundSize, studyMaterial, id, finalTitle, args.pdfBase64);
  };

  const handleResume = async (
    m: RecentMaterial,
    fromCourse: Course | null = null,
    size: RoundSize = 10,
    quizMode: QuizMode = 'practice'
  ) => {
    setTitle(m.title);
    setMaterial(m.content);
    setMaterialId(m.id);
    setMode(quizMode);
    setPdfBase64(undefined);
    setRoundCourse(fromCourse);
    await runRound(size, m.content, m.id, m.title);
  };

  const startReview = (missed: MissedQuestion[]) => {
    if (!missed.length) return;
    setReviewMissed(missed);
    setIsReview(true);
    setMode('practice');
    setTitle(t.review);
    setQuestions(missed.map((m) => m.question));
    setAnswers([]);
    setView('quiz');
  };

  const handleFinish = async (finalAnswers: AnswerRecord[]) => {
    setAnswers(finalAnswers);
    const score = finalAnswers.filter((a) => a.correct).length;

    if (isReview) {
      await gradeReviewResults(userName, reviewMissed, finalAnswers);
    } else {
      await recordRoundResults({
        materialId,
        materialTitle: title,
        userName,
        questions,
        answers: finalAnswers,
      });
      saveAttempt({
        materialId: materialId || null,
        materialTitle: title,
        roundSize,
        score,
        total: questions.length,
        userName,
        mode,
      });
      setLocalMaterialScore(materialId, { score, total: questions.length, roundSize });
    }
    setRefreshKey((k) => k + 1);
    setView('results');
  };

  const retake = async () => {
    if (isReview) {
      const remaining = await listMissed(userName);
      if (remaining.length) startReview(remaining.slice(0, 30));
      else setView('review');
    } else {
      await runRound(roundSize, material, materialId, title);
    }
  };

  // Where to land after a quiz: back to its course, else the courses home.
  const afterQuizView = (): View => (isReview ? 'review' : roundCourse ? 'course' : 'home');

  const openCourse = (c: Course) => {
    setCurrentCourse(c);
    setError(null);
    setView('course');
  };

  // ---- Landing page (public front door) ----
  if (screen === 'landing') {
    return <Landing onEnter={() => setScreen('app')} />;
  }

  // ---- Auth gate ----
  if (authRequired && authLoading) {
    return (
      <div className="min-h-screen bg-[#fefffc] flex items-center justify-center">
        <Loader2 size={28} className="animate-spin text-[#646464]" />
      </div>
    );
  }
  if (authRequired && !session)
    return <Login onBack={() => setScreen('landing')} />;

  const topView: 'home' | 'history' | 'review' | 'dashboard' | 'settings' =
    view === 'history' || view === 'review' || view === 'dashboard' || view === 'settings'
      ? view
      : 'home';

  return (
    <div className="min-h-screen bg-[#fefffc] text-[#2c2c2c]">
      <TopBar
        view={topView}
        onNavigate={(v) => {
          setError(null);
          setView(v);
        }}
        userName={userName}
        authed={authRequired && !!session}
        missedCount={missedCount}
        onChangeUser={changeUser}
      />

      <main>
        {view === 'home' && (
          <CoursesHome
            refreshKey={refreshKey}
            byokActive={byokActive}
            onOpenCourse={openCourse}
            onChanged={() => setRefreshKey((k) => k + 1)}
            onQuickQuiz={() => {
              setUploadCourseId(null);
              setView('upload');
            }}
            onResume={(m) => handleResume(m, null)}
          />
        )}

        {view === 'dashboard' && (
          <Dashboard
            onOpenCourse={openCourse}
            refreshKey={refreshKey}
          />
        )}

        {view === 'settings' && (
          <Settings
            onKeyChange={reloadKeyStatus}
            onSignOut={() => supabase?.auth.signOut()}
          />
        )}

        {view === 'course' && currentCourse && (
          <CourseDetail
            course={currentCourse}
            refreshKey={refreshKey}
            onBack={() => setView('home')}
            onAddChapter={() => {
              setUploadCourseId(currentCourse.id);
              setView('upload');
            }}
            onRead={(m) => {
              setReaderMaterial(m);
              setReaderFocusId(undefined);
              setView('reader');
            }}
            onStudy={(m) => handleResume(m, currentCourse)}
            onReview={() => setView('review')}
            onChanged={() => setRefreshKey((k) => k + 1)}
          />
        )}

        {view === 'reader' && readerMaterial && (
          <ChapterReader
            course={currentCourse}
            material={readerMaterial}
            focusSectionId={readerFocusId}
            onBack={() => setView(currentCourse ? 'course' : 'home')}
            onReview={() => setView('review')}
            onStartQuiz={(size, quizMode) =>
              handleResume(readerMaterial, currentCourse, size, quizMode)
            }
          />
        )}

        {view === 'upload' && (
          <div className="max-w-[760px] mx-auto px-5 md:px-8 pt-6">
            <button
              onClick={() => setView(uploadCourseId ? 'course' : 'home')}
              className="inline-flex items-center gap-1.5 text-[14px] text-[#646464] transition-colors hover:text-[#2c2c2c]"
            >
              <ArrowLeft size={15} /> {uploadCourseId ? t.backToCourse : t.back}
            </button>
            {uploadCourseId && currentCourse && (
              <p className="mt-3 text-[13px] text-[#646464]">
                {t.addChapterTo} <b className="text-[#2c2c2c]">{currentCourse.name}</b>
              </p>
            )}
            <Uploader
              onStart={handleStart}
              allowUpload={byokActive}
              intent={uploadCourseId ? 'chapter' : 'quiz'}
              courseName={currentCourse?.name}
            />
          </div>
        )}

        {view === 'loading' && (
          <div className="max-w-[640px] mx-auto px-5 pt-24 text-center">
            {error ? (
              <>
                <p className="text-[16px] text-red-600 bg-red-50 border border-red-200 rounded-xl px-5 py-4 mb-6">
                  {error}
                </p>
                <div className="flex items-center justify-center gap-3">
                  <button
                    onClick={() =>
                      runRound(roundSize, material, materialId, title, pdfBase64)
                    }
                    className="px-5 py-3 text-[15px] bg-black text-white rounded-full hover:bg-[#2c2c2c] transition-colors"
                  >
                    {t.tryAgain}
                  </button>
                  <button
                    onClick={() => setView(roundCourse ? 'course' : 'home')}
                    className="px-5 py-3 text-[15px] bg-white border-2 border-[#dde3dd] rounded-full hover:bg-[#eef1ed] transition-colors"
                  >
                    {t.back}
                  </button>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-4 text-[#646464]">
                <Loader2 size={28} className="animate-spin" />
                <p className="text-[16px]">{t.loadingQuiz(roundSize)}</p>
                <p className="text-[13px] text-[#b4b8b4]">
                  {t.loadingQuizHint}
                </p>
              </div>
            )}
          </div>
        )}

        {view === 'quiz' && (
          <QuizRunner
            title={title}
            questions={questions}
            mode={mode}
            material={material}
            onOpenSource={(sectionId) => {
              setReaderMaterial({
                id: materialId,
                title,
                content: material,
                sourceType: 'text',
                createdAt: new Date().toISOString(),
                courseId: roundCourse?.id,
              });
              setCurrentCourse(roundCourse);
              setReaderFocusId(sectionId);
              setView('reader');
            }}
            onFinish={handleFinish}
            onQuit={() => setView(afterQuizView())}
          />
        )}

        {view === 'results' && (
          <Results
            title={title}
            questions={questions}
            answers={answers}
            roundSize={roundSize}
            isReview={isReview}
            onRound={(size) => runRound(size, material, materialId, title)}
            onRetake={retake}
            onNewMaterial={() => {
              if (isReview) {
                setView('review');
              } else if (roundCourse) {
                setCurrentCourse(roundCourse);
                setView('course');
              } else {
                setMaterial('');
                setTitle('');
                setView('home');
              }
            }}
          />
        )}

        {view === 'history' && <History />}

        {view === 'review' && (
          <Review userName={userName} refreshKey={refreshKey} onDrill={startReview} />
        )}
      </main>
    </div>
  );
}
