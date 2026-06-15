import { useEffect, useState } from 'react';
import { useLocale } from '../../lib/i18n';

const NAV = [
  { id: 'home', labelKey: 'navHome' as const },
  { id: 'demo', labelKey: 'demo' as const },
  { id: 'features', labelKey: 'features' as const },
  { id: 'cards', labelKey: 'navWho' as const },
  { id: 'pricing', labelKey: 'pricing' as const },
];

/**
 * Desktop-only left rail (240px). Tracks the section in view with an
 * IntersectionObserver and highlights the matching nav item.
 */
export default function Sidebar() {
  const { t } = useLocale();
  const [active, setActive] = useState('home');

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        for (const e of entries) if (e.isIntersecting) setActive(e.target.id);
      },
      { rootMargin: '-40% 0px -55% 0px', threshold: 0 }
    );
    NAV.forEach((n) => {
      const el = document.getElementById(n.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);

  const label = (key: (typeof NAV)[number]['labelKey']) => {
    if (key === 'navHome') return t.navHome;
    if (key === 'navWho') return t.navWho;
    return t[key];
  };

  return (
    <aside className="fixed left-0 top-0 z-30 hidden h-screen w-[240px] flex-col border-r-2 border-line bg-surface px-5 py-6 lg:flex">
      <a href="#home" className="mb-8 block">
        <span className="font-mondwest text-[24px] leading-none text-ink">Flow</span>
      </a>
      <nav className="flex flex-col gap-1">
        {NAV.map((n) => (
          <a
            key={n.id}
            href={`#${n.id}`}
            className={`rounded-lg px-3 py-2 text-[15px] transition-colors ${
              active === n.id
                ? 'bg-surface-muted text-ink'
                : 'text-ink-muted hover:bg-surface-muted/60 hover:text-ink-secondary'
            }`}
          >
            {label(n.labelKey)}
          </a>
        ))}
      </nav>

      <p className="mt-auto text-[12px] leading-relaxed text-ink-muted">{t.sidebarTagline}</p>
    </aside>
  );
}
