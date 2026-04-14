import { useCallback } from 'react';
import styles from './PlayerControls.module.css';
import { cn } from '../../utils/cn';

interface PlayerControlsProps {
  onPlay?: () => void;
  onPause?: () => void;
  onFullscreen?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onVolumeUp?: () => void;
  onVolumeDown?: () => void;
  isVisible?: boolean;
}

export function PlayerControls({
  onPlay,
  onPause,
  onFullscreen,
  onPrev,
  onNext,
  onVolumeUp,
  onVolumeDown,
  isVisible = true,
}: PlayerControlsProps) {
  // Simular click real en el video (como si hicieras click con el mouse)
  // El primer click suele hacer play en la mayoría de players
  const simulateVideoClick = useCallback(() => {
    const videoContainer = document.querySelector('[data-player-fullscreen="true"]');
    const iframe = videoContainer?.querySelector('iframe');
    
    if (iframe?.contentWindow) {
      const clickEvent = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancelable: true,
        clientX: window.innerWidth / 2,
        clientY: window.innerHeight / 2,
      });
      iframe.contentWindow.dispatchEvent(clickEvent);
    }
  }, []);

  const handlePlay = () => {
    simulateVideoClick();
    onPlay?.();
  };

  const handlePause = () => {
    simulateVideoClick();
    onPause?.();
  };

  const handleFullscreen = () => {
    onFullscreen?.();
  };

  return (
    <div
      className={cn(styles.overlay, isVisible && styles.visible)}
      data-tv-focus="true"
      data-tv-focus-id="player-controls"
    >
      {/* Navigation controls */}
      <div className={styles.navControls}>
        <button
          type="button"
          className={styles.controlBtn}
          onClick={onPrev}
          data-tv-focus="true"
          data-tv-focus-id="player-prev"
          aria-label="Episodio anterior"
        >
          ◀◀
        </button>
        <button
          type="button"
          className={styles.controlBtn}
          onClick={onNext}
          data-tv-focus="true"
          data-tv-focus-id="player-next"
          aria-label="Siguiente episodio"
        >
          ▶▶
        </button>
      </div>

      {/* Playback controls */}
      <div className={styles.playbackControls}>
        <button
          type="button"
          className={cn(styles.controlBtn, styles.playBtn)}
          onClick={handlePlay}
          data-tv-focus="true"
          data-tv-focus-id="player-play"
          aria-label="Reproducir"
        >
          ▶
        </button>
        <button
          type="button"
          className={cn(styles.controlBtn, styles.playBtn)}
          onClick={handlePause}
          data-tv-focus="true"
          data-tv-focus-id="player-pause"
          aria-label="Pausar"
        >
          ⏸
        </button>
      </div>

      {/* Volume controls */}
      <div className={styles.volumeControls}>
        <button
          type="button"
          className={styles.controlBtn}
          onClick={onVolumeDown}
          data-tv-focus="true"
          data-tv-focus-id="player-vol-down"
          aria-label="Bajar volumen"
        >
          🔈
        </button>
        <button
          type="button"
          className={styles.controlBtn}
          onClick={onVolumeUp}
          data-tv-focus="true"
          data-tv-focus-id="player-vol-up"
          aria-label="Subir volumen"
        >
          🔊
        </button>
      </div>

      {/* Fullscreen */}
      <div className={styles.fullscreenControls}>
        <button
          type="button"
          className={cn(styles.controlBtn, styles.fullscreenBtn)}
          onClick={handleFullscreen}
          data-tv-focus="true"
          data-tv-focus-id="player-fullscreen"
          aria-label="Pantalla completa"
        >
          ⛶
        </button>
      </div>
    </div>
  );
}
