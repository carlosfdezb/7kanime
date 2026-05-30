import { useParams, Link } from 'react-router-dom';
import { useRef } from 'react';
import styles from './AnimeDetail.module.css';
import { Container } from '../components/layout/Container';
import { Header } from '../components/layout/Header';
import { Breadcrumb } from '../components/layout/Breadcrumb';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useFetch } from '../hooks/useFetch';
import { useAnimeFavorites } from '../hooks/useAnimeFavorites';
import { useWatchedEpisodes } from '../hooks/useWatchedEpisodes';
import { useTVNavigation } from '../hooks/useTVNavigation';
import { DetailHero } from '../components/ui/DetailHero';
import { InfoGrid } from '../components/ui/InfoGrid';
import { EpisodeRow } from '../components/ui/EpisodeRow';
import type { AnimeDetail } from '../types/api';

export function AnimeDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data, loading, error } = useFetch<AnimeDetail>(
    slug ? `/anime/${slug}` : null
  );
  const { isFavorite, toggleFavorite, isAuthenticated } = useAnimeFavorites();
  const { isWatched } = useWatchedEpisodes();

  const contentRef = useRef<HTMLDivElement>(null);
  useTVNavigation({ containerRef: contentRef });

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

  const handleShare = async () => {
    if (!data) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: data.title,
          text: `Mira ${data.title} en 7Kanime`,
          url,
        });
      } catch {
        // ignore
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
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

  const infoItems = [
    { label: 'Estado', value: anime.statusText },
    { label: 'Tipo', value: anime.type },
    { label: 'Episodios', value: String(anime.episodesCount) },
    ...(anime.score > 0
      ? [{ label: 'Puntuación', value: `★ ${anime.score.toFixed(1)} / 10` }]
      : []),
  ];

  return (
    <div className={styles.page}>
      <Header />
      <DetailHero
        breadcrumb={
          <Breadcrumb
            items={[
              { label: 'Anime', href: '/' },
              { label: anime.title },
            ]}
          />
        }
        posterSrc={anime.poster}
        posterAlt={anime.title}
        backdropSrc={anime.backdrop}
        title={anime.title}
        aka={anime.aka?.['ja-jp'] || anime.aka?.['en-us']}
        status={anime.statusText}
        type={anime.type}
        countLabel={`${anime.episodesCount} eps`}
        score={anime.score}
        genres={anime.genres.map((g) => g.name)}
      >
        <Link to={`/episode/${slug}/1`} className={styles.primaryAction}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <polygon points="5,3 19,12 5,21" />
          </svg>
          Ver ahora
        </Link>

        {isAuthenticated && (
          <Button
            variant={favorite ? 'primary' : 'ghost'}
            onClick={handleFavoriteClick}
            aria-label={
              favorite ? 'Quitar de favoritos' : 'Agregar a favoritos'
            }
          >
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill={favorite ? 'currentColor' : 'none'}
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            {favorite ? 'En favoritos' : 'Agregar a favoritos'}
          </Button>
        )}

        <Button variant="secondary" onClick={handleShare}>
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="18" cy="5" r="3" />
            <circle cx="6" cy="12" r="3" />
            <circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
            <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
          Compartir
        </Button>
      </DetailHero>

      <Container ref={contentRef} className={styles.content}>
        <section className={styles.synopsisSection}>
          <h2 className={styles.sectionTitle}>Sinopsis</h2>
          <p className={styles.synopsisText}>{anime.synopsis}</p>
        </section>

        <InfoGrid items={infoItems} />

        <section className={styles.episodesSection}>
          <div className={styles.episodesHeader}>
            <h2 className={styles.sectionTitle}>Episodios</h2>
            <span className={styles.episodesCount}>
              {anime.episodesCount} episodios
            </span>
          </div>
          <div className={styles.episodesList}>
            {anime.episodes.map((ep) => (
              <EpisodeRow
                key={ep.id}
                number={ep.number}
                title={(ep as any).title}
                duration={(ep as any).duration}
                watched={slug ? isWatched(slug, ep.number) : false}
                to={`/episode/${slug}/${ep.number}`}
              />
            ))}
          </div>
        </section>

        {anime.relations && anime.relations.length > 0 && (
          <section className={styles.relationsSection}>
            <h2 className={styles.sectionTitle}>Relacionado</h2>
            <div className={styles.relationsGrid}>
              {anime.relations.map((relation) => (
                <Link
                  key={relation.id}
                  to={`/anime/${relation.destination.slug}`}
                  className={styles.relationCard}
                >
                  <div className={styles.relationPoster}>
                    <div className={styles.relationPosterPlaceholder} />
                  </div>
                  <div className={styles.relationInfo}>
                    <h4>{relation.destination.title}</h4>
                    <p className={styles.relationType}>{relation.type}</p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </Container>
    </div>
  );
}
