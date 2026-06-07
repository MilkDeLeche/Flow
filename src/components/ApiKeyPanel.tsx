import { useEffect, useState } from 'react';
import { Check, Key, Trash2, Loader2 } from 'lucide-react';
import {
  loadKeyStatus,
  saveKey,
  clearKey,
  keyLooksValid,
  PROVIDER_LABEL,
  PROVIDER_MODELS,
  KEY_HINT,
  type Provider,
  type KeyStatus,
} from '../lib/byok';
import { supabaseEnabled } from '../lib/supabase';

interface ApiKeyPanelProps {
  onChange?: () => void;
}

const PROVIDERS: Provider[] = ['anthropic', 'openai', 'gemini'];

// In production the key is encrypted to your account; in local dev it lives in
// this browser only. The copy reflects whichever mode is active.
const stored = supabaseEnabled && !import.meta.env.DEV;

export default function ApiKeyPanel({ onChange }: ApiKeyPanelProps) {
  const [status, setStatus] = useState<KeyStatus>({ configured: false });
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const [provider, setProvider] = useState<Provider>('anthropic');
  const [model, setModel] = useState(PROVIDER_MODELS['anthropic'][0].id);
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    const s = await loadKeyStatus();
    setStatus(s);
    if (s.provider) setProvider(s.provider);
    if (s.model) setModel(s.model);
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pickProvider = (p: Provider) => {
    setProvider(p);
    setModel(PROVIDER_MODELS[p][0].id); // default to cheapest
  };

  const save = async () => {
    if (!keyLooksValid(provider, key)) {
      setError(
        `That doesn’t look like a ${PROVIDER_LABEL[provider]} key (${KEY_HINT[provider]}).`
      );
      return;
    }
    setBusy(true);
    setError(null);
    const res = await saveKey(provider, key.trim(), model);
    setBusy(false);
    if (!res.ok) {
      setError(res.error || 'Could not save your key.');
      return;
    }
    setKey('');
    setOpen(false);
    if (res.status) setStatus(res.status);
    onChange?.();
  };

  const remove = async () => {
    setBusy(true);
    await clearKey();
    setBusy(false);
    setStatus({ configured: false });
    onChange?.();
  };

  const active = status.configured;

  return (
    <section className="max-w-[760px] mx-auto px-5 md:px-8 pb-16">
      <div className="border-2 border-[#dee2de] rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[15px] font-medium text-[#2c2c2c] flex items-center gap-2">
              <Key size={16} />
              {active ? 'Using your own key' : 'Free tier'}
            </h3>
            <p className="text-[13px] text-[#646464] mt-1 leading-relaxed max-w-[540px]">
              {active ? (
                stored ? (
                  <>
                    Unlimited use on your own key — encrypted and saved to your
                    account, synced across devices. We never show or send it back
                    to the browser.
                  </>
                ) : (
                  <>Unlimited use on your own key — stored only in this browser (dev).</>
                )
              ) : (
                <>
                  The free tier is a quick taste (cheapest model, strict limit,
                  paste-text only). For unlimited use, add your own key from
                  Anthropic, OpenAI, or Google Gemini — Gemini has a free tier, so
                  it can cost you nothing.{' '}
                  {stored
                    ? 'Your key is encrypted and tied to your account — never kept in the browser.'
                    : 'Your key stays in this browser only (dev mode).'}
                </>
              )}
            </p>
          </div>
          {active && (
            <span className="inline-flex items-center gap-1.5 text-[12px] text-green-700 bg-green-50 border border-green-200 rounded-full px-2.5 py-1 shrink-0">
              <Check size={13} /> Active
            </span>
          )}
        </div>

        {active ? (
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className="text-[13px] text-[#2c2c2c]">
              {PROVIDER_LABEL[status.provider ?? 'anthropic']} · {status.model}
              {status.hint && (
                <span className="text-[#b4b8b4]"> · {status.hint}</span>
              )}
            </span>
            <button
              onClick={() => {
                setKey('');
                setOpen(true);
              }}
              className="text-[13px] text-[#646464] hover:text-[#2c2c2c] transition-colors"
            >
              Change
            </button>
            <button
              onClick={remove}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-[13px] text-red-600 hover:text-red-700 transition-colors disabled:opacity-60"
            >
              <Trash2 size={14} /> Remove
            </button>
          </div>
        ) : open ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p}
                  onClick={() => pickProvider(p)}
                  className={`px-3 py-1.5 text-[13px] rounded-full border-2 transition-colors ${
                    provider === p
                      ? 'bg-black text-white border-black'
                      : 'bg-white border-[#dde3dd] hover:bg-[#eef1ed]'
                  }`}
                >
                  {PROVIDER_LABEL[p]}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[12px] text-[#646464] mb-1">
                Model (cheaper = saves money)
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="w-full px-3 py-2.5 text-[14px] bg-white border-2 border-[#dde3dd] rounded-xl outline-none focus:border-[#b8beb8]"
              >
                {PROVIDER_MODELS[provider].map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <input
              type="password"
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder={KEY_HINT[provider]}
              autoComplete="off"
              className="w-full px-4 py-2.5 text-[14px] bg-white border-2 border-[#dde3dd] rounded-xl outline-none focus:border-[#b8beb8] transition-colors"
            />
            {error && <p className="text-[13px] text-red-600">{error}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={save}
                disabled={busy}
                className="inline-flex items-center gap-2 px-4 py-2 text-[14px] bg-black text-white rounded-full hover:bg-[#2c2c2c] transition-colors disabled:opacity-60"
              >
                {busy && <Loader2 size={14} className="animate-spin" />}
                Save key
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setError(null);
                }}
                className="px-4 py-2 text-[14px] text-[#646464] hover:text-[#2c2c2c] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="mt-4 px-4 py-2 text-[14px] bg-white border-2 border-[#dde3dd] rounded-full hover:bg-[#eef1ed] transition-colors"
          >
            Add your API key
          </button>
        )}
      </div>
    </section>
  );
}
