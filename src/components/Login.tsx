import { useState } from 'react';
import { Loader2, Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useLocale } from '../lib/i18n';

const LOGIN_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260314_131748_f2ca2a28-fed7-44c8-b9a9-bd9acdd5ec31.mp4';

interface LoginProps {
  /** Return to the public landing page without signing in. */
  onBack?: () => void;
}

export default function Login({ onBack }: LoginProps) {
  const { t } = useLocale();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setBusy(true);
    setError(null);
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });
    if (error) setError(error.message);
    setBusy(false);
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-5 text-[#2c2c2c]">
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
          className="absolute left-5 top-5 z-20 inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-[14px] text-[#2c2c2c] shadow-[0_8px_24px_rgba(44,44,44,0.14)] transition-colors hover:bg-[#eef1ed] md:left-8 md:top-8"
        >
          <ArrowLeft size={15} /> {t.back}
        </button>
      )}

      <div className="relative z-10 w-full max-w-[400px]">
        <div className="mb-8 text-center">
          <h1 className="mb-2 font-mondwest text-[44px] leading-none text-white">
            Flow
          </h1>
          <p className="text-[15px] text-white">{t.signInKeep}</p>
        </div>

        <form
          onSubmit={submit}
          className="space-y-4 rounded-2xl border-2 border-[#dde3dd] bg-white p-6"
        >
          <div>
            <label className="mb-1.5 block text-[13px] text-[#646464]">
              {t.email}
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full rounded-xl border-2 border-[#dde3dd] bg-[#fefffc] px-4 py-3 text-[15px] outline-none transition-colors focus:border-[#b8beb8]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-[13px] text-[#646464]">
              {t.password}
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full rounded-xl border-2 border-[#dde3dd] bg-[#fefffc] px-4 py-3 text-[15px] outline-none transition-colors focus:border-[#b8beb8]"
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[13.5px] text-red-600">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-black px-5 py-3 text-[15px] text-white transition-colors hover:bg-[#2c2c2c] disabled:opacity-60"
          >
            {busy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Lock size={15} />
            )}
            {t.signIn}
          </button>
        </form>
      </div>
    </div>
  );
}
