import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import styles from './MangaDetail.module.css';
import { Container } from '../components/layout/Container';
import { MangaBreadcrumb } from '../components/layout/MangaBreadcrumb';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { Badge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { ChapterList } from '../components/ui/ChapterList';
import { useFetch } from '../hooks/useFetch';
import { useMangaFavorites } from '../hooks/useMangaFavorites';
import { useReadChapters } from '../hooks/useReadChapters';
import { getProxiedImageUrl } from '../api/manga';
import { buildUniqueChapterList } from '../utils/manga';
import type { MangaDetail as MangaDetailType } from '../types/manga';

const STATUS_TRANSLATIONS: Record<string, string> = {
  Ongoing: 'En emisión',
  Completed: 'Finalizado',
};

const translateStatus = (status: string): string =>
  STATUS_TRANSLATIONS[status] ?? status;

interface ReadingCTAProps {
  chapters: MangaDetail['chapters'];
  readChapters: string[];
  mangaId: number;
}

function ReadingCTA({ chapters, readChapters, mangaId }: ReadingCTAProps) {
  const uniqueChapters = buildUniqueChapterList(chapters);

  if (uniqueChapters.length === 0) {
    return null;
  }

  // Find which unique chapters have been read (match by hash)
  const readHashSet = new Set(readChapters);
  const readIndices: number[] = [];

  uniqueChapters.forEach((chapter, index) => {
    // Check if any version of this chapter has been read
    const isRead = chapter.versions.some(v => readHashSet.has(v.hash));
    if (isRead) {
      readIndices.push(index);
    }
  });

  let buttonText: string;
  let targetHash: string;

  if (readIndices.length === 0) {
    // No chapters read — show "Empezar a leer"
    buttonText = 'Empezar a leer';
    targetHash = uniqueChapters[0].hash;
  } else {
    // Find the last read chapter index
    const lastReadIndex = Math.max(...readIndices);
    const nextIndex = lastReadIndex + 1;

    if (nextIndex >= uniqueChapters.length) {
      // Last chapter was the last read — show "Empezar a leer" (restart)
      buttonText = 'Empezar a leer';
      targetHash = uniqueChapters[0].hash;
    } else {
      // There's a next chapter to continue — show "Continuar leyendo"
      buttonText = 'Continuar leyendo';
      targetHash = uniqueChapters[nextIndex].hash;
    }
  }

  return (
    <Link to={`/manga/${mangaId}/chapter/${targetHash}`} className={styles.readingCta}>
      {buttonText}
    </Link>
  );
}

export const MangaDetail = function MangaDetail() {
  const { id } = useParams<{ id: string }>();
  const mangaId = id ? parseInt(id, 10) : null;
  const { data, loading, error } = useFetch<MangaDetailType>(mangaId ? `/manga/${mangaId}` : null);
  const { isMangaFavorite, toggleMangaFavorite } = useMangaFavorites();
  const { readChapters } = useReadChapters(mangaId ?? 0);
  const [posterError, setPosterError] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const favorite = data ? isMangaFavorite(data.id) : false;

  const handleFavoriteClick = () => {
    if (data) {
      toggleMangaFavorite({
        id: data.id,
        title: data.title,
        coverUrl: data.coverUrl,
        type: data.type,
      });
    }
  };

  if (loading) {
    return (
      <div className={styles.page}>
        <Container>
          <div className={styles.loading}>
            <Skeleton variant="rectangular" width="200px" height="300px" />
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
            <p>{error || 'Manga no encontrado'}</p>
            <Link to="/manga">
              <Button>Volver a la biblioteca</Button>
            </Link>
          </div>
        </Container>
      </div>
    );
  }

  const manga = data;

  return (
    <div className={styles.page}>
      <Container className={styles.content}>
        <MangaBreadcrumb
          items={[
            { label: 'Manga', href: '/manga' },
            { label: manga.title },
          ]}
        />

        <div className={styles.hero}>
          <div className={styles.posterWrapper}>
            {!posterError && (
              <img
                src={getProxiedImageUrl(manga.coverUrl)}
                alt={manga.title}
                className={styles.poster}
                onError={() => setPosterError(true)}
              />
            )}
            {posterError && <div className={styles.posterPlaceholder} />}
          </div>

          <div className={styles.info}>
            <div className={styles.header}>
              <h1 className={styles.title}>{manga.title}</h1>
              <div className={styles.meta}>
                <Badge variant="neutral">{manga.type}</Badge>
                {manga.rating > 0 && (
                  <span className={styles.score}>
                    <span className={styles.scoreStar}>★</span>
                    {manga.rating.toFixed(1)}
                    <span className={styles.votes}>({manga.ratingCount.toLocaleString()} votos)</span>
                  </span>
                )}
              </div>
            </div>

            <div className={styles.metadataGrid}>
              {manga.author && (
                <div className={styles.metadataItem}>
                  <span className={styles.metadataLabel}>Autor</span>
                  <span className={styles.metadataValue}>{manga.author}</span>
                </div>
              )}
              {manga.artist && (
                <div className={styles.metadataItem}>
                  <span className={styles.metadataLabel}>Artista</span>
                  <span className={styles.metadataValue}>{manga.artist}</span>
                </div>
              )}
              <div className={styles.metadataItem}>
                <span className={styles.metadataLabel}>Estado</span>
                <span className={styles.metadataValue}>{translateStatus(manga.status)}</span>
              </div>
              {manga.demographics.length > 0 && (
                <div className={styles.metadataItem}>
                  <span className={styles.metadataLabel}>Demografía</span>
                  <span className={styles.metadataValue}>{manga.demographics.join(', ')}</span>
                </div>
              )}
            </div>

            {manga.genres.length > 0 && (
              <div className={styles.genres}>
                {manga.genres.map((genre) => (
                  <Chip key={genre} label={genre} />
                ))}
              </div>
            )}

            <div className={styles.actions}>
              <Button
                variant={favorite ? 'primary' : 'ghost'}
                onClick={handleFavoriteClick}
              >
                {favorite ? '♥ Favorito' : '♡ Agregar a favoritos'}
              </Button>
            </div>

            {manga.chapters.length > 0 && (
              <ReadingCTA
                chapters={manga.chapters}
                readChapters={readChapters}
                mangaId={manga.id}
              />
            )}

            {manga.description && (
              <div className={styles.description}>
                <h2 className={styles.sectionTitle}>Sinopsis</h2>
                <p>{manga.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.chaptersSection}>
          <h2 className={styles.sectionTitle}>
            Capítulos ({manga.chapters.length})
          </h2>
          <ChapterList chapters={manga.chapters} mangaId={manga.id} readChapters={readChapters} />
        </div>

        <button
          className={`${styles.backToTop} ${showBackToTop ? styles.visible : ''}`}
          onClick={scrollToTop}
          aria-label="Volver arriba"
        >
          ↑
        </button>
      </Container>
    </div>
  );
}
