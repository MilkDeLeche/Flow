import { ArrowLeft } from 'lucide-react';
import { useLocale } from '../../lib/i18n';

interface Props {
  onBack: () => void;
}

export default function PrivacyPolicy({ onBack }: Props) {
  const { t } = useLocale();

  return (
    <div className="mx-auto max-w-[760px] px-5 py-16 lg:px-10">
      <button
        onClick={onBack}
        className="mb-8 inline-flex items-center gap-1.5 text-[14px] text-ink-secondary hover:text-ink"
      >
        <ArrowLeft size={15} /> {t.back}
      </button>
      <h1 className="mb-4 font-mondwest text-[36px] leading-tight text-ink md:text-[44px]">
        {t.privacyPolicy}
      </h1>
      <p className="mb-8 text-[14px] text-ink-muted">{t.legalUpdated}</p>
      <div className="space-y-6 text-[15px] leading-relaxed text-ink-secondary">
        {t.privacySections.map((section) => (
          <section key={section.title}>
            <h2 className="mb-2 text-[17px] font-semibold text-ink">{section.title}</h2>
            {section.body.map((paragraph) => (
              <p key={paragraph.slice(0, 40)} className="mb-2">
                {paragraph}
              </p>
            ))}
          </section>
        ))}
      </div>
    </div>
  );
}
