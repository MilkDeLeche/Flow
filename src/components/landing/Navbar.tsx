import { useLocale } from '../../lib/i18n';

interface Props {
  /** Enter the app (Log in / Sign up both lead into the quiz app). */
  onEnter: () => void;
}

/**
 * Fixed top bar. Offsets right of the 240px sidebar on desktop, full width on
 * mobile. Brand on the left, section links + auth buttons on the right.
 */
export default function Navbar({ onEnter }: Props) {
  const { t } = useLocale();
  return (
    <header className="fixed left-0 right-0 top-0 z-40 border-b border-line bg-surface/90 backdrop-blur-sm lg:left-[240px]">
      <div className="flex h-16 items-center justify-between px-5 lg:px-10">
        <a href="#home" className="font-mondwest text-[28px] leading-none text-ink lg:text-[32px]">
          Flow
        </a>
        <div className="flex items-center gap-2 lg:gap-4">
          <a
            href="#features"
            className="hidden text-[15px] text-ink-secondary transition-colors hover:text-ink lg:inline"
          >
            {t.features}
          </a>
          <a
            href="#pricing"
            className="hidden text-[15px] text-ink-secondary transition-colors hover:text-ink lg:inline"
          >
            {t.pricing}
          </a>
          <a
            href="#demo"
            className="hidden text-[15px] text-ink-secondary transition-colors hover:text-ink lg:inline"
          >
            {t.demo}
          </a>
          <button onClick={onEnter} className="btn-outline px-4 py-2 text-[14px]">
            {t.logIn}
          </button>
          <button onClick={onEnter} className="btn-primary px-4 py-2 text-[14px]">
            {t.startStudying}
          </button>
        </div>
      </div>
    </header>
  );
}
