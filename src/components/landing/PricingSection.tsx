import { useLocale } from '../../lib/i18n';
import { FOCUS_PACK_USD } from '../../lib/creditsConfig';
import CheckoutButton from '../CheckoutButton';
import { savePendingCheckout, type CheckoutProduct } from '../../lib/stripeCheckout';
import type { PlanTier } from '../../lib/tiers';

interface PricingSectionProps {
  isLoggedIn?: boolean;
  planTier?: PlanTier;
  onNeedLogin?: (product: CheckoutProduct) => void;
}

export default function PricingSection({
  isLoggedIn = false,
  planTier = 'free',
  onNeedLogin,
}: PricingSectionProps) {
  const { t } = useLocale();

  const handleNeedLogin = (product: CheckoutProduct) => {
    savePendingCheckout(product);
    onNeedLogin?.(product);
  };

  return (
    <section id="pricing" className="scroll-mt-24 border-t border-line px-5 py-16 lg:px-10">
      <div className="mx-auto max-w-[1100px]">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.1em] text-ink-muted">
          {t.pricingEyebrow}
        </p>
        <h2 className="mb-4 max-w-[640px] font-mondwest text-[32px] leading-tight text-ink md:text-[44px]">
          {t.pricingTitle}
        </h2>
        <p className="mb-10 max-w-[620px] text-[16px] leading-relaxed text-ink-secondary">
          {t.pricingIntro}
        </p>

        <div className="grid gap-4 lg:grid-cols-3">
          <article className="rounded-2xl border border-line bg-surface-card p-6">
            <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.08em] text-ink-muted">
              {t.freeTier}
            </p>
            <p className="mb-3 font-mondwest text-[40px] leading-none text-ink">$0</p>
            <p className="mb-5 text-[14px] leading-relaxed text-ink-secondary">{t.freeTierDetail}</p>
            <ul className="space-y-2 text-[14px] text-ink-secondary">
              {t.freeTierBullets.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-ink">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </article>

          <article className="rounded-2xl border border-line bg-surface-card p-6">
            <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.08em] text-ink-muted">
              {t.studentTier}
            </p>
            <p className="mb-1 font-mondwest text-[40px] leading-none text-ink">$5</p>
            <p className="mb-5 text-[13px] text-ink-muted">{t.studentTierSub}</p>
            <p className="mb-5 text-[14px] leading-relaxed text-ink-secondary">{t.studentTierDetail}</p>
            <ul className="mb-6 space-y-2 text-[14px] text-ink-secondary">
              {t.studentTierBullets.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-ink">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <CheckoutButton
              product="student"
              label={planTier === 'free' ? t.checkoutStudent : t.planActiveStudent}
              isLoggedIn={isLoggedIn}
              onNeedLogin={handleNeedLogin}
              disabled={planTier !== 'free'}
              className={planTier !== 'free' ? 'border-line bg-surface-muted text-ink' : ''}
            />
          </article>

          <article className="rounded-2xl border-2 border-accent bg-surface-card p-6">
            <p className="mb-2 text-[12px] font-medium uppercase tracking-[0.08em] text-ink-muted">
              {t.studioTier}
            </p>
            <p className="mb-1 font-mondwest text-[40px] leading-none text-ink">$20</p>
            <p className="mb-5 text-[13px] text-ink-muted">{t.studioTierSub}</p>
            <p className="mb-5 text-[14px] leading-relaxed text-ink-secondary">{t.studioTierDetail}</p>
            <ul className="mb-6 space-y-2 text-[14px] text-ink-secondary">
              {t.studioTierBullets.map((item) => (
                <li key={item} className="flex gap-2">
                  <span className="text-ink">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
            <CheckoutButton
              product="studio"
              label={planTier === 'studio' ? t.planActiveStudio : t.checkoutStudio}
              isLoggedIn={isLoggedIn}
              onNeedLogin={handleNeedLogin}
              disabled={planTier === 'studio'}
              className={planTier === 'studio' ? 'border-line bg-surface-muted text-ink' : ''}
            />
            <p className="mt-5 rounded-xl bg-surface-muted px-4 py-3 text-[12px] leading-relaxed text-ink-muted">
              {t.studioTierNote}
            </p>
          </article>
        </div>

        <article
          id="focus-pack"
          className="mt-6 rounded-2xl border border-dashed border-line bg-surface-muted/60 p-6 md:flex md:items-center md:justify-between md:gap-8"
        >
          <div className="max-w-[540px]">
            <p className="mb-1 text-[12px] font-medium uppercase tracking-[0.08em] text-ink-muted">
              {t.focusPackTitle}
            </p>
            <p className="mb-2 text-[15px] text-ink-secondary">{t.focusPackDetail}</p>
            <ul className="space-y-1 text-[13px] text-ink-secondary">
              {t.focusPackBullets.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="mt-4 w-full shrink-0 md:mt-0 md:max-w-[220px]">
            <p className="mb-3 text-right font-mondwest text-[36px] leading-none text-ink md:text-left">
              ${FOCUS_PACK_USD}
            </p>
            <CheckoutButton
              product="focus_pack"
              label={t.checkoutFocusPack}
              isLoggedIn={isLoggedIn}
              onNeedLogin={handleNeedLogin}
              disabled={planTier !== 'studio'}
            />
            {planTier !== 'studio' && (
              <p className="mt-2 text-[11px] text-ink-muted">{t.focusPackRequiresStudio}</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
