import { useState } from 'react';
import { Check, Key, Trash2 } from 'lucide-react';
import {
  getByok,
  setByok,
  keyLooksValid,
  PROVIDER_LABEL,
  PROVIDER_MODELS,
  KEY_HINT,
  type Provider,
} from '../lib/byok';

interface ApiKeyPanelProps {
  onChange?: () => void;
}

const PROVIDERS: Provider[] = ['anthropic', 'openai', 'gemini'];

export default function ApiKeyPanel({ onChange }: ApiKeyPanelProps) {
  const existing = getByok();
  const [active, setActive] = useState(existing);
  const [open, setOpen] = useState(false);

  const [provider, setProvider] = useState<Provider>(
    existing?.provider ?? 'anthropic'
  );
  const [model, setModel] = useState(
    existing?.model ?? PROVIDER_MODELS['anthropic'][0].id
  );
  const [key, setKey] = useState('');
  const [error, setError] = useState<string | null>(null);

  const pickProvider = (p: Provider) => {
    setProvider(p);
    setModel(PROVIDER_MODELS[p][0].id); // default to cheapest
  };

  const save = () => {
    if (!keyLooksValid(provider, key)) {
      setError(`That doesn’t look like a ${PROVIDER_LABEL[provider]} key (${KEY_HINT[provider]}).`);
      return;
    }
    const v = { provider, key: key.trim(), model };
    setByok(v);
    setActive(v);
    setKey('');
    setError(null);
    setOpen(false);
    onChange?.();
  };

  const clear = () => {
    setByok(null);
    setActive(null);
    onChange?.();
  };

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
                <>
                  Unlimited use on your own key — stored only in this browser,
                  never on our servers.
                </>
              ) : (
                <>
                  The free tier is a quick taste (cheapest model, strict limit,
                  paste-text only). For unlimited use, add your own key from
                  Anthropic, OpenAI, or Google Gemini — Gemini has a free tier,
                  so it can cost you nothing. Your key stays in this browser only.
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
              {PROVIDER_LABEL[active.provider]} · {active.model}
            </span>
            <button
              onClick={() => {
                pickProvider(active.provider);
                setModel(active.model);
                setActive(null);
                setOpen(true);
              }}
              className="text-[13px] text-[#646464] hover:text-[#2c2c2c] transition-colors"
            >
              Change
            </button>
            <button
              onClick={clear}
              className="inline-flex items-center gap-1.5 text-[13px] text-red-600 hover:text-red-700 transition-colors"
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
              className="w-full px-4 py-2.5 text-[14px] bg-white border-2 border-[#dde3dd] rounded-xl outline-none focus:border-[#b8beb8] transition-colors"
            />
            {error && <p className="text-[13px] text-red-600">{error}</p>}
            <div className="flex items-center gap-2">
              <button
                onClick={save}
                className="px-4 py-2 text-[14px] bg-black text-white rounded-full hover:bg-[#2c2c2c] transition-colors"
              >
                Save key
              </button>
              <button
                onClick={() => {
                  setOpen(false);
                  setError(null);
                  if (existing) setActive(existing);
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
