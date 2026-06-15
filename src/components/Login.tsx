import { useState } from 'react';
import { Loader2, Lock, ArrowLeft, Mail } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLocale } from '../lib/i18n';
import TurnstileWidget, { turnstileEnabled } from './TurnstileWidget';

const LOGIN_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4';

interface LoginProps {
  onBack?: () => void;
}

type Mode = 'signIn' | 'signUp';

export default function Login({ onBack }: LoginProps) {
  const { t } = useLocale();
  const [mode, setMode] = useState<Mode>('signIn');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
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
    const { error: oauthError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: window.location.origin },
    });
    if (oauthError) setError(oauthError.message);
    setBusy(false);
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

  if (awaitingConfirm) {
    return (
      <div className="relative flex min-h-screen items-center justify-center bg-surface px-5 text-ink">
        <div className="w-full max-w-[420px] rounded-2xl border-2 border-line bg-surface-card p-8 text-center">
          <Mail size={32} className="mx-auto mb-4 text-ink-secondary" />
          <h1 className="mb-2 font-mondwest text-[32px] leading-none">{t.checkEmailTitle}</h1>
          <p className="mb-6 text-[15px] leading-relaxed text-ink-secondary">
            {t.checkEmailBody(email.trim())}
          </p>
          <button
            onClick={resendConfirmation}
            disabled={busy || !captchaOk}
            className="mb-3 inline-flex w-full items-center justify-center gap-2 rounded-full border-2 border-line px-5 py-3 text-[14px] transition-colors hover:bg-surface-muted disabled:opacity-50"
          >
            {busy ? <Loader2 size={16} className="animate-spin" /> : null}
            {t.resendConfirmation}
          </button>
          <TurnstileWidget onToken={setCaptchaToken} className="mb-3 flex justify-center" />
          <button
            onClick={() => {
              setAwaitingConfirm(false);
              setMode('signIn');
            }}
            className="text-[13px] text-ink-muted underline hover:text-ink"
          >
            {t.backToSignIn}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-surface px-5 text-ink">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        src={LOGIN_VIDEO}
      />

      {onBack && (
        <button
          onClick={onBack}
          className="absolute left-5 top-5 z-20 inline-flex items-center gap-1.5 rounded-full bg-surface-card px-4 py-2 text-[14px] text-ink shadow-[0_8px_24px_rgba(44,44,44,0.14)] transition-colors hover:bg-surface-muted md:left-8 md:top-8"
        >
          <ArrowLeft size={15} /> {t.back}
        </button>
      )}

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-mondwest text-[44px] leading-none text-white">Flow</h1>
          <p className="text-[15px] text-white">
            {mode === 'signUp' ? t.signUpKeep : t.signInKeep}
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border-2 border-line bg-surface-card p-6">
          <div className="grid grid-cols-2 gap-1 rounded-full bg-surface-muted p-1">
            {(['signIn', 'signUp'] as const).map((value) => (
              <button
                key={value}
                type="button"
                onClick={() => {
                  setMode(value);
                  setError(null);
                }}
                className={`rounded-full py-2 text-[13px] transition-colors ${
                  mode === value
                    ? 'bg-surface-card text-ink shadow-sm'
                    : 'text-ink-muted hover:text-ink'
                }`}
              >
                {value === 'signIn' ? t.signIn : t.signUp}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={signInWithGoogle}
            disabled={busy || !supabase}
            className="inline-flex w-full items-center justify-center gap-3 rounded-full border-2 border-line bg-surface px-5 py-3 text-[15px] text-ink transition-colors hover:bg-surface-muted disabled:opacity-60"
          >
            <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
              <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303C33.654 32.657 29.223 36 24 36c-5.514 0-10-4.486-10-10s4.486-10 10-10c2.659 0 5.062 1.035 6.863 2.719l6.062-6.062C34.046 9.835 29.268 8 24 8 12.955 8 4 16.955 4 28s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
              <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 16.108 18.961 13 24 13c2.659 0 5.062 1.035 6.863 2.719l6.062-6.062C34.046 9.835 29.268 8 24 8 16.318 8 9.656 13.337 6.306 14.691z" />
              <path fill="#4CAF50" d="M24 48c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238C29.211 38.408 26.715 39.5 24 39.5c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 43.556 16.227 48 24 48z" />
              <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 28c0-1.341-.138-2.65-.389-3.917z" />
            </svg>
            {t.continueWithGoogle}
          </button>

          <div className="flex items-center gap-3 text-[12px] text-ink-muted">
            <span className="h-px flex-1 bg-line" />
            {mode === 'signUp' ? t.orEmailSignUp : t.orEmailSignIn}
            <span className="h-px flex-1 bg-line" />
          </div>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="mb-1.5 block text-[13px] text-ink-secondary">{t.email}</label>
              <input
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full rounded-xl border-2 border-line bg-surface px-4 py-3 text-[15px] outline-none focus:border-line-strong"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-[13px] text-ink-secondary">{t.password}</label>
              <input
                type="password"
                autoComplete={mode === 'signUp' ? 'new-password' : 'current-password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-xl border-2 border-line bg-surface px-4 py-3 text-[15px] outline-none focus:border-line-strong"
              />
              {mode === 'signUp' && (
                <p className="mt-1 text-[11px] text-ink-muted">{t.passwordHint}</p>
              )}
            </div>

            <TurnstileWidget onToken={setCaptchaToken} className="flex justify-center" />

            {error && (
              <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13.5px] text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={busy || !captchaOk}
              className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-accent px-5 py-3 text-[15px] text-accent-ink transition-colors hover:opacity-90 disabled:opacity-60"
            >
              {busy ? <Loader2 size={16} className="animate-spin" /> : <Lock size={15} />}
              {mode === 'signUp' ? t.createAccount : t.signIn}
            </button>
          </form>

          <p className="text-center text-[12px] leading-relaxed text-ink-muted">
            {t.signInLegalNote}{' '}
            <a href="/#privacy" className="underline hover:text-ink-secondary">
              {t.privacyPolicy}
            </a>{' '}
            {t.and}{' '}
            <a href="/#terms" className="underline hover:text-ink-secondary">
              {t.termsOfUse}
            </a>
            .
          </p>
        </div>
      </div>
    </div>
  );
}
