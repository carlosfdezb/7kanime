import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './Episode.module.css';
import { Container, Breadcrumb, Skeleton, Focusable } from '../components';
import { useFetch } from '../hooks';
import { useWatchedEpisodes, useTVNavigation } from '../hooks';
import type { EpisodeDetail, MediaLink, AnimeDetail } from '../types/api';

type Variant = 'DUB' | 'SUB';

const SERVER_PRIORITY = ['HLS', 'UPNShare', 'Mega', 'MP4Upload'];
const WATCHED_TIMER_MS = 15 * 60 * 1000; // 15 minutes

function sortServers(links: MediaLink[]): MediaLink[] {
  return [...(links || [])].sort((a, b) => {
    const aIndex = SERVER_PRIORITY.indexOf(a.server);
    const bIndex = SERVER_PRIORITY.indexOf(b.server);
    if (aIndex === -1 && bIndex === -1) return 0;
    if (aIndex === -1) return 1;
    if (bIndex === -1) return -1;
    return aIndex - bIndex;
  });
}

export function Episode() {
  const { slug, number } = useParams<{ slug: string; number: string }>();
  const episodeNumber = parseInt(number || '1', 10);

  const { data: episodeData, loading: episodeLoading, error: episodeError } = useFetch<EpisodeDetail>(
    slug && number ? `/episode/${slug}/${episodeNumber}` : null
  );

  const { data: animeData } = useFetch<AnimeDetail>(
    slug ? `/anime/${slug}` : null
  );

  const { isWatched, markWatched, toggleWatched } = useWatchedEpisodes();
  const [variant, setVariant] = useState<Variant>('SUB');
  const [currentEmbed, setCurrentEmbed] = useState<MediaLink | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Ref for the scrollable content area
  const contentRef = useRef<HTMLDivElement>(null);

  // Setup TV navigation for variant buttons and episode nav
  useTVNavigation({
    containerRef: contentRef,
  });

  const animeTitle = animeData?.title || slug || 'Anime';
  const hasDub = episodeData?.variants.DUB === 1;
  const hasSub = episodeData?.variants.SUB === 1;
  const sortedEmbeds = episodeData ? sortServers(variant === 'DUB' ? episodeData.embeds.DUB : episodeData.embeds.SUB) : [];
  const watched = slug ? isWatched(slug, episodeNumber) : false;

  // Timer logic: mark as watched after 15 min of being visible
  const startTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (slug && !isWatched(slug, episodeNumber)) {
      timerRef.current = setTimeout(() => {
        markWatched(slug, episodeNumber, animeTitle, animeData?.poster, animeData?.episodesCount);
      }, WATCHED_TIMER_MS);
    }
  }, [slug, episodeNumber, isWatched, markWatched]);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Handle visibility change
  useEffect(() => {
    const handleVisibilityChange = () => {
      const visible = document.visibilityState === 'visible';
      setIsVisible(visible);
      if (visible) {
        startTimer();
      } else {
        stopTimer();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      stopTimer();
    };
  }, [startTimer, stopTimer]);

  // Start timer when component mounts and episode is loaded
  useEffect(() => {
    if (slug && episodeData && isVisible) {
      startTimer();
    }
    return () => stopTimer();
  }, [slug, episodeData, isVisible, startTimer, stopTimer]);

  useEffect(() => {
    if (episodeData) {
      const embeds = variant === 'DUB' ? episodeData.embeds.DUB : episodeData.embeds.SUB;
      const sorted = sortServers(embeds);
      setCurrentEmbed(sorted[0] || null);
    }
  }, [episodeData, variant]);

  // Auto-switch to DUB if SUB is not available
  useEffect(() => {
    if (episodeData && !hasSub && hasDub) {
      setVariant('DUB');
    }
  }, [episodeData, hasSub, hasDub]);

  if (episodeLoading) {
    return (
      <div className={styles.page}>
        <Container>
          <div className={styles.loading}>
            <Skeleton variant="rectangular" width="100%" height="500px" />
            <Skeleton variant="text" width="200px" height={32} />
          </div>
        </Container>
      </div>
    );
  }

  if (episodeError || !episodeData) {
    return (
      <div className={styles.page}>
        <Container>
          <div className={styles.errorState}>
            <p>{episodeError || 'Episodio no encontrado'}</p>
            <Link to="/">
              <button className={styles.backHomeBtn}>Volver al inicio</button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const episode = episodeData!;

  // Previous / Next episode navigation
  const episodesList = animeData?.episodes || [];
  const currentEpIndex = episodesList.findIndex(ep => ep.number === episodeNumber);
  const prevEpisode = currentEpIndex > 0 ? episodesList[currentEpIndex - 1] : null;
  const nextEpisode = currentEpIndex < episodesList.length - 1 ? episodesList[currentEpIndex + 1] : null;

  const handlePlay = () => {
    setIsPlaying(true);
  };

  return (
    <div className={styles.page}>
      <Container ref={contentRef}>
        <Breadcrumb
          items={[
            { label: 'Anime', href: '/' },
            { label: animeTitle, href: `/anime/${slug}` },
            { label: `Episodio ${episode.number}` },
          ]}
        />

        {/* Player */}
        <div className={styles.playerSection}>
          <div
            className={styles.playerWrapper}
            data-tv-focus="true"
            data-tv-focus-id="video-player"
            data-player-fullscreen="true"
          >
            {isPlaying && currentEmbed ? (
              currentEmbed.url.includes('.m3u8') ? (
                <video
                  src={currentEmbed.url}
                  className={styles.player}
                  autoPlay
                  controls
                />
              ) : (
                <iframe
                  src={currentEmbed.url}
                  className={styles.player}
                  title="Video player"
                  sandbox="allow-scripts allow-same-origin allow-presentation"
                  allowFullScreen
                  loading="lazy"
                />
              )
            ) : (
              <div className={styles.playerPlaceholder}>
                <button className={styles.playerPlayBtn} onClick={handlePlay} aria-label="Reproducir">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor">
                    <polygon points="5,3 19,12 5,21" />
                  </svg>
                </button>
                <p className={styles.playerPlaceholderText}>Haz clic para reproducir</p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className={`${styles.controlsBar} animate-fade-in`}>
          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Variante</span>
            {hasSub && (
              <button
                className={`${styles.variantChip} ${variant === 'SUB' ? styles.active : ''}`}
                onClick={() => setVariant('SUB')}
                data-tv-focus="true"
                data-tv-focus-id="variant-sub"
              >
                Subtitulado
              </button>
            )}
            {hasDub && (
              <button
                className={`${styles.variantChip} ${variant === 'DUB' ? styles.active : ''}`}
                onClick={() => setVariant('DUB')}
                data-tv-focus="true"
                data-tv-focus-id="variant-dub"
              >
                Doblado
              </button>
            )}
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.controlLabel}>Servidor</span>
            {sortedEmbeds.map((embed, index) => (
              <button
                key={`${embed.server}-${index}`}
                className={`${styles.serverChip} ${currentEmbed?.url === embed.url ? styles.active : ''}`}
                onClick={() => setCurrentEmbed(embed)}
                data-tv-focus="true"
                data-tv-focus-id={`server-${embed.server}`}
              >
                {embed.server}
              </button>
            ))}
          </div>

          <Focusable
            as="button"
            id="watched-btn"
            className={`${styles.watchedBtn} ${watched ? styles.watched : ''}`}
            onClick={() => slug && toggleWatched(slug, episodeNumber, animeTitle, animeData?.poster, animeData?.episodesCount)}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="20,6 9,17 4,12" />
            </svg>
            {watched ? 'Visto' : 'Marcar como visto'}
          </Focusable>
        </div>

        {/* Episode Info */}
        <section className={`${styles.episodeInfo} animate-fade-in`}>
          <h1 className={styles.episodeTitle}>
            {animeTitle} — Episodio {episode.number}
          </h1>

          <div className={styles.episodeMeta}>
            <span className={styles.episodeMetaItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              Episodio {episode.number}
            </span>
            <span className={styles.episodeMetaItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12,6 12,12 16,14" />
              </svg>
              {animeData?.episodesCount || episodesList.length} eps
            </span>
            <span className={styles.episodeMetaItem}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="13,2 3,14 12,14 11,22 21,10 12,10" />
              </svg>
              {variant === 'DUB' ? 'Doblado' : 'Subtitulado'}
            </span>
          </div>

          {animeData?.synopsis && (
            <p className={styles.episodeSynopsis}>{animeData.synopsis}</p>
          )}
        </section>

        {/* Episode Navigation */}
        <nav className={`${styles.episodeNav} animate-fade-in`} aria-label="Navegación de episodios">
          {prevEpisode ? (
            <Focusable
              as={Link}
              id="prev-episode"
              to={`/episode/${slug}/${prevEpisode.number}`}
              className={`${styles.navButton} ${styles.navButtonPrev}`}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12,19 5,12 12,5" />
              </svg>
              <div className={styles.navButtonInfo}>
                <span className={styles.navButtonLabel}>Anterior</span>
                <span className={styles.navButtonTitle}>Episodio {prevEpisode.number}</span>
              </div>
            </Focusable>
          ) : (
            <span className={`${styles.navButton} ${styles.navButtonPrev} ${styles.disabled}`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12,19 5,12 12,5" />
              </svg>
              <div className={styles.navButtonInfo}>
                <span className={styles.navButtonLabel}>Anterior</span>
                <span className={styles.navButtonTitle}>—</span>
              </div>
            </span>
          )}

          <span className={styles.episodeCounter}>
            Episodio <span>{episode.number}</span> / {animeData?.episodesCount || episodesList.length}
          </span>

          {nextEpisode ? (
            <Focusable
              as={Link}
              id="next-episode"
              to={`/episode/${slug}/${nextEpisode.number}`}
              className={`${styles.navButton} ${styles.navButtonNext}`}
            >
              <div className={styles.navButtonInfo}>
                <span className={styles.navButtonLabel}>Siguiente</span>
                <span className={styles.navButtonTitle}>Episodio {nextEpisode.number}</span>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12,5 19,12 12,19" />
              </svg>
            </Focusable>
          ) : (
            <span className={`${styles.navButton} ${styles.navButtonNext} ${styles.disabled}`}>
              <div className={styles.navButtonInfo}>
                <span className={styles.navButtonLabel}>Siguiente</span>
                <span className={styles.navButtonTitle}>—</span>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12,5 19,12 12,19" />
              </svg>
            </span>
          )}
        </nav>
      </Container>
    </div>
  );
}
