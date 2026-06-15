import { LogOut, ShieldCheck } from 'lucide-react';
import ApiKeyPanel from './ApiKeyPanel';
import UserAvatar from './UserAvatar';
import StudioCreditsPanel from './StudioCreditsPanel';
import CheckoutButton from './CheckoutButton';
import type { PlanTier } from '../lib/tiers';
import { PLAN_LABELS } from '../lib/tiers';
import { useLocale } from '../lib/i18n';

interface SettingsProps {
  onKeyChange: () => void;
  onSignOut: () => void;
  displayName?: string;
  email?: string;
  avatarUrl?: string | null;
  planTier?: PlanTier;
  byokAllowed?: boolean;
  studioEnabled?: boolean;
}

export default function Settings({
  onKeyChange,
  onSignOut,
  displayName,
  email,
  avatarUrl,
  planTier,
  byokAllowed = true,
  studioEnabled = false,
}: SettingsProps) {
  const { preference, setPreference, t } = useLocale();
  return (
    <div className="mx-auto max-w-[760px] px-5 pb-16 pt-10 md:px-8">
      <div className="mb-6">
        <h1 className="font-mondwest text-[32px] leading-none text-ink md:text-[42px]">
          {t.settingsTitle}
        </h1>
        <p className="mt-2 max-w-[560px] text-[14px] leading-relaxed text-ink-secondary">
          {t.settingsIntro}
        </p>
      </div>

      <div className="space-y-6">
        {displayName && (
          <section className="rounded-2xl border-2 border-line p-5">
            <div className="flex items-center gap-3">
              <UserAvatar name={displayName} src={avatarUrl} size="lg" />
              <div>
                <p className="text-[15px] font-medium text-ink">{displayName}</p>
                {email && <p className="text-[13px] text-ink-muted">{email}</p>}
              </div>
            </div>
          </section>
        )}

        {planTier && (
          <section className="rounded-2xl border-2 border-line p-5">
            <p className="text-[13px] text-ink-muted">{t.currentPlan(PLAN_LABELS[planTier])}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {planTier === 'free' && (
                <CheckoutButton product="student" label={t.checkoutStudent} isLoggedIn />
              )}
              {planTier !== 'studio' && (
                <CheckoutButton
                  product="studio"
                  label={t.checkoutStudio}
                  isLoggedIn
                  className={planTier === 'free' ? '' : 'sm:col-span-2'}
                />
              )}
            </div>
            {!studioEnabled && (
              <p className="mt-3 text-[13px] text-ink-secondary">{t.upgradeToStudio}</p>
            )}
          </section>
        )}

        <ApiKeyPanel onChange={onKeyChange} byokAllowed={byokAllowed} />

        {studioEnabled && <StudioCreditsPanel />}

        {studioEnabled && (
          <section className="rounded-2xl border-2 border-accent/30 bg-surface-muted p-5">
            <h3 className="text-[15px] font-medium text-ink">{PLAN_LABELS.studio}</h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ink-secondary">
              {t.studioComingSoon}
            </p>
          </section>
        )}

        <section className="rounded-2xl border-2 border-line p-5">
          <h3 className="text-[15px] font-medium text-ink">{t.language}</h3>
          <p className="mt-1 max-w-[520px] text-[13px] leading-relaxed text-ink-secondary">
            {t.languageIntro}
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                ['auto', t.auto],
                ['en', t.english],
                ['es', t.spanish],
              ] as const
            ).map(([value, label]) => (
              <button
                key={value}
                onClick={() => setPreference(value)}
                className={`rounded-full border-2 px-4 py-2 text-[14px] transition-colors ${
                  preference === value
                    ? 'border-accent bg-accent text-accent-ink'
                    : 'border-line bg-surface-card hover:bg-surface-muted'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        <section className="rounded-2xl border-2 border-line p-5">
          <h3 className="text-[15px] font-medium text-ink">{t.legalLinks}</h3>
          <div className="mt-3 flex flex-wrap gap-4 text-[14px] text-ink-secondary">
            <a href="/#privacy" className="underline hover:text-ink">
              {t.privacyPolicy}
            </a>
            <a href="/#terms" className="underline hover:text-ink">
              {t.termsOfUse}
            </a>
          </div>
        </section>

        <section className="rounded-2xl border-2 border-line p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h3 className="flex items-center gap-2 text-[15px] font-medium text-ink">
                <ShieldCheck size={16} />
                {t.account}
              </h3>
              <p className="mt-1 max-w-[520px] text-[13px] leading-relaxed text-ink-secondary">
                {t.signOutHint}
              </p>
            </div>
            <button
              onClick={onSignOut}
              className="inline-flex shrink-0 items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-[14px] text-accent-ink transition-colors hover:opacity-90"
            >
              <LogOut size={15} /> {t.signOut}
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
