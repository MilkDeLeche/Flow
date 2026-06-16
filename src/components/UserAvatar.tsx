import { useEffect, useState } from 'react';

interface Props {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'h-8 w-8 text-[11px]',
  md: 'h-9 w-9 text-[12px]',
  lg: 'h-11 w-11 text-[14px]',
};

export default function UserAvatar({ name, src, size = 'md', className = '' }: Props) {
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    setImageFailed(false);
  }, [src]);

  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');

  const showImage = Boolean(src) && !imageFailed;

  if (showImage) {
    return (
      <img
        src={src!}
        alt=""
        referrerPolicy="no-referrer"
        loading="lazy"
        decoding="async"
        onError={() => setImageFailed(true)}
        className={`shrink-0 rounded-full object-cover ${sizes[size]} ${className}`}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-[var(--accent)] font-medium text-[var(--accent-ink)] ${sizes[size]} ${className}`}
    >
      {initials || '?'}
    </span>
  );
}
