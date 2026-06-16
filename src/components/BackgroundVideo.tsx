import { useEffect, useRef } from 'react';
import Hls from 'hls.js';

interface Props {
  src: string;
  className?: string;
}

/** Looping muted background video — MP4 direct or HLS via hls.js / native Safari. */
export default function BackgroundVideo({ src, className = '' }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const isHls = src.includes('.m3u8');
    let hls: Hls | null = null;

    if (isHls) {
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else if (Hls.isSupported()) {
        hls = new Hls({ enableWorker: true });
        hls.loadSource(src);
        hls.attachMedia(video);
      }
    } else {
      video.src = src;
    }

    return () => {
      hls?.destroy();
    };
  }, [src]);

  return (
    <video
      ref={videoRef}
      autoPlay
      loop
      muted
      playsInline
      className={className}
      aria-hidden
    />
  );
}
