import { forwardRef } from 'react';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
}

/**
 * Minimal <video> wrapper.
 *
 * Uses the browser's native controls. No custom overlay, no custom
 * keybindings, no custom fullscreen — the native element does all of
 * that correctly across browsers.
 */
export const VideoPlayer = forwardRef<HTMLVideoElement, VideoPlayerProps>(
  function VideoPlayer({ src, poster, autoPlay = false, className }, ref) {
    return (
      <video
        ref={ref}
        className={`${styles.video} ${className ?? ''}`}
        src={src}
        poster={poster}
        controls
        autoPlay={autoPlay}
        playsInline
      />
    );
  }
);
