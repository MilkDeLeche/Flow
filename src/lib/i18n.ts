import { useEffect, useMemo, useState } from 'react';

export type Locale = 'en' | 'es';
export type LocalePreference = 'auto' | Locale;

const STORE = 'flow_locale';

function browserLocale(): Locale {
  if (typeof navigator === 'undefined') return 'en';
  return navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
}

export function localeFromPreference(pref: LocalePreference): Locale {
  return pref === 'auto' ? browserLocale() : pref;
}

export function getLocalePreference(): LocalePreference {
  if (typeof localStorage === 'undefined') return 'auto';
  const saved = localStorage.getItem(STORE);
  return saved === 'en' || saved === 'es' || saved === 'auto' ? saved : 'auto';
}

export function setLocalePreference(pref: LocalePreference) {
  localStorage.setItem(STORE, pref);
  window.dispatchEvent(new Event('flow-locale-change'));
}

export const copy = {
  en: {
    back: 'Back',
    backToCourse: 'Back to course',
    addChapterTo: 'Adding a chapter to',
    addChapter: 'Add chapter',
    addChapterTitle: 'Add a chapter',
    addChapterIntro: (course: string) =>
      `Paste the chapter for ${course}. Flow will name it if you leave the title blank, then open it as a reader before you quiz.`,
    chapterTitleOptional: 'Chapter title (optional)',
    chapterTitlePlaceholder: 'Leave blank to auto-name from the text',
    saveChapter: 'Save chapter',
    contents: 'Contents',
    opening: 'Opening',
    chapterText: 'Chapter text',
    part: (index: number) => `Part ${index}`,
    allMaterial: 'All material',
    minRead: (minutes: number) => `${minutes} min read`,
    charsShort: (count: string) => `${count} chars`,
    addedDate: (date: string) => `Added ${date}`,
    lastQuiz: (score: number, total: number) => `last quiz ${score}/${total}`,
    studyThisChapter: 'Study this chapter',
    readFirstQuiz: 'Read first, quiz when ready.',
    roundSize: 'Round size',
    startQuizPlain: 'Start quiz',
    reviewMistakes: 'Review mistakes',
    chapters: 'Chapters',
    noChapters:
      'No chapters yet. Paste one in and Flow will organize it for reading and quizzing.',
    read: 'Read',
    quiz: 'Quiz',
    allCourses: 'All courses',
    quizzesTests: 'Quizzes & tests',
    noAttempts: "No attempts yet - they'll show here once you take a quiz or an exam.",
    test: 'Test',
    loadingQuiz: (count: number) => `Building your ${count}-question quiz...`,
    loadingQuizHint:
      'Reading the material and writing explanations. Future rounds of this material are served from the cache, no waiting.',
    tryAgain: 'Try again',
    study: 'Study',
    review: 'Review',
    history: 'History',
    dashboard: 'Dashboard',
    settings: 'Settings',
    yourName: 'Your name',
    changeStudent: "Change who's studying",
    heroTitle: 'Turn any chapter into a quiz that teaches you',
    heroBody:
      'Paste a chapter, drop a PDF, or upload your slides. Flow writes progressive practice rounds (10, 20, 30, 40, 50 questions) and explains why every wrong answer is wrong, in the language of your material.',
    startStudying: 'Start studying',
    seeHow: 'See how it works',
    features: 'Features',
    demo: 'Demo',
    logIn: 'Log in',
    signInKeep: 'Sign in to keep studying.',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign in',
    yourCourses: 'Your courses',
    coursesIntro: 'Pick a class to study, or start a quick one-off quiz.',
    newCourse: 'New course',
    noCourses: 'No courses yet. Create one to organize your chapters, quizzes, and tests.',
    quickQuiz: 'or take a quick quiz without a course ->',
    uploadTitle: 'Turn any chapter into a quiz',
    uploadIntro:
      'Paste a chapter or upload a PDF / PowerPoint. Get rounds of 10, then 20, 30, up to 50 questions. Every wrong answer explains why, in the language of your material.',
    nameMaterial: 'Name this material',
    materialPlaceholder: 'e.g. Bio Ch.11 - Evolution, or Diapositivas de Economia T3',
    pasteMaterial: 'Paste the material',
    characters: 'characters',
    pastePlaceholder: 'Paste your chapter, notes, or slide text here...',
    or: 'or',
    readingFile: 'Reading file...',
    uploadFile: 'Upload PDF / PPTX / TXT',
    loadedFrom: 'loaded from',
    uploadLocked: 'File upload (PDF / PPTX) unlocks when you add your own API key below.',
    startWith: 'Start with',
    questions: 'questions',
    mode: 'Mode',
    practice: 'Practice',
    exam: 'Exam',
    practiceHint: 'Practice - see what is right or wrong as you go.',
    examHint: 'Exam - just like the real thing; results and review at the end.',
    startQuiz: (count: number, mode: string) =>
      `Start ${count}-question ${mode === 'exam' ? 'exam' : 'quiz'}`,
    addMaterial: 'Add some material to begin',
    historyOff: 'History saving is off. Add Supabase keys to enable shared progress across devices.',
    questionOf: (current: number, total: number) => `Question ${current} of ${total}`,
    quit: 'Quit',
    workedSolution: 'Worked solution',
    answered: (answered: number, total: number) => `${answered}/${total} answered`,
    score: (score: number, total: number) => `Score: ${score}/${total}`,
    seeResults: 'See results',
    next: 'Next',
    nextQuestion: 'Next question',
    examReady: 'Exam-ready',
    almostThere: 'Almost there',
    keepDrilling: 'Keep drilling',
    drillMistakes: 'Drill remaining mistakes',
    done: 'Done',
    nextRound: (count: number) => `Next round: ${count} questions`,
    another50: 'Another 50 - full drill',
    retake: (count: number) => `Retake ${count}`,
    newMaterial: 'New material',
    jumpRound: 'Jump to a round size',
    yourAnswer: 'your answer',
    settingsTitle: 'Settings',
    settingsIntro: 'Manage your API key, language, and account session.',
    language: 'Language',
    languageIntro: 'Use browser language automatically, or choose one for this device.',
    auto: 'Auto',
    english: 'English',
    spanish: 'Spanish',
    account: 'Account',
    signOutHint: 'Sign out when you are done studying on this device.',
    signOut: 'Sign out',
    apiActive: 'Using your own key',
    freeTier: 'Free tier',
    active: 'Active',
    change: 'Change',
    remove: 'Remove',
    modelCheap: 'Model (cheaper = saves money)',
    saveKey: 'Save key',
    cancel: 'Cancel',
    addKey: 'Add your API key',
  },
  es: {
    back: 'Volver',
    backToCourse: 'Volver al curso',
    addChapterTo: 'Agregando un capitulo a',
    addChapter: 'Agregar capitulo',
    addChapterTitle: 'Agregar un capitulo',
    addChapterIntro: (course: string) =>
      `Pega el capitulo para ${course}. Flow lo nombra si dejas el titulo en blanco, y luego lo abre como lector antes del quiz.`,
    chapterTitleOptional: 'Titulo del capitulo (opcional)',
    chapterTitlePlaceholder: 'Dejalo en blanco para nombrarlo desde el texto',
    saveChapter: 'Guardar capitulo',
    contents: 'Contenido',
    opening: 'Inicio',
    chapterText: 'Texto del capitulo',
    part: (index: number) => `Parte ${index}`,
    allMaterial: 'Todo el material',
    minRead: (minutes: number) => `${minutes} min de lectura`,
    charsShort: (count: string) => `${count} caracteres`,
    addedDate: (date: string) => `Agregado ${date}`,
    lastQuiz: (score: number, total: number) => `ultimo quiz ${score}/${total}`,
    studyThisChapter: 'Estudiar este capitulo',
    readFirstQuiz: 'Lee primero, haz el quiz cuando estes lista.',
    roundSize: 'Tamano de ronda',
    startQuizPlain: 'Empezar quiz',
    reviewMistakes: 'Repasar errores',
    chapters: 'Capitulos',
    noChapters:
      'Aun no hay capitulos. Pega uno y Flow lo ordena para leer y practicar.',
    read: 'Leer',
    quiz: 'Quiz',
    allCourses: 'Todos los cursos',
    quizzesTests: 'Quizzes y pruebas',
    noAttempts: 'Aun no hay intentos. Apareceran aqui cuando hagas un quiz o una prueba.',
    test: 'Prueba',
    loadingQuiz: (count: number) => `Creando tu quiz de ${count} preguntas...`,
    loadingQuizHint:
      'Leyendo el material y escribiendo explicaciones. Las proximas rondas de este material salen del cache, sin esperar.',
    tryAgain: 'Intentar de nuevo',
    study: 'Estudiar',
    review: 'Repasar',
    history: 'Historial',
    dashboard: 'Panel',
    settings: 'Ajustes',
    yourName: 'Tu nombre',
    changeStudent: 'Cambiar quien esta estudiando',
    heroTitle: 'Convierte cualquier capitulo en un quiz que te ensena',
    heroBody:
      'Pega un capitulo, sube un PDF o tus diapositivas. Flow crea rondas progresivas de practica (10, 20, 30, 40, 50 preguntas) y explica por que cada respuesta incorrecta esta mal, en el idioma de tu material.',
    startStudying: 'Empezar a estudiar',
    seeHow: 'Ver como funciona',
    features: 'Funciones',
    demo: 'Demo',
    logIn: 'Iniciar sesion',
    signInKeep: 'Inicia sesion para seguir estudiando.',
    email: 'Correo',
    password: 'Contrasena',
    signIn: 'Entrar',
    yourCourses: 'Tus cursos',
    coursesIntro: 'Elige una clase para estudiar o empieza un quiz rapido.',
    newCourse: 'Nuevo curso',
    noCourses: 'Aun no hay cursos. Crea uno para ordenar capitulos, quizzes y pruebas.',
    quickQuiz: 'o haz un quiz rapido sin curso ->',
    uploadTitle: 'Convierte cualquier capitulo en un quiz',
    uploadIntro:
      'Pega un capitulo o sube un PDF / PowerPoint. Obtendras rondas de 10, luego 20, 30, hasta 50 preguntas. Cada error explica por que, en el idioma de tu material.',
    nameMaterial: 'Nombra este material',
    materialPlaceholder: 'ej. Biologia cap. 11 - Evolucion, o Diapositivas de Economia T3',
    pasteMaterial: 'Pega el material',
    characters: 'caracteres',
    pastePlaceholder: 'Pega aqui tu capitulo, apuntes o texto de diapositivas...',
    or: 'o',
    readingFile: 'Leyendo archivo...',
    uploadFile: 'Subir PDF / PPTX / TXT',
    loadedFrom: 'cargado desde',
    uploadLocked: 'Subir archivos (PDF / PPTX) se desbloquea cuando agregas tu propia API key abajo.',
    startWith: 'Empezar con',
    questions: 'preguntas',
    mode: 'Modo',
    practice: 'Practica',
    exam: 'Examen',
    practiceHint: 'Practica - ves lo correcto o incorrecto mientras avanzas.',
    examHint: 'Examen - como una prueba real; resultados y repaso al final.',
    startQuiz: (count: number, mode: string) =>
      `Empezar ${mode === 'exam' ? 'examen' : 'quiz'} de ${count} preguntas`,
    addMaterial: 'Agrega material para empezar',
    historyOff: 'El historial esta desactivado. Agrega las claves de Supabase para sincronizar entre dispositivos.',
    questionOf: (current: number, total: number) => `Pregunta ${current} de ${total}`,
    quit: 'Salir',
    workedSolution: 'Solucion desarrollada',
    answered: (answered: number, total: number) => `${answered}/${total} respondidas`,
    score: (score: number, total: number) => `Puntaje: ${score}/${total}`,
    seeResults: 'Ver resultados',
    next: 'Siguiente',
    nextQuestion: 'Siguiente pregunta',
    examReady: 'Listo para la prueba',
    almostThere: 'Casi listo',
    keepDrilling: 'Sigue practicando',
    drillMistakes: 'Practicar errores restantes',
    done: 'Listo',
    nextRound: (count: number) => `Siguiente ronda: ${count} preguntas`,
    another50: 'Otras 50 - practica completa',
    retake: (count: number) => `Repetir ${count}`,
    newMaterial: 'Nuevo material',
    jumpRound: 'Saltar a otro tamano de ronda',
    yourAnswer: 'tu respuesta',
    settingsTitle: 'Ajustes',
    settingsIntro: 'Administra tu API key, idioma y sesion.',
    language: 'Idioma',
    languageIntro: 'Usa el idioma del navegador automaticamente, o elige uno para este dispositivo.',
    auto: 'Automatico',
    english: 'Ingles',
    spanish: 'Espanol',
    account: 'Cuenta',
    signOutHint: 'Cierra sesion cuando termines de estudiar en este dispositivo.',
    signOut: 'Cerrar sesion',
    apiActive: 'Usando tu propia key',
    freeTier: 'Plan gratis',
    active: 'Activa',
    change: 'Cambiar',
    remove: 'Eliminar',
    modelCheap: 'Modelo (mas barato = ahorra dinero)',
    saveKey: 'Guardar key',
    cancel: 'Cancelar',
    addKey: 'Agregar tu API key',
  },
} as const;

export function useLocale() {
  const [pref, setPrefState] = useState<LocalePreference>(() => getLocalePreference());

  useEffect(() => {
    const sync = () => setPrefState(getLocalePreference());
    window.addEventListener('storage', sync);
    window.addEventListener('flow-locale-change', sync);
    return () => {
      window.removeEventListener('storage', sync);
      window.removeEventListener('flow-locale-change', sync);
    };
  }, []);

  const locale = localeFromPreference(pref);
  return useMemo(
    () => ({
      locale,
      preference: pref,
      setPreference: setLocalePreference,
      t: copy[locale],
    }),
    [locale, pref]
  );
}
