import { useParams, Link } from 'react-router-dom';
import { useState, useEffect } from 'react';
import styles from './MangaDetail.module.css';
import { Container } from '../components/layout/Container';
import { Header } from '../components/layout/Header';
import { MangaBreadcrumb } from '../components/layout/MangaBreadcrumb';
import { Button } from '../components/ui/Button';
import { Skeleton } from '../components/ui/Skeleton';
import { useMangaFavorites } from '../hooks/useMangaFavorites';
import { useReadChapters } from '../hooks/useReadChapters';
import { getMangaDetail, translateGenreDisplay } from '../api/manga';
import { sortChaptersByOrden } from '../utils/manga';
import { DetailHero } from '../components/ui/DetailHero';
import { InfoGrid } from '../components/ui/InfoGrid';
import { ChapterRow } from '../components/ui/ChapterRow';
import type { MangaDetail as MangaDetailType } from '../types/manga';

const STATUS_TRANSLATIONS: Record<string, string> = {
  Ongoing: 'En emisión',
  Completed: 'Finalizado',
};

const translateStatus = (status: string): string =>
  STATUS_TRANSLATIONS[status] ?? status;

export const MangaDetail = function MangaDetail() {
  const { id } = useParams<{ id: string }>();
  const mangaId = id || null;
  const [manga, setManga] = useState<MangaDetailType | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { isMangaFavorite, toggleMangaFavorite } = useMangaFavorites();
  const { readChapters } = useReadChapters(mangaId ?? '');
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [chapterOrder, setChapterOrder] = useState<'asc' | 'desc'>('asc');

  const sortedChapters =
    chapterOrder === 'asc'
      ? sortChaptersByOrden(manga?.chapters || [])
      : sortChaptersByOrden(manga?.chapters || []).reverse();

  useEffect(() => {
    if (!mangaId) return;

    let cancelled = false;
    setLoading(true);
    setError(null);

    getMangaDetail(mangaId)
      .then((data) => {
        if (!cancelled) {
          setManga(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(
            err instanceof Error ? err.message : 'Error al cargar el manga'
          );
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
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

  const favorite = manga ? isMangaFavorite(manga.publicId) : false;

  const handleFavoriteClick = () => {
    if (manga) {
      toggleMangaFavorite({
        publicId: manga.publicId,
        title: manga.title,
        coverUrl: manga.coverUrl,
        type: manga.type,
      });
    }
  };

  const handleShare = async () => {
    if (!manga) return;
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({
          title: manga.title,
          text: `Lee ${manga.title} en 7Kanime`,
          url,
        });
      } catch {
        // ignore
      }
    } else if (navigator.clipboard) {
      await navigator.clipboard.writeText(url);
    }
  };

  const getReadingLink = (): string | null => {
    if (!manga || sortedChapters.length === 0) return null;

    const readOrdens = sortedChapters
      .filter((ch) => readChapters.includes(ch.publicId))
      .map((ch) => ch.orden);

    if (readOrdens.length === 0) {
      const firstChapter = [...sortedChapters].sort(
        (a, b) => a.orden - b.orden
      )[0];
      return `/manga/${manga.publicId}/chapter/${firstChapter.publicId}`;
    }

    const lastReadOrden = Math.max(...readOrdens);
    const nextChapter = sortedChapters.find(
      (ch) => ch.orden === lastReadOrden + 1
    );

    if (!nextChapter) {
      const firstChapter = [...sortedChapters].sort(
        (a, b) => a.orden - b.orden
      )[0];
      return `/manga/${manga.publicId}/chapter/${firstChapter.publicId}`;
    }

    return `/manga/${manga.publicId}/chapter/${nextChapter.publicId}`;
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

  if (error || !manga) {
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

  const readingLink = getReadingLink();
  const progressPercent =
    sortedChapters.length > 0
      ? Math.round((readChapters.length / sortedChapters.length) * 100)
      : 0;

  const infoItems = [
    { label: 'Estado', value: translateStatus(manga.status) },
    { label: 'Tipo', value: manga.type },
    { label: 'Capítulos', value: String(sortedChapters.length) },
    ...(manga.author
      ? [{ label: 'Autor', value: manga.author }]
      : []),
    ...(manga.demographics?.length > 0
      ? [
          {
            label: 'Demografía',
            value: manga.demographics.join(', '),
          },
        ]
      : []),
    ...(manga.rating > 0
      ? [
          {
            label: 'Puntuación',
            value: `★ ${manga.rating.toFixed(1)} / 10`,
          },
        ]
      : []),
  ];

  return (
    <div className={styles.page}>
      <Header />
      <Container>
        <MangaBreadcrumb
          items={[
            { label: 'Manga', href: '/manga' },
            { label: manga.title },
          ]}
        />
      </Container>
      <DetailHero
        posterSrc={manga.coverUrl}
        posterAlt={manga.title}
        backdropSrc={manga.coverUrl}
        title={manga.title}
        status={translateStatus(manga.status)}
        type={manga.type}
        countLabel={`${sortedChapters.length} caps`}
        score={manga.rating}
        genres={(manga.genres || []).map(translateGenreDisplay)}
      >
        {readingLink && (
          <Link to={readingLink} className={styles.primaryAction}>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="currentColor"
            >
              <polygon points="5,3 19,12 5,21" />
            </svg>
            {readChapters.length > 0
              ? 'Continuar leyendo'
              : 'Empezar a leer'}
          </Link>
        )}

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

      <Container className={styles.content}>
        {manga.description && (
          <section className={styles.synopsisSection}>
            <h2 className={styles.sectionTitle}>Sinopsis</h2>
            <p className={styles.synopsisText}>{manga.description}</p>
          </section>
        )}

        <InfoGrid items={infoItems} />

        {sortedChapters.length > 0 && (
          <section className={styles.progressSection}>
            <div className={styles.progressLabel}>
              <span>Progreso</span>
              <span>
                {readChapters.length} de {sortedChapters.length} capítulos
                leídos
              </span>
            </div>
            <div className={styles.progressBar}>
              <div
                className={styles.progressFill}
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </section>
        )}

        <section className={styles.chaptersSection}>
          <div className={styles.chaptersHeader}>
            <h2 className={styles.sectionTitle}>Capítulos</h2>
            <div className={styles.chaptersHeaderRight}>
              <span className={styles.chaptersCount}>
                {sortedChapters.length} capítulos
              </span>
              <button
                className={styles.orderToggle}
                onClick={() =>
                  setChapterOrder((prev) =>
                    prev === 'asc' ? 'desc' : 'asc'
                  )
                }
                aria-label={
                  chapterOrder === 'asc'
                    ? 'Ordenar descendente'
                    : 'Ordenar ascendente'
                }
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
          </div>
          <div className={styles.chaptersList}>
            {sortedChapters.map((ch) => (
              <ChapterRow
                key={ch.publicId}
                number={ch.numeroCapitulo}
                title={ch.title}
                scanlator={(ch as any).scanlator}
                date={(ch as any).date}
                read={readChapters.includes(ch.publicId)}
                to={`/manga/${manga.publicId}/chapter/${ch.publicId}`}
              />
            ))}
          </div>
        </section>

        <button
          className={`${styles.backToTop} ${
            showBackToTop ? styles.visible : ''
          }`}
          onClick={scrollToTop}
          aria-label="Volver arriba"
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <polyline points="18,15 12,9 6,15" />
          </svg>
        </button>
      </Container>
    </div>
  );
};
