import { useRef, type RefObject } from 'react';
import BackgroundVideo from '../BackgroundVideo';
import { useLocale } from '../../lib/i18n';
import { FOCUS_PACK_USD } from '../../lib/creditsConfig';
import CheckoutButton from '../CheckoutButton';
import { savePendingCheckout, type CheckoutProduct } from '../../lib/stripeCheckout';
import type { PlanTier } from '../../lib/tiers';

const PRICING_VIDEO =
  'https://stream.mux.com/Ffho601Cogzm02GpMzVct5MI8hRMJepDoTH48AixAHkwQ.m3u8';
const FREE_TIER_HOVER_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260405_073438_071156e5-2a7a-45d8-a8d9-c628d2144e88.mp4';
const STUDENT_TIER_HOVER_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260331_074327_a4d6275d-82d9-4c83-bfbe-f1fb2213c17c.mp4';
const STUDIO_TIER_HOVER_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260306_115329_5e00c9c5-4d69-49b7-94c3-9c31c60bb644.mp4';
const FOCUS_PACK_HOVER_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260502_134830_926d2233-a9a6-45e9-aaa2-28ef8beecb24.mp4';

const cardGlass =
  'rounded-2xl border border-white/15 bg-white/[0.08] p-6 backdrop-blur-md';
const cardGlassFeatured =
  'rounded-2xl border-2 border-white/30 bg-white/[0.1] p-6 backdrop-blur-md shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]';
const tierEyebrow =
  'mb-2 text-[12px] font-medium uppercase tracking-[0.08em] text-white/55';
const tierPrice = 'font-mondwest leading-none text-white';
const tierBody = 'text-[14px] leading-relaxed text-white/75';
const tierBullets = 'space-y-2 text-[14px] text-white/80';

function useHoverVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);

  const play = () => {
    const video = videoRef.current;
    if (!video || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    video.currentTime = 0;
    void video.play();
  };

  const pause = () => {
    const video = videoRef.current;
    if (!video) return;
    video.pause();
    video.currentTime = 0;
  };

  return { videoRef, play, pause };
}

function HoverVideoLayer({
  videoRef,
  src,
}: {
  videoRef: RefObject<HTMLVideoElement>;
  src: string;
}) {
  return (
    <>
      <video
        ref={videoRef}
        src={src}
        loop
        muted
        playsInline
        preload="metadata"
        className="absolute inset-0 h-full w-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        aria-hidden
      />
      <div className="absolute inset-0 bg-black/20 transition-colors duration-500 group-hover:bg-black/45" />
    </>
  );
}

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
  const freeTierVideo = useHoverVideo();
  const studentTierVideo = useHoverVideo();
  const studioTierVideo = useHoverVideo();
  const focusPackVideo = useHoverVideo();

  const handleNeedLogin = (product: CheckoutProduct) => {
    savePendingCheckout(product);
    onNeedLogin?.(product);
  };

  const checkoutActive =
    'border-white/25 bg-white text-gray-900 hover:bg-white/90';
  const checkoutDisabled = 'border-white/20 bg-white/10 text-white/60';

  return (
    <section
      id="pricing"
      className="relative scroll-mt-24 overflow-hidden border-t border-line px-5 py-16 lg:px-10"
    >
      <BackgroundVideo
        src={PRICING_VIDEO}
        className="absolute inset-0 h-full w-full object-cover"
      />
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/75 via-black/55 to-black/80"
        aria-hidden
      />

      <div className="relative z-10 mx-auto max-w-[1100px]">
        <p className="mb-3 text-[12px] font-medium uppercase tracking-[0.1em] text-white/55">
          {t.pricingEyebrow}
        </p>
        <h2 className="mb-4 max-w-[640px] font-mondwest text-[32px] leading-tight text-white md:text-[44px]">
          {t.pricingTitle}
        </h2>
        <p className="mb-10 max-w-[620px] text-[16px] leading-relaxed text-white/70">
          {t.pricingIntro}
        </p>

        <div className="grid gap-4 lg:grid-cols-3">
          <article
            className={`group relative overflow-hidden ${cardGlass}`}
            onMouseEnter={freeTierVideo.play}
            onMouseLeave={freeTierVideo.pause}
          >
            <HoverVideoLayer videoRef={freeTierVideo.videoRef} src={FREE_TIER_HOVER_VIDEO} />
            <div className="relative z-10">
              <p className={tierEyebrow}>{t.freeTier}</p>
              <p className={`mb-3 text-[40px] ${tierPrice}`}>$0</p>
              <p className={`mb-5 ${tierBody}`}>{t.freeTierDetail}</p>
              <ul className={tierBullets}>
                {t.freeTierBullets.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-white/90">•</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>

          <article
            className={`group relative overflow-hidden ${cardGlass}`}
            onMouseEnter={studentTierVideo.play}
            onMouseLeave={studentTierVideo.pause}
          >
            <HoverVideoLayer
              videoRef={studentTierVideo.videoRef}
              src={STUDENT_TIER_HOVER_VIDEO}
            />
            <div className="relative z-10">
              <p className={tierEyebrow}>{t.studentTier}</p>
              <p className={`mb-1 text-[40px] ${tierPrice}`}>$5</p>
              <p className="mb-5 text-[13px] text-white/50">{t.studentTierSub}</p>
              <p className={`mb-5 ${tierBody}`}>{t.studentTierDetail}</p>
              <ul className={`mb-6 ${tierBullets}`}>
                {t.studentTierBullets.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-white/90">•</span>
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
                className={planTier !== 'free' ? checkoutDisabled : checkoutActive}
              />
            </div>
          </article>

          <article
            className={`group relative overflow-hidden ${cardGlassFeatured}`}
            onMouseEnter={studioTierVideo.play}
            onMouseLeave={studioTierVideo.pause}
          >
            <HoverVideoLayer
              videoRef={studioTierVideo.videoRef}
              src={STUDIO_TIER_HOVER_VIDEO}
            />
            <div className="relative z-10">
              <p className={tierEyebrow}>{t.studioTier}</p>
              <p className={`mb-1 text-[40px] ${tierPrice}`}>$20</p>
              <p className="mb-5 text-[13px] text-white/50">{t.studioTierSub}</p>
              <p className={`mb-5 ${tierBody}`}>{t.studioTierDetail}</p>
              <ul className={`mb-6 ${tierBullets}`}>
                {t.studioTierBullets.map((item) => (
                  <li key={item} className="flex gap-2">
                    <span className="text-white/90">•</span>
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
                className={planTier === 'studio' ? checkoutDisabled : checkoutActive}
              />
              <p className="mt-5 rounded-xl border border-white/10 bg-black/25 px-4 py-3 text-[12px] leading-relaxed text-white/55">
                {t.studioTierNote}
              </p>
            </div>
          </article>
        </div>

        <article
          id="focus-pack"
          className="group relative mt-6 overflow-hidden rounded-2xl border border-dashed border-white/25 bg-white/[0.06] p-6 backdrop-blur-md md:flex md:items-center md:justify-between md:gap-8"
          onMouseEnter={focusPackVideo.play}
          onMouseLeave={focusPackVideo.pause}
        >
          <HoverVideoLayer videoRef={focusPackVideo.videoRef} src={FOCUS_PACK_HOVER_VIDEO} />
          <div className="relative z-10 max-w-[540px]">
            <p className={tierEyebrow}>{t.focusPackTitle}</p>
            <p className={`mb-2 text-[15px] ${tierBody}`}>{t.focusPackDetail}</p>
            <ul className="space-y-1 text-[13px] text-white/75">
              {t.focusPackBullets.map((item) => (
                <li key={item}>• {item}</li>
              ))}
            </ul>
          </div>
          <div className="relative z-10 mt-4 w-full shrink-0 md:mt-0 md:max-w-[220px]">
            <p className={`mb-3 text-right text-[36px] md:text-left ${tierPrice}`}>
              ${FOCUS_PACK_USD}
            </p>
            <CheckoutButton
              product="focus_pack"
              label={t.checkoutFocusPack}
              isLoggedIn={isLoggedIn}
              onNeedLogin={handleNeedLogin}
              disabled={planTier !== 'studio'}
              className={planTier !== 'studio' ? checkoutDisabled : checkoutActive}
            />
            {planTier !== 'studio' && (
              <p className="mt-2 text-[11px] text-white/45">{t.focusPackRequiresStudio}</p>
            )}
          </div>
        </article>
      </div>
    </section>
  );
}
