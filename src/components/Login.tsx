import { useRef, useState } from 'react';
import { ArrowLeft, Eye, EyeOff, Loader2, Mail } from 'lucide-react';
import FadeUp from '../FadeUp';
import LiquidGlassCanvas from '../LiquidGlass';
import { supabase } from '../lib/supabase';
import { useLocale } from '../lib/i18n';
import TurnstileWidget, { turnstileEnabled } from './TurnstileWidget';

const LOGIN_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260606_135315_5f9e8a4c-09bc-4a97-9f75-8a387d4258ee.mp4';

const sceneClass =
  'relative min-h-[100dvh] w-full overflow-x-hidden font-[Inter,ui-sans-serif,system-ui,sans-serif] antialiased';
const shellClass = (withBack = false) =>
  `relative z-10 flex min-h-[100dvh] w-full items-center justify-center overflow-y-auto px-4 py-6 sm:px-6 sm:py-10 pb-[max(1.5rem,env(safe-area-inset-bottom,0px))] ${
    withBack
      ? 'pt-[max(4.75rem,env(safe-area-inset-top,0px)+3.5rem)]'
      : 'pt-[max(1.5rem,env(safe-area-inset-top,0px))]'
  }`;
const cardClass =
  'relative w-full max-w-lg overflow-hidden rounded-2xl p-5 shadow-2xl sm:p-8 md:p-12';
const inputClass =
  'w-full rounded-xl border border-white/15 bg-white/5 px-4 py-3.5 text-base text-white outline-none transition-colors placeholder:text-white/30 focus:border-white/30 focus:bg-white/10 sm:text-sm';

interface LoginProps {
  onBack?: () => void;
}

type Mode = 'signIn' | 'signUp';

function FlowLogo() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 256 256"
      aria-hidden
      className="mx-auto h-10 w-10 sm:h-12 sm:w-12"
    >
      <path
        fill="white"
        d="M 128 192 L 128 256 L 64.5 256 L 32 223 L 0 192 L 0 128 L 64 128 Z M 256 192 L 256 256 L 192.5 256 L 160 223 L 128 192 L 128 128 L 192 128 Z M 128 64 L 128 128 L 64.5 128 L 32 95 L 0 64 L 0 0 L 64 0 Z M 256 64 L 256 128 L 192.5 128 L 160 95 L 128 64 L 128 0 L 192 0 Z"
      />
    </svg>
  );
}

function LoginBackgroundVideo({
  videoRef,
}: {
  videoRef: React.RefObject<HTMLVideoElement>;
}) {
  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      crossOrigin="anonymous"
      className="pointer-events-none absolute inset-0 h-full w-full object-cover"
      src={LOGIN_VIDEO}
    />
  );
}

function LoginGlassCard({
  sceneRef,
  videoRef,
  cardRef,
  children,
}: {
  sceneRef: React.RefObject<HTMLDivElement>;
  videoRef: React.RefObject<HTMLVideoElement>;
  cardRef: React.RefObject<HTMLDivElement>;
  children: React.ReactNode;
}) {
  return (
    <div ref={cardRef} className={cardClass}>
      <LiquidGlassCanvas videoRef={videoRef} sceneRef={sceneRef} cardRef={cardRef} />
      <div className="relative z-[1]">{children}</div>
    </div>
  );
}

function GoogleMark() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

export default function Login({ onBack }: LoginProps) {
  const { t } = useLocale();
  const sceneRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [staySignedIn, setStaySignedIn] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [captchaToken, setCaptchaToken] = useState<string | null>(null);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  const captchaRequired = turnstileEnabled();
  const captchaOk = !captchaRequired || Boolean(captchaToken);

  const authOptions = () => ({
    captchaToken: captchaToken ?? undefined,
    emailRedirectTo: window.location.origin,
  });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase || !captchaOk) return;
    setBusy(true);
    setError(null);
    setNotice(null);

    if (mode === 'signUp') {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email: email.trim(),
        password,
        options: authOptions(),
      });
      setBusy(false);
      if (signUpError) {
        setError(signUpError.message);
        return;
      }
      if (data.user && !data.session) {
        setAwaitingConfirm(true);
        return;
      }
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
      options: { captchaToken: captchaToken ?? undefined },
    });
    setBusy(false);
    if (signInError) setError(signInError.message);
  };

  const signInWithGoogle = async () => {
    if (!supabase) return;
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
        scopes: 'profile email',
      },
    });
    if (oauthError) setError(oauthError.message);
    setBusy(false);
  };

  const resetPassword = async () => {
    if (!supabase) return;
    if (!email.trim()) {
      setError(t.enterEmailForReset);
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: window.location.origin,
    });
    setBusy(false);
    if (resetError) setError(resetError.message);
    else setNotice(t.resetPasswordSent);
  };

  const resendConfirmation = async () => {
    if (!supabase || !email.trim()) return;
    setBusy(true);
    setError(null);
    const { error: resendError } = await supabase.auth.resend({
      type: 'signup',
      email: email.trim(),
      options: { captchaToken: captchaToken ?? undefined },
    });
    setBusy(false);
    if (resendError) setError(resendError.message);
  };

  const toggleMode = () => {
    setMode((current) => (current === 'signIn' ? 'signUp' : 'signIn'));
    setError(null);
    setNotice(null);
  };

  if (awaitingConfirm) {
    return (
      <div ref={sceneRef} className={sceneClass}>
        <LoginBackgroundVideo videoRef={videoRef} />
        <div className={shellClass()}>
          <LoginGlassCard sceneRef={sceneRef} videoRef={videoRef} cardRef={cardRef}>
            <div className="text-center text-white">
              <Mail size={32} className="mx-auto mb-4 text-white/70" />
              <h1 className="mb-2 text-xl font-semibold tracking-tight sm:text-2xl">
                {t.checkEmailTitle}
              </h1>
              <p className="mb-6 text-sm leading-relaxed text-white/60">{t.checkEmailBody(email.trim())}</p>
              <button
                type="button"
                onClick={resendConfirmation}
                disabled={busy || !captchaOk}
                className="mb-3 w-full rounded-full bg-white py-3.5 text-base font-semibold text-gray-900 hover:bg-white/90 disabled:opacity-50 sm:text-sm"
              >
                {busy ? <Loader2 size={16} className="mx-auto animate-spin" /> : t.resendConfirmation}
              </button>
              <TurnstileWidget
                onToken={setCaptchaToken}
                className="mb-3 flex max-w-full justify-center overflow-x-auto"
              />
              <button
                type="button"
                onClick={() => {
                  setAwaitingConfirm(false);
                  setMode('signIn');
                }}
                className="text-sm text-white/50 hover:text-white"
              >
                {t.backToSignIn}
              </button>
            </div>
          </LoginGlassCard>
        </div>
      </div>
    );
  }

  return (
    <div ref={sceneRef} className={sceneClass}>
      <LoginBackgroundVideo videoRef={videoRef} />

      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="absolute left-4 z-20 inline-flex items-center gap-1.5 rounded-full border border-white/15 bg-black/30 px-3 py-2 text-sm text-white/80 backdrop-blur-sm transition-colors hover:text-white sm:left-6 sm:px-4 top-[max(0.75rem,env(safe-area-inset-top,0px)+0.5rem)]"
        >
          <ArrowLeft size={15} /> {t.back}
        </button>
      )}

      <div className={shellClass(Boolean(onBack))}>
        <LoginGlassCard sceneRef={sceneRef} videoRef={videoRef} cardRef={cardRef}>
          <form onSubmit={submit} className="space-y-4 sm:space-y-5">
            <FadeUp delay={0}>
              <FlowLogo />
            </FadeUp>

            <FadeUp delay={100}>
              <h1 className="mb-2 bg-gradient-to-r from-white to-purple-300 bg-clip-text text-center text-2xl font-medium tracking-tight text-transparent sm:text-3xl md:text-4xl lg:text-5xl">
                {mode === 'signUp' ? t.createAccount : t.loginWelcome}
              </h1>
            </FadeUp>

            <FadeUp delay={200}>
              <p className="mb-5 text-center text-xs leading-relaxed text-white/60 sm:mb-8 sm:text-sm md:text-base">
                {mode === 'signUp' ? (
                  t.signUpKeep
                ) : (
                  <>
                    {t.loginSubtitle}{' '}
                    <span className="block sm:inline">{t.loginSubtitleBreak}</span>
                  </>
                )}
              </p>
            </FadeUp>

            <FadeUp delay={300}>
              <label className="mb-1.5 block text-sm font-medium text-white/70">{t.email}</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder={t.emailPlaceholder}
                className={inputClass}
              />
            </FadeUp>

            <FadeUp delay={400}>
              <label className="mb-1.5 block text-sm font-medium text-white/70">{t.password}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder={t.passwordPlaceholder}
                  className={`${inputClass} pr-12`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              {mode === 'signUp' && (
                <p className="mt-1.5 text-xs text-white/40">{t.passwordHint}</p>
              )}
            </FadeUp>

            {mode === 'signIn' && (
              <FadeUp delay={500}>
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <label className="group flex cursor-pointer items-center gap-2.5">
                    <input
                      type="checkbox"
                      checked={staySignedIn}
                      onChange={(e) => setStaySignedIn(e.target.checked)}
                      className="sr-only"
                    />
                    <span className="relative h-5 w-5 shrink-0 rounded border border-white/20 bg-white/5 group-has-[:checked]:border-purple-400 group-has-[:checked]:bg-purple-500">
                      <svg
                        className="absolute left-0.5 top-0.5 hidden h-4 w-4 text-white group-has-[:checked]:block"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth={3}
                        aria-hidden
                      >
                        <path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="text-sm text-white/70">{t.staySignedIn}</span>
                  </label>
                  <button
                    type="button"
                    onClick={resetPassword}
                    disabled={busy}
                    className="self-start text-left text-sm text-white/70 hover:text-white disabled:opacity-50 sm:self-auto"
                  >
                    {t.resetPassword}
                  </button>
                </div>
              </FadeUp>
            )}

            <FadeUp delay={600}>
              <TurnstileWidget
                onToken={setCaptchaToken}
                className="flex max-w-full justify-center overflow-x-auto"
              />
              {error && (
                <p className="mt-3 rounded-xl border border-red-400/30 bg-red-950/40 px-3 py-2 text-sm text-red-200">
                  {error}
                </p>
              )}
              {notice && (
                <p className="mt-3 rounded-xl border border-emerald-400/30 bg-emerald-950/40 px-3 py-2 text-sm text-emerald-200">
                  {notice}
                </p>
              )}
              <button
                type="submit"
                disabled={busy || !captchaOk || !supabase}
                className="mt-3 flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-base font-semibold text-gray-900 hover:bg-white/90 active:scale-[0.98] disabled:opacity-60"
              >
                {busy ? <Loader2 size={18} className="animate-spin" /> : null}
                {mode === 'signUp' ? t.createAccount : t.signIn}
              </button>
            </FadeUp>

            <FadeUp delay={700}>
              <div className="my-5 flex items-center gap-3 sm:my-6 sm:gap-4">
                <span className="h-px flex-1 bg-white/15" />
                <span className="shrink-0 text-xs text-white/40 sm:text-sm">{t.orDivider}</span>
                <span className="h-px flex-1 bg-white/15" />
              </div>
            </FadeUp>

            <FadeUp delay={800}>
              <button
                type="button"
                onClick={signInWithGoogle}
                disabled={busy || !supabase}
                className="flex w-full items-center justify-center gap-3 rounded-full border border-white/15 bg-white/5 px-4 py-3.5 text-sm font-medium text-white hover:bg-white/10 active:scale-[0.98] disabled:opacity-60"
              >
                <GoogleMark />
                <span className="truncate">{t.continueWithGoogle}</span>
              </button>
            </FadeUp>

            <FadeUp delay={900}>
              <p className="mt-5 text-center text-sm text-white/50 sm:mt-6">
                {mode === 'signIn' ? t.newToFlow : `${t.signInInstead}?`}{' '}
                <button
                  type="button"
                  onClick={toggleMode}
                  className="font-medium text-white hover:text-purple-300"
                >
                  {mode === 'signIn' ? t.joinNow : t.signIn}
                </button>
              </p>
              <p className="mt-4 text-center text-xs leading-relaxed text-white/40">
                {t.signInLegalNote}{' '}
                <a href="/#privacy" className="underline hover:text-white/70">
                  {t.privacyPolicy}
                </a>{' '}
                {t.and}{' '}
                <a href="/#terms" className="underline hover:text-white/70">
                  {t.termsOfUse}
                </a>
                .
              </p>
            </FadeUp>
          </form>
        </LoginGlassCard>
      </div>
    </div>
  );
}
