import { useEffect, useRef } from 'react';
import Hls, { HlsConfig } from 'hls.js';
import styles from './VideoPlayer.module.css';
import { cn } from '../../utils/cn';
import { isHlsStream } from '../../utils/stream';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  onPlay?: () => void;
  onPause?: () => void;
  onEnded?: () => void;
  className?: string;
  autoPlay?: boolean;
}

export function VideoPlayer({
  src,
  poster,
  onPlay,
  onPause,
  onEnded,
  className,
  autoPlay = false,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  const shouldAutoplay =
    autoPlay &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Initialize HLS or native playback
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (isHlsStream(src)) {
      if (Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true } as Partial<HlsConfig>);
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (shouldAutoplay) video.play().catch(() => {});
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) console.error('HLS fatal error:', data);
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
        if (shouldAutoplay) video.play().catch(() => {});
      }
    } else {
      video.src = src;
      if (shouldAutoplay) video.play().catch(() => {});
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, shouldAutoplay]);

  return (
    <div
      className={cn(styles.playerContainer, className)}
      data-tv-focus="true"
      data-tv-focus-id="video-player"
      data-player-fullscreen="true"
    >
      <video
        ref={videoRef}
        className={styles.video}
        poster={poster}
        playsInline
        controls
        autoPlay={shouldAutoplay}
        onPlay={onPlay}
        onPause={onPause}
        onEnded={onEnded}
      />
    </div>
  );
}

// Export individual control functions for external use
export function createVideoPlayerControls(ref: React.RefObject<HTMLVideoElement | null>) {
  return {
    play: () => ref.current?.play(),
    pause: () => ref.current?.pause(),
    togglePlay: () => {
      const video = ref.current;
      if (!video) return;
      if (video.paused) video.play();
      else video.pause();
    },
    setVolume: (vol: number) => {
      if (ref.current) ref.current.volume = Math.max(0, Math.min(1, vol));
    },
    toggleFullscreen: () => {
      const video = ref.current;
      if (!video) return;
      if (document.fullscreenElement) document.exitFullscreen();
      else video.requestFullscreen();
    },
  };
}
