import { LogOut, ShieldCheck } from 'lucide-react';
import ApiKeyPanel from './ApiKeyPanel';
import { useLocale } from '../lib/i18n';

interface SettingsProps {
  onKeyChange: () => void;
  onSignOut: () => void;
}

export default function Settings({ onKeyChange, onSignOut }: SettingsProps) {
  const { preference, setPreference, t } = useLocale();
  return (
    <div className="mx-auto max-w-[760px] px-5 pb-16 pt-10 md:px-8">
      <div className="mb-6">
        <h1 className="font-mondwest text-[32px] leading-none md:text-[42px]">
          {t.settingsTitle}
        </h1>
        <p className="mt-2 max-w-[560px] text-[14px] leading-relaxed text-[#646464]">
          {t.settingsIntro}
        </p>
      </div>

      <div className="space-y-6">
        <ApiKeyPanel onChange={onKeyChange} />

        <section className="rounded-2xl border-2 border-[#dee2de] p-5">
          <h3 className="text-[15px] font-medium text-[#2c2c2c]">
            {t.language}
          </h3>
          <p className="mt-1 max-w-[520px] text-[13px] leading-relaxed text-[#646464]">
            {t.languageIntro}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {[
              ['auto', t.auto],
              ['en', t.english],
              ['es', t.spanish],
            ].map(([value, label]) => (
              <button
                key={value}
                onClick={() => setPreference(value as 'auto' | 'en' | 'es')}
                className={`rounded-full border-2 px-4 py-2 text-[14px] transition-colors ${
                  preference === value
                    ? 'border-black bg-black text-white'
                    : 'border-[#dde3dd] bg-white hover:bg-[#eef1ed]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border-2 border-[#dee2de] p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-[15px] font-medium text-[#2c2c2c]">
                <ShieldCheck size={16} />
                {t.account}
              </h3>
              <p className="mt-1 max-w-[520px] text-[13px] leading-relaxed text-[#646464]">
                {t.signOutHint}
              </p>
            </div>
            <button
              onClick={onSignOut}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-black px-5 py-2.5 text-[14px] text-white transition-colors hover:bg-[#2c2c2c]"
            >
              <LogOut size={15} /> {t.signOut}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
