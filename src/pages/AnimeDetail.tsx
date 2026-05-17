import { useParams, Link } from 'react-router-dom';
import { useState, useRef } from 'react';
import styles from './AnimeDetail.module.css';
import { Container } from '../components/layout/Container';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { Focusable } from '../components/ui/Focusable';
import { useFetch } from '../hooks/useFetch';
import { useAnimeFavorites } from '../hooks/useAnimeFavorites';
import { useWatchedEpisodes } from '../hooks/useWatchedEpisodes';
import { useTVNavigation } from '../hooks/useTVNavigation';
import type { AnimeDetail } from '../types/api';

export function AnimeDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data, loading, error } = useFetch<AnimeDetail>(slug ? `/anime/${slug}` : null);
  const { isFavorite, toggleFavorite, isAuthenticated } = useAnimeFavorites();
  const { isWatched } = useWatchedEpisodes();
  const [posterError, setPosterError] = useState(false);
  const [backdropError, setBackdropError] = useState(false);

  // Ref for the scrollable content area
  const contentRef = useRef<HTMLDivElement>(null);

  // Setup TV navigation for episode buttons
  useTVNavigation({
    containerRef: contentRef,
  });

  const favorite = data ? isFavorite(data.id) : false;

  const handleFavoriteClick = () => {
    if (data) {
      toggleFavorite({
        id: data.id,
        title: data.title,
        slug: data.slug,
        poster: data.poster,
        type: data.category.name,
        typeSlug: data.category.slug,
        synopsis: data.synopsis,
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Container>
          <div className={styles.loading}>
            <Skeleton variant="rectangular" width="100%" height={400} />
            <div className={styles.loadingInfo}>
              <Skeleton variant="text" width="60%" height={32} />
              <Skeleton variant="text" width="40%" height={24} />
              <Skeleton variant="text" width="100%" height={100} />
            </div>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className={styles.page}>
        <Container>
          <div className={styles.errorState}>
            <p>{error || 'Anime no encontrado'}</p>
            <Link to="/">
              <Button>Volver al inicio</Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const anime = data;
  const hasBackdrop = anime.backdrop && !backdropError;

  return (
    <div className={styles.page}>
      {/* Backdrop */}
      <div className={`${styles.backdropWrapper} ${!hasBackdrop ? styles.backdropHidden : ''}`}>
        {hasBackdrop && (
          <>
            <img
              src={anime.backdrop}
              alt=""
              className={styles.backdrop}
              aria-hidden="true"
              onError={() => setBackdropError(true)}
            />
            <div className={styles.backdropOverlay} />
          </>
        )}
      </div>

      <Container className={`${styles.content} ${!hasBackdrop ? styles.contentNoBackdrop : ''}`} ref={contentRef}>
        <Breadcrumb
          items={[
            { label: 'Inicio', href: '/' },
            { label: data.title },
          ]}
        />

        <div className={styles.hero}>
          <div className={styles.posterWrapper}>
            {!posterError && (
              <img
                src={anime.poster}
                alt={anime.title}
                className={styles.poster}
                onError={() => setPosterError(true)}
              />
            )}
            {posterError && <div className={styles.posterPlaceholder} />}
          </div>

          <div className={styles.info}>
            <div className={styles.header}>
              <h1 className={styles.title}>{anime.title}</h1>
              {(anime.aka?.['en-us'] || anime.aka?.['ja-jp']) && (
                <p className={styles.aka}>
                  {anime.aka?.['en-us'] || anime.aka?.['ja-jp']}
                </p>
              )}
            </div>

            <div className={styles.meta}>
              <Badge variant="status">{anime.statusText}</Badge>
              <Badge variant="type">{anime.type}</Badge>
              {anime.score > 0 && (
                <span className={styles.score}>
                  ★ {anime.score.toFixed(1)}
                  <span className={styles.votes}>({anime.votes.toLocaleString()} votos)</span>
                </span>
              )}
            </div>

            <div className={styles.genres}>
              {anime.genres.map(genre => (
                <Chip key={genre.id} label={genre.name} />
              ))}
            </div>

            <div className={styles.actions}>
              {isAuthenticated && (
                <Focusable
                  as={Button}
                  id="favorite-btn"
                  variant={favorite ? 'primary' : 'ghost'}
                  onClick={handleFavoriteClick}
                  aria-label={favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'}
                >
                  {favorite ? '♥ Favorito' : '♡ Agregar a favoritos'}
                </Focusable>
              )}
            </div>

            <div className={styles.synopsis}>
              <h2 className={styles.sectionTitle}>Sinopsis</h2>
              <p>{anime.synopsis}</p>
            </div>

            {anime.relations && anime.relations.length > 0 && (
              <div className={styles.relations}>
                <span className={styles.relationsLabel}>Relacionado:</span>
                {anime.relations.map((relation) => (
                  <Link key={relation.id} to={`/anime/${relation.destination.slug}`} className={styles.relationLink}>
                    {relation.destination.title}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className={styles.episodesSection}>
          <h2 className={styles.sectionTitle}>
            Episodios ({anime.episodesCount})
          </h2>
          <div className={styles.episodesGrid}>
            {anime.episodes.map(ep => (
              <Focusable
                key={ep.id}
                as={Link}
                id={`episode-${ep.number}`}
                to={`/episode/${slug}/${ep.number}`}
                className={`${styles.episodeButton} ${slug && isWatched(slug, ep.number) ? styles.episodeWatched : ''}`}
              >
                {ep.number}
              </Focusable>
            ))}
          </div>
        </div>
      </Container>
    </div>
  );
}
