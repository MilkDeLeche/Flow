import { useEffect, useRef, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        el: HTMLElement,
        opts: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          theme?: 'light' | 'dark' | 'auto';
        }
      ) => string;
      reset: (widgetId?: string) => void;
      remove: (widgetId: string) => void;
    };
  }
}

interface Props {
  onToken: (token: string | null) => void;
  className?: string;
}

const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined;

/** Cloudflare Turnstile — only renders when VITE_TURNSTILE_SITE_KEY is set. */
export default function TurnstileWidget({ onToken, className = '' }: Props) {
  const hostRef = useRef<HTMLDivElement>(null);
  const widgetId = useRef<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!SITE_KEY) {
      onToken(null);
      return;
    }

    let cancelled = false;
    const mount = () => {
      if (cancelled || !hostRef.current || !window.turnstile || widgetId.current) return;
      widgetId.current = window.turnstile.render(hostRef.current, {
        sitekey: SITE_KEY,
        theme: 'auto',
        callback: (token) => onToken(token),
        'expired-callback': () => onToken(null),
        'error-callback': () => onToken(null),
      });
    };

    if (window.turnstile) {
      setReady(true);
      mount();
      return () => {
        cancelled = true;
        if (widgetId.current && window.turnstile) {
          window.turnstile.remove(widgetId.current);
          widgetId.current = null;
        }
      };
    }

    const existing = document.querySelector('script[data-turnstile]');
    if (existing) {
      existing.addEventListener('load', mount);
      return () => existing.removeEventListener('load', mount);
    }

    const script = document.createElement('script');
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
    script.async = true;
    script.defer = true;
    script.dataset.turnstile = 'true';
    script.onload = () => {
      if (!cancelled) {
        setReady(true);
        mount();
      }
    };
    document.head.appendChild(script);

    return () => {
      cancelled = true;
      if (widgetId.current && window.turnstile) {
        window.turnstile.remove(widgetId.current);
        widgetId.current = null;
      }
    };
  }, [onToken]);

  if (!SITE_KEY) return null;

  return (
    <div className={className}>
      <div ref={hostRef} className={`max-w-full ${ready ? '' : 'min-h-[65px]'}`} />
    </div>
  );
}

export function turnstileEnabled(): boolean {
  return Boolean(SITE_KEY);
}
