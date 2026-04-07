import { useParams, Link } from 'react-router-dom';
import { useState, useEffect, useCallback, useRef } from 'react';
import styles from './Episode.module.css';
import { Container } from '../components/layout/Container';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { Skeleton } from '../components/ui/Skeleton';
import { useFetch } from '../hooks/useFetch';
import { useWatchedStore } from '../store/watchedStore';
import type { EpisodeDetail, MediaLink, AnimeDetail } from '../types/api';

type Variant = 'DUB' | 'SUB';

const SERVER_PRIORITY = ['HLS', 'UPNShare', 'Mega', 'MP4Upload'];
const WATCHED_TIMER_MS = 15 * 60 * 1000; // 15 minutes

function sortServers(links: MediaLink[]): MediaLink[] {
  return [...links].sort((a, b) => {
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

  const { isWatched, markWatched, toggleWatched } = useWatchedStore();
  const [variant, setVariant] = useState<Variant>('SUB');
  const [currentEmbed, setCurrentEmbed] = useState<MediaLink | null>(null);
  const [isVisible, setIsVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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
        markWatched(slug, episodeNumber);
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
              <Button>Volver al inicio</Button>
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

  return (
    <div className={styles.page}>
      <Container>
        <Breadcrumb
          items={[
            { label: 'Inicio', href: '/' },
            { label: animeTitle, href: `/anime/${slug}` },
            { label: `Episodio ${episode.number}` },
          ]}
        />

        <div className={styles.header}>
          <h1 className={styles.title}>{animeTitle} — Episodio {episode.number}</h1>
          <Button
            variant={watched ? 'primary' : 'ghost'}
            onClick={() => slug && toggleWatched(slug, episodeNumber)}
            className={styles.watchedBtn}
          >
            {watched ? '✓ Visto' : 'Marcar como visto'}
          </Button>
        </div>

        {/* Player */}
        <div className={styles.playerWrapper}>
          {currentEmbed ? (
            <iframe
              src={currentEmbed.url}
              className={styles.player}
              title="Video player"
              sandbox="allow-scripts allow-same-origin allow-presentation"
              allowFullScreen
              loading="lazy"
            />
          ) : (
            <div className={styles.noPlayer}>
              <p>No hay jugador disponible para esta variante</p>
            </div>
          )}
        </div>

        {/* Controls: Variant + Server */}
        <div className={styles.controls}>
          {/* Variant Toggle */}
          <div className={styles.variantSelector}>
            <span className={styles.variantLabel}>Variante:</span>
            <div className={styles.variantButtons}>
              {hasSub && (
                <Chip
                  label="Subtitulado"
                  selected={variant === 'SUB'}
                  onClick={() => setVariant('SUB')}
                />
              )}
              {hasDub && (
                <Chip
                  label="Doblado"
                  selected={variant === 'DUB'}
                  onClick={() => setVariant('DUB')}
                />
              )}
            </div>
          </div>

          {/* Server Selector */}
          <div className={styles.serverSelector}>
            <span className={styles.serverLabel}>Servidor:</span>
            <div className={styles.serverButtons}>
              {sortedEmbeds.map((embed, index) => (
                <Chip
                  key={`${embed.server}-${index}`}
                  label={embed.server}
                  selected={currentEmbed?.url === embed.url}
                  onClick={() => setCurrentEmbed(embed)}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Previous / Next Navigation */}
        <div className={styles.episodeNav}>
          {prevEpisode ? (
            <Link to={`/episode/${slug}/${prevEpisode.number}`} className={styles.navButton}>
              ← Episodio {prevEpisode.number}
            </Link>
          ) : (
            <span className={styles.navButtonDisabled}>← Sin episodio anterior</span>
          )}
          <span className={styles.episodeCounter}>
            {episode.number} / {animeData?.episodesCount || episodesList.length}
          </span>
          {nextEpisode ? (
            <Link to={`/episode/${slug}/${nextEpisode.number}`} className={styles.navButton}>
              Episodio {nextEpisode.number} →
            </Link>
          ) : (
            <span className={styles.navButtonDisabled}>Sin siguiente episodio →</span>
          )}
        </div>
      </Container>
    </div>
  );
}
