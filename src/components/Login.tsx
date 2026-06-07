import { useState } from 'react';
import { Loader2, Lock, ArrowLeft } from 'lucide-react';
import { supabase } from '../lib/supabase';

const LOGIN_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260302_085640_276ea93b-d7da-4418-a09b-2aa5b490e838.mp4';

interface LoginProps {
  /** Return to the public landing page without signing in. */
  onBack?: () => void;
}

export default function Login({ onBack }: LoginProps) {
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
    <div className="relative min-h-screen text-[#2c2c2c] flex items-center justify-center px-5 overflow-hidden">
      <video
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 h-full w-full object-cover"
        src={LOGIN_VIDEO}
      />
      {/* legibility overlay — keeps the off-white brand feel over the video */}
      <div className="absolute inset-0 bg-[#fefffc]/55 backdrop-blur-[2px]" />

      <div className="relative z-10 w-full max-w-[400px]">
        {onBack && (
          <button
            onClick={onBack}
            className="mb-6 inline-flex items-center gap-1.5 text-[14px] text-[#646464] transition-colors hover:text-[#2c2c2c]"
          >
            <ArrowLeft size={15} /> Back
          </button>
        )}
        <div className="text-center mb-8">
          <h1 className="font-mondwest text-[44px] leading-none mb-2">
            Flow
          </h1>
          <p className="text-[15px] text-[#646464]">Sign in to keep studying.</p>
        </div>

        <form
          onSubmit={submit}
          className="border-2 border-[#dde3dd] rounded-2xl p-6 space-y-4 bg-white"
        >
          <div>
            <label className="block text-[13px] text-[#646464] mb-1.5">
              Email
            </label>
            <input
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-3 text-[15px] bg-[#fefffc] border-2 border-[#dde3dd] rounded-xl outline-none focus:border-[#b8beb8] transition-colors"
            />
          </div>
          <div>
            <label className="block text-[13px] text-[#646464] mb-1.5">
              Password
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-3 text-[15px] bg-[#fefffc] border-2 border-[#dde3dd] rounded-xl outline-none focus:border-[#b8beb8] transition-colors"
            />
          </div>

          {error && (
            <p className="text-[13.5px] text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="w-full inline-flex items-center justify-center gap-2 px-5 py-3 text-[15px] bg-black text-white rounded-full hover:bg-[#2c2c2c] transition-colors disabled:opacity-60"
          >
            {busy ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Lock size={15} />
            )}
            Sign in
          </button>
        </form>

      </div>
    </div>
  );
}
