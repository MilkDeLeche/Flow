import { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import Hero from './Hero';
import VideoSection from './VideoSection';
import FeaturesGrid from './FeaturesGrid';
import CardsCarousel from './CardsCarousel';
import { useAuth } from '../../lib/useAuth';
import { usePlanTier } from '../../lib/usePlanTier';
import PricingSection from './PricingSection';
import PrivacyPolicy from '../legal/PrivacyPolicy';
import TermsOfUse from '../legal/TermsOfUse';
import { useLocale } from '../../lib/i18n';

interface Props {
  /** Enter the quiz app (the landing's Log in / Sign up). */
  onEnter: () => void;
}

type LegalView = 'privacy' | 'terms' | null;

function legalFromHash(): LegalView {
  if (typeof window === 'undefined') return null;
  const hash = window.location.hash.replace('#', '');
  if (hash === 'privacy') return 'privacy';
  if (hash === 'terms') return 'terms';
  return null;
}

/**
 * Flow landing page — the public front door. The quiz app lives behind the
 * navbar's Log in / Sign up. This page is never replaced by the app; it stays.
 */
export default function Landing({ onEnter }: Props) {
  const { t } = useLocale();
  const { session } = useAuth();
  const planTier = usePlanTier(session);
  const [legal, setLegal] = useState<LegalView>(() => legalFromHash());

  useEffect(() => {
    const sync = () => setLegal(legalFromHash());
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const closeLegal = () => {
    window.history.replaceState(null, '', window.location.pathname);
    setLegal(null);
  };

  if (legal === 'privacy') {
    return (
      <div className="min-h-screen bg-surface text-ink lg:ml-[240px]">
        <PrivacyPolicy onBack={closeLegal} />
      </div>
    );
  }

  if (legal === 'terms') {
    return (
      <div className="min-h-screen bg-surface text-ink lg:ml-[240px]">
        <TermsOfUse onBack={closeLegal} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface text-ink">
      <Sidebar />
      <Navbar onEnter={onEnter} />
      <div className="lg:ml-[240px]">
        <Hero onEnter={onEnter} />
        <VideoSection />
        <FeaturesGrid />
        <CardsCarousel />
        <PricingSection
          isLoggedIn={!!session}
          planTier={planTier}
          onNeedLogin={() => onEnter()}
        />
        <footer className="border-t border-line px-5 py-10 lg:px-10">
          <p className="mb-4 text-[13px] text-ink-muted">{t.landingFooter}</p>
          <div className="flex flex-wrap gap-4 text-[13px] text-ink-secondary">
            <a href="#pricing" className="hover:text-ink">
              {t.pricing}
            </a>
            <a href="#privacy" className="hover:text-ink">
              {t.privacyPolicy}
            </a>
            <a href="#terms" className="hover:text-ink">
              {t.termsOfUse}
            </a>
          </div>
        </footer>
      </div>
    </div>
  );
}
