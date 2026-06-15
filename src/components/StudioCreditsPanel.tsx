import { useEffect, useState } from 'react';
import { Headphones, MessageCircle, Sparkles } from 'lucide-react';
import CheckoutButton from './CheckoutButton';
import { useLocale } from '../lib/i18n';
import { FOCUS_PACK_USD, loadStudioUsage, type StudioUsageView } from '../lib/studioUsage';

function Meter({
  label,
  used,
  total,
  remaining,
  unit,
}: {
  label: string;
  used: number;
  total: number;
  remaining: number;
  unit: string;
}) {
  const pct = total > 0 ? Math.min(100, Math.round((used / total) * 100)) : 0;
  const low = remaining <= Math.max(2, total * 0.15);

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-[12px]">
        <span className="text-ink-secondary">{label}</span>
        <span className={low ? 'font-medium text-amber-700 dark:text-amber-300' : 'text-ink-muted'}>
          {Math.round(remaining)} {unit} {remaining === 1 ? 'left' : 'left'}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-surface-muted">
        <div
          className={`h-full transition-all ${low ? 'bg-amber-500' : 'bg-accent'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="mt-1 text-[11px] text-ink-muted">
        {Math.round(used)} / {Math.round(total)} {unit} this month
      </p>
    </div>
  );
}

export default function StudioCreditsPanel() {
  const { t } = useLocale();
  const [usage, setUsage] = useState<StudioUsageView | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let on = true;
    loadStudioUsage().then((data) => {
      if (on) {
        setUsage(data);
        setLoading(false);
      }
    });
    return () => {
      on = false;
    };
  }, []);

  if (loading) {
    return (
      <section className="rounded-2xl border-2 border-line p-5">
        <p className="text-[13px] text-ink-muted">{t.loadingCredits}</p>
      </section>
    );
  }

  if (!usage) {
    return (
      <section className="rounded-2xl border-2 border-line p-5">
        <p className="text-[13px] text-ink-secondary">{t.creditsUnavailable}</p>
      </section>
    );
  }

  const voiceEmpty = usage.voiceMinutesRemaining <= 0;
  const tutorEmpty = usage.tutorMessagesRemaining <= 0;

  return (
    <section className="rounded-2xl border-2 border-accent/40 bg-surface-muted/50 p-5">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-surface-card">
          <Sparkles size={18} />
        </span>
        <div>
          <h3 className="text-[15px] font-medium text-ink">{t.studioCreditsTitle}</h3>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-secondary">
            {t.studioCreditsIntro}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <Meter
          label={t.readAloudCredits}
          used={usage.voiceMinutesUsed}
          total={usage.voiceMinutesTotal}
          remaining={usage.voiceMinutesRemaining}
          unit={t.minutesUnit}
        />
        <Meter
          label={t.tutorCredits}
          used={usage.tutorMessagesUsed}
          total={usage.tutorMessagesTotal}
          remaining={usage.tutorMessagesRemaining}
          unit={t.messagesUnit}
        />
      </div>

      {(voiceEmpty || tutorEmpty) && (
        <div className="mt-5 rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 dark:border-amber-700/50 dark:bg-amber-950/30">
          <p className="text-[13px] font-medium text-amber-900 dark:text-amber-100">
            {t.creditsLowTitle}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-amber-800 dark:text-amber-200">
            {t.creditsLowBody}
          </p>
        </div>
      )}

      <div className="mt-5 rounded-xl border border-line bg-surface-card p-4">
        <div className="mb-2 flex items-center gap-2">
          <Headphones size={15} className="text-ink-secondary" />
          <p className="text-[14px] font-medium text-ink">{t.focusPackTitle}</p>
          <span className="ml-auto font-mondwest text-[22px] leading-none">${FOCUS_PACK_USD}</span>
        </div>
        <p className="mb-3 text-[12px] leading-relaxed text-ink-secondary">{t.focusPackDetail}</p>
        <ul className="mb-3 space-y-1 text-[12px] text-ink-secondary">
          {t.focusPackBullets.map((line) => (
            <li key={line} className="flex gap-2">
              <MessageCircle size={12} className="mt-0.5 shrink-0" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <CheckoutButton product="focus_pack" label={t.checkoutFocusPack} isLoggedIn />
      </div>

      {usage.focusPacksPurchased > 0 && (
        <p className="mt-3 text-[11px] text-ink-muted">
          {t.focusPacksBought(usage.focusPacksPurchased)}
        </p>
      )}
    </section>
  );
}
