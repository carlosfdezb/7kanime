import { useEffect, useRef } from 'react';
import Hls, { HlsConfig } from 'hls.js';
import styles from './VideoPlayer.module.css';

interface VideoPlayerProps {
  src: string;
  poster?: string;
  autoPlay?: boolean;
  className?: string;
}

/**
 * Thin video player that uses hls.js for HLS sources and the native
 * <video> element for everything else.
 *
 * Why hls.js for HLS:
 *   - Firefox doesn't ship an HLS decoder. Handing it an m3u8 URL
 *     fails with "No video with supported format and MIME type found".
 *   - zilla-networks HLS streams are also served through our backend
 *     proxy at /hls/playlist?url=..., which returns m3u8 text. Browsers
 *     can't play m3u8 text directly even when they have an HLS decoder.
 *
 * The native path is only used for direct media URLs (.mp4, .webm).
 */
export function VideoPlayer({ src, poster, autoPlay = false, className }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<Hls | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    // Cleanup previous hls.js instance
    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    const isHls =
      src.includes('.m3u8') || src.includes('/hls/playlist');

    if (isHls && Hls.isSupported()) {
      const config: Partial<HlsConfig> = { enableWorker: true };
      const hls = new Hls(config);
      hls.loadSource(src);
      hls.attachMedia(video);
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        if (autoPlay) video.play().catch(() => {});
      });
      hls.on(Hls.Events.ERROR, (_, data) => {
        if (data.fatal) console.error('HLS fatal error:', data);
      });
      hlsRef.current = hls;
      return () => {
        hls.destroy();
        hlsRef.current = null;
      };
    }

    // Native path: direct media files (mp4, webm) or Safari native HLS.
    video.src = src;
    if (autoPlay) video.play().catch(() => {});
    return () => {
      video.removeAttribute('src');
      video.load();
    };
  }, [src, autoPlay]);

  return (
    <video
      ref={videoRef}
      className={`${styles.video} ${className ?? ''}`}
      poster={poster}
      controls
      playsInline
    />
  );
}
