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
import { getMangaDetail } from '../api/manga';
import { useMangaFavorites } from '../hooks/useMangaFavorites';
import { useReadChapters } from '../hooks/useReadChapters';
import { sortChaptersByOrden } from '../utils/manga';
import type { MangaDetail as MangaDetailType } from '../types/manga';

const STATUS_TRANSLATIONS: Record<string, string> = {
  Ongoing: 'En emisión',
  Completed: 'Finalizado',
};

const translateStatus = (status: string): string =>
  STATUS_TRANSLATIONS[status] ?? status;

interface ReadingCTAProps {
  chapters: { publicId: string; numeroCapitulo: string; orden: number }[];
  readChapters: string[];
  mangaId: string;
}

function ReadingCTA({ chapters, readChapters, mangaId }: ReadingCTAProps) {
  if (chapters.length === 0) {
    return null;
  }

  // Find read chapters by their orden value (reading order)
  const readOrdens = chapters
    .filter(ch => readChapters.includes(ch.publicId))
    .map(ch => ch.orden);

  if (readOrdens.length === 0) {
    // Nothing read — start from chapter 1 (lowest orden)
    const firstChapter = [...chapters].sort((a, b) => a.orden - b.orden)[0];
    return (
      <Link to={`/manga/${mangaId}/chapter/${firstChapter.publicId}`} className={styles.readingCta}>
        Empezar a leer
      </Link>
    );
  }

  // Find the highest orden read (last in reading order)
  const lastReadOrden = Math.max(...readOrdens);

  // Find the next chapter in reading order (orden + 1)
  const nextChapter = chapters.find(ch => ch.orden === lastReadOrden + 1);

  if (!nextChapter) {
    // All chapters read — restart from chapter 1
    const firstChapter = [...chapters].sort((a, b) => a.orden - b.orden)[0];
    return (
      <Link to={`/manga/${mangaId}/chapter/${firstChapter.publicId}`} className={styles.readingCta}>
        Empezar a leer
      </Link>
    );
  }

  // There are read chapters and a next chapter exists — always "Continuar leyendo"
  return (
    <Link to={`/manga/${mangaId}/chapter/${nextChapter.publicId}`} className={styles.readingCta}>
      Continuar leyendo
    </Link>
  );
}

export const MangaDetail = function MangaDetail() {
  const { id } = useParams<{ id: string }>();
  const mangaId = id || null;
  const [data, setData] = useState<MangaDetailType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isMangaFavorite, toggleMangaFavorite } = useMangaFavorites();
  const { readChapters } = useReadChapters(mangaId ?? '');
  const [posterError, setPosterError] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [chapterOrder, setChapterOrder] = useState<'asc' | 'desc'>('asc');

  const sortedChapters = chapterOrder === 'asc'
    ? sortChaptersByOrden(data?.chapters || [])
    : sortChaptersByOrden(data?.chapters || []).reverse();

  useEffect(() => {
    if (!mangaId) return;
    setLoading(true);
    setError(null);
    getMangaDetail(mangaId)
      .then(setData)
      .catch((err) => setError(err instanceof Error ? err.message : 'Error al cargar el manga'))
      .finally(() => setLoading(false));
  }, [mangaId]);

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

  const favorite = data ? isMangaFavorite(data.publicId) : false;

  const handleFavoriteClick = () => {
    if (data) {
      toggleMangaFavorite({
        publicId: data.publicId,
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
                src={manga.coverUrl}
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

            <div className={styles.ctaRow}>
              <Button
                variant={favorite ? 'primary' : 'ghost'}
                onClick={handleFavoriteClick}
                className={styles.ctaButton}
              >
                {favorite ? '♥ Favorito' : '♡ Agregar a favoritos'}
              </Button>

              {sortedChapters.length > 0 && (
                <ReadingCTA
                  chapters={sortedChapters}
                  readChapters={readChapters}
                  mangaId={manga.publicId}
                />
              )}
            </div>

            {manga.description && (
              <div className={styles.description}>
                <h2 className={styles.sectionTitle}>Sinopsis</h2>
                <p>{manga.description}</p>
              </div>
            )}
          </div>
        </div>

        <div className={styles.chaptersSection}>
          <div className={styles.chaptersHeader}>
            <h2 className={styles.sectionTitle}>
              Capítulos ({sortedChapters.length})
            </h2>
            <button
              className={styles.orderToggle}
              onClick={() => setChapterOrder(prev => prev === 'asc' ? 'desc' : 'asc')}
              aria-label={chapterOrder === 'asc' ? 'Ordenar descendente' : 'Ordenar ascendente'}
            >
              {chapterOrder === 'asc' ? (
                <>
                  <span>↑</span>
                  <span>Primeros</span>
                </>
              ) : (
                <>
                  <span>↓</span>
                  <span>Últimos</span>
                </>
              )}
            </button>
          </div>
          <ChapterList chapters={sortedChapters} mangaId={manga.publicId} readChapters={readChapters} />
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
