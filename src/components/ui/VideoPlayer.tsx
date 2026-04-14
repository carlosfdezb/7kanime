import { useEffect, useRef, useState, useCallback } from 'react';
import Hls, { HlsConfig } from 'hls.js';
import styles from './VideoPlayer.module.css';
import { cn } from '../../utils/cn';

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);

  // Initialize HLS
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Clean up previous HLS instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    // Check if source is HLS
    if (src.includes('.m3u8')) {
      if (Hls.isSupported()) {
        const config: Partial<HlsConfig> = {
          enableWorker: true,
        };
        const hls = new Hls(config);
        hls.loadSource(src);
        hls.attachMedia(video);
        hls.on(Hls.Events.MANIFEST_PARSED, () => {
          if (autoPlay) {
            video.play().catch(() => {});
          }
        });
        hls.on(Hls.Events.ERROR, (_, data) => {
          if (data.fatal) {
            console.error('HLS fatal error:', data);
          }
        });
        hlsRef.current = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        // Safari native HLS support
        video.src = src;
        if (autoPlay) {
          video.play().catch(() => {});
        }
      }
    } else {
      // Regular video source (MP4, WebM, etc.)
      video.src = src;
      if (autoPlay) {
        video.play().catch(() => {});
      }
    }

    return () => {
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [src, autoPlay]);

  // Video event handlers
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handlePlay = () => {
      setIsPlaying(true);
      onPlay?.();
    };

    const handlePause = () => {
      setIsPlaying(false);
      onPause?.();
    };

    const handleEnded = () => {
      setIsPlaying(false);
      onEnded?.();
    };

    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('ended', handleEnded);

    return () => {
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('ended', handleEnded);
    };
  }, [onPlay, onPause, onEnded]);

  // Fullscreen change listener
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  }, []);

  // Controls auto-hide
  useEffect(() => {
    if (!isPlaying) {
      setShowControls(true);
      return;
    }

    const timeout = setTimeout(() => {
      setShowControls(false);
    }, 3000);

    return () => clearTimeout(timeout);
  }, [isPlaying, showControls]);

  // Play/Pause toggle
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video.play().catch(() => {});
    } else {
      video.pause();
    }
  }, []);

  // Volume control
  const increaseVolume = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.min(1, video.volume + 0.1);
  }, []);

  const decreaseVolume = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = Math.max(0, video.volume - 0.1);
  }, []);

  // Fullscreen toggle
  const toggleFullscreen = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (document.fullscreenElement) {
      document.exitFullscreen();
    } else {
      video.requestFullscreen();
    }
  }, []);

  // Expose controls via data attributes for TV navigation
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    const video = videoRef.current;
    if (!video) return;

    switch (e.key) {
      case 'Enter':
      case ' ':
        e.preventDefault();
        togglePlay();
        break;
      case 'ArrowUp':
        e.preventDefault();
        increaseVolume();
        break;
      case 'ArrowDown':
        e.preventDefault();
        decreaseVolume();
        break;
      case '0':
      case 'f':
      case 'F':
        e.preventDefault();
        toggleFullscreen();
        break;
    }
  }, [togglePlay, increaseVolume, decreaseVolume, toggleFullscreen]);

  return (
    <div
      className={cn(styles.playerContainer, className)}
      data-tv-focus="true"
      data-tv-focus-id="video-player"
      data-player-fullscreen="true"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <video
        ref={videoRef}
        className={styles.video}
        poster={poster}
        playsInline
        controls={false}
        onClick={togglePlay}
      />

      {/* Clickable overlay for play/pause */}
      <div
        className={styles.clickOverlay}
        onClick={togglePlay}
        data-tv-focus="true"
        data-tv-focus-id="player-play-pause"
      />

      {/* Controls overlay */}
      <div
        className={cn(styles.controls, showControls && styles.controlsVisible)}
        data-tv-focus="true"
        data-tv-focus-id="player-controls"
      >
        {/* Play/Pause */}
        <button
          type="button"
          className={cn(styles.controlBtn, styles.playBtn)}
          onClick={togglePlay}
          onKeyDown={(e) => e.key === 'Enter' && togglePlay()}
          data-tv-focus="true"
          data-tv-focus-id="player-play"
          aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
        >
          {isPlaying ? '⏸' : '▶'}
        </button>

        {/* Volume Down */}
        <button
          type="button"
          className={styles.controlBtn}
          onClick={decreaseVolume}
          data-tv-focus="true"
          data-tv-focus-id="player-vol-down"
          aria-label="Bajar volumen"
        >
          🔈
        </button>

        {/* Volume Up */}
        <button
          type="button"
          className={styles.controlBtn}
          onClick={increaseVolume}
          data-tv-focus="true"
          data-tv-focus-id="player-vol-up"
          aria-label="Subir volumen"
        >
          🔊
        </button>

        {/* Fullscreen */}
        <button
          type="button"
          className={cn(styles.controlBtn, styles.fullscreenBtn)}
          onClick={toggleFullscreen}
          data-tv-focus="true"
          data-tv-focus-id="player-fullscreen"
          aria-label="Pantalla completa"
        >
          {isFullscreen ? '⛶' : '⛶'}
        </button>
      </div>
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
      if (document.fullscreenElement) {
        document.exitFullscreen();
      } else {
        video.requestFullscreen();
      }
    },
  };
}
