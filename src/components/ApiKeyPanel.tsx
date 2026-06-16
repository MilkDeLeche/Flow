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
import { useLocale } from '../lib/i18n';

interface ApiKeyPanelProps {
  onChange?: () => void;
  byokAllowed?: boolean;
}

const PROVIDERS: Provider[] = ['anthropic', 'openai', 'gemini'];

// In production the key is encrypted to your account; in local dev it lives in
// this browser only. The copy reflects whichever mode is active.
const stored = supabaseEnabled && !import.meta.env.DEV;

export default function ApiKeyPanel({ onChange, byokAllowed = true }: ApiKeyPanelProps) {
  const { t } = useLocale();
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
    <section>
      <div className="border-2 border-line rounded-2xl p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-[15px] font-medium text-ink flex items-center gap-2">
              <Key size={16} />
              {active ? t.apiActive : t.freeTier}
            </h3>
            <p className="text-[13px] text-ink-secondary mt-1 leading-relaxed max-w-[540px]">
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
              <Check size={13} /> {t.active}
            </span>
          )}
        </div>

        {active ? (
          <div className="flex flex-wrap items-center gap-3 mt-4">
            <span className="text-[13px] text-ink">
              {PROVIDER_LABEL[status.provider ?? 'anthropic']} · {status.model}
              {status.hint && (
                <span className="text-ink-muted"> · {status.hint}</span>
              )}
            </span>
            <button
              onClick={() => {
                setKey('');
                setOpen(true);
              }}
              className="text-[13px] text-ink-secondary hover:text-ink transition-colors"
            >
              {t.change}
            </button>
            <button
              onClick={remove}
              disabled={busy}
              className="inline-flex items-center gap-1.5 text-[13px] text-red-600 hover:text-red-700 transition-colors disabled:opacity-60"
            >
              <Trash2 size={14} /> {t.remove}
            </button>
          </div>
        ) : !byokAllowed ? (
          <div className="mt-4 rounded-xl border border-line bg-surface-muted px-4 py-3">
            <p className="text-[13px] leading-relaxed text-ink-secondary">{t.upgradeToStudent}</p>
            <a
              href="/#pricing"
              className="mt-2 inline-block text-[13px] font-medium text-ink underline"
            >
              {t.pricing} →
            </a>
          </div>
        ) : open ? (
          <div className="mt-4 space-y-3">
            <div className="flex flex-wrap gap-2">
              {PROVIDERS.map((p) => (
                <button
                  key={p}
                  onClick={() => pickProvider(p)}
                  className={`px-3 py-1.5 text-[13px] transition-colors ${
                    provider === p ? 'btn-pill-active' : 'btn-pill'
                  }`}
                >
                  {PROVIDER_LABEL[p]}
                </button>
              ))}
            </div>

            <div>
              <label className="block text-[12px] text-ink-secondary mb-1">
                {t.modelCheap}
              </label>
              <select
                value={model}
                onChange={(e) => setModel(e.target.value)}
                className="input-field px-3 py-2.5 text-[14px]"
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
              className="input-field px-4 py-2.5 text-[14px]"
            />
            {error && <p className="text-[13px] text-red-600">{error}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={save}
                disabled={busy}
                className="btn-primary gap-2 px-4 py-2 text-[14px] disabled:opacity-60"
              >
                {busy && <Loader2 size={14} className="animate-spin" />}
                {t.saveKey}
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setError(null);
                }}
                className="px-4 py-2 text-[14px] text-ink-secondary hover:text-ink transition-colors"
              >
                {t.cancel}
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="btn-outline mt-4 px-4 py-2 text-[14px]"
          >
            {t.addKey}
          </button>
        )}
      </div>
    </section>
  );
}
