import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import styles from './ChapterReader.module.css';
import { Container } from '../components/layout/Container';
import { MangaBreadcrumb } from '../components/layout/MangaBreadcrumb';
import { Button } from '../components/ui/Button';
import { useFetch } from '../hooks/useFetch';
import { useReadChapters } from '../hooks/useReadChapters';
import type { ChapterPages, MangaDetail } from '../types/manga';

export function ChapterReader() {
  const { serieId, capituloId } = useParams<{ serieId: string; capituloId: string }>();
  const mangaId = serieId || null;

  const { data: chapterData, loading: chapterLoading, error: chapterError } = useFetch<ChapterPages>(
    serieId && capituloId ? `/manga/chapter/${serieId}/${capituloId}` : null
  );
  const { data: mangaData, loading: mangaLoading } = useFetch<MangaDetail>(
    mangaId ? `/manga/${mangaId}` : null
  );

  const { markAsRead, removeFromRead, readChapters, isAuthenticated } = useReadChapters(mangaId ?? '');

  const isRead = capituloId ? readChapters.includes(capituloId) : false;

  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set());
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const fullscreenRef = useRef<HTMLDivElement>(null);
  const currentImageRef = useRef<HTMLImageElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const observerCreatedAt = useRef<number>(0);

  // Find current chapter info from manga detail
  const currentChapter = mangaData?.chapters.find(ch => ch.publicId === capituloId);
  const prevCapituloId = chapterData?.prevCapituloId ?? null;
  const nextCapituloId = chapterData?.nextCapituloId ?? null;
  const prevChapter = prevCapituloId ? mangaData?.chapters.find(ch => ch.publicId === prevCapituloId) : null;
  const nextChapter = nextCapituloId ? mangaData?.chapters.find(ch => ch.publicId === nextCapituloId) : null;

  // Callback ref to attach IntersectionObserver to the midpoint page wrapper
  const midpointRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
    if (!node || !mangaId || !capituloId) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          const now = Date.now();
          if (now - observerCreatedAt.current < 50) return;

          markAsRead(
            capituloId,
            currentChapter?.numeroCapitulo,
            mangaData?.title,
            mangaData?.coverUrl
          );
          observerRef.current?.disconnect();
          observerRef.current = null;
        }
      },
      { threshold: 0.1 }
    );
    observerCreatedAt.current = Date.now();
    observerRef.current.observe(node);
  }, [mangaId, capituloId, markAsRead, currentChapter, mangaData]);

  // Cleanup observer on unmount or capituloId change
  useEffect(() => {
    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [capituloId]);

  // Find the image closest to the top of the viewport
  const findMostVisibleImage = useCallback((): HTMLImageElement | null => {
    const images = fullscreenRef.current?.querySelectorAll('img');
    if (!images || images.length === 0) return null;

    let closestImage: HTMLImageElement | null = null;
    let closestDistance = Infinity;
    const viewportHeight = window.innerHeight;
    const viewportCenter = viewportHeight / 2;

    images.forEach(img => {
      const rect = img.getBoundingClientRect();
      const imgTop = rect.top;
      const imgCenter = imgTop + rect.height / 2;
      const distance = Math.abs(imgCenter - viewportCenter);
      if (imgTop < viewportHeight && rect.bottom > 0 && distance < closestDistance) {
        closestDistance = distance;
        closestImage = img;
      }
    });

    return closestImage;
  }, []);

  const toggleFullscreen = useCallback(() => {
    const element = fullscreenRef.current;
    if (!element) return;

    if (document.fullscreenElement) {
      const currentImage = findMostVisibleImage();
      if (currentImage) {
        currentImageRef.current = currentImage;
      }
      document.exitFullscreen();
    } else {
      const currentImage = findMostVisibleImage();
      if (currentImage) {
        currentImageRef.current = currentImage;
      }
      element.requestFullscreen();
    }
  }, [findMostVisibleImage]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const entering = !!document.fullscreenElement;
      setIsFullscreen(entering);

      if (entering) {
        setTimeout(() => {
          const targetImage = currentImageRef.current || findMostVisibleImage();
          if (targetImage) {
            targetImage.scrollIntoView({ block: 'start', behavior: 'instant' });
            currentImageRef.current = targetImage;
          }
        }, 100);
      } else {
        setTimeout(() => {
          const targetImage = currentImageRef.current || findMostVisibleImage();
          if (targetImage) {
            targetImage.scrollIntoView({ block: 'start', behavior: 'instant' });
          }
        }, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [findMostVisibleImage]);

  // Keyboard shortcut for fullscreen (F key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return;

      if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        toggleFullscreen();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleFullscreen]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleImageError = (pageNumber: number) => {
    setImageErrors(prev => new Set(prev).add(pageNumber));
  };

  const handleImageLoad = (pageNumber: number) => {
    setVisiblePages(prev => new Set(prev).add(pageNumber));
  };

  const handleToggleRead = () => {
    if (!capituloId || !mangaId) return;
    if (isRead) {
      removeFromRead(capituloId);
    } else {
      markAsRead(capituloId, currentChapter?.numeroCapitulo, mangaData?.title, mangaData?.coverUrl);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderNavigation = () => (
    <div className={styles.navigation}>
      {prevCapituloId ? (
        <Link
          to={`/manga/${serieId}/chapter/${prevCapituloId}`}
          className={styles.navLink}
        >
          <span className={styles.navArrow}>←</span>
          <span className={styles.navLabel}>
            {prevChapter ? (
              <>
                <span className={styles.navChapterNum}>Cap. {prevChapter.numeroCapitulo}</span>
                {prevChapter.title && <span className={styles.navChapterTitle}>{prevChapter.title}</span>}
              </>
            ) : (
              <span className={styles.navLabel}>Anterior</span>
            )}
          </span>
        </Link>
      ) : (
        <span className={`${styles.navLink} ${styles.disabled}`}>
          <span className={styles.navArrow}>←</span>
          <span className={styles.navLabel}>Anterior</span>
        </span>
      )}

      <span className={styles.pageIndicator}>
        {chapterData?.paginas.length ?? 0} página{chapterData?.paginas.length !== 1 ? 's' : ''}
      </span>

      {nextCapituloId ? (
        <Link
          to={`/manga/${serieId}/chapter/${nextCapituloId}`}
          className={styles.navLink}
        >
          <span className={styles.navLabel}>
            {nextChapter ? (
              <>
                <span className={styles.navChapterNum}>Cap. {nextChapter.numeroCapitulo}</span>
                {nextChapter.title && <span className={styles.navChapterTitle}>{nextChapter.title}</span>}
              </>
            ) : (
              <span className={styles.navLabel}>Siguiente</span>
            )}
          </span>
          <span className={styles.navArrow}>→</span>
        </Link>
      ) : (
        <span className={`${styles.navLink} ${styles.disabled}`}>
          <span className={styles.navLabel}>Siguiente</span>
          <span className={styles.navArrow}>→</span>
        </span>
      )}
    </div>
  );

  const loading = chapterLoading || mangaLoading;
  const error = chapterError;

  if (loading) {
    return (
      <div className={styles.page}>
        <Container className={styles.content}>
          <div className={styles.loading}>
            <div className={styles.loadingSpinner} />
            <p className={styles.loadingText}>Cargando capítulo...</p>
          </div>
        </Container>
      </div>
    );
  }

  if (error || !chapterData) {
    return (
      <div className={styles.page}>
        <Container className={styles.content}>
          <div className={styles.errorState}>
            <p>{error || 'No se encontraron páginas para este capítulo'}</p>
            {mangaId ? (
              <Link to={`/manga/${mangaId}`}>
                <Button>Volver al manga</Button>
              </Link>
            ) : (
              <Link to="/manga">
                <Button>Volver a la biblioteca</Button>
              </Link>
            )}
          </div>
        </Container>
      </div>
    );
  }

  const chapter = chapterData;
  const totalPages = chapter.paginas.length;
  const midpointPage = Math.max(1, Math.floor(totalPages / 2));

  return (
    <div className={styles.page}>
      <Container className={`${styles.content} ${isFullscreen ? styles.hiddenInFullscreen : ''}`}>
        <MangaBreadcrumb
          items={[
            { label: 'Manga', href: '/manga' },
            ...(mangaId && mangaData ? [{ label: mangaData.title, href: `/manga/${mangaId}` }] : []),
            ...(currentChapter ? [{ label: `Capítulo ${currentChapter.numeroCapitulo}` }] : []),
          ]}
        />

        <div className={styles.headerRow}>
          {isAuthenticated && (
            <button
              className={`${styles.readToggle} ${isRead ? styles.readToggleActive : ''}`}
              onClick={handleToggleRead}
            >
              {isRead ? '✓ Leído' : 'Marcar como leído'}
            </button>
          )}
        </div>

        {renderNavigation()}
      </Container>

      <div ref={fullscreenRef} className={styles.fullscreenWrapper}>
        {chapter.paginas.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No se encontraron páginas para este capítulo</p>
          </div>
        ) : (
          <>
            <div className={styles.imageStack}>
              {chapter.paginas.map((imageUrl, index) => {
                const pageNum = index + 1;
                const hasError = imageErrors.has(pageNum);
                const isLoaded = visiblePages.has(pageNum);

                return (
                  <div
                    key={pageNum}
                    ref={pageNum === midpointPage ? midpointRef : undefined}
                    className={styles.pageWrapper}
                  >
                    {hasError ? (
                      <div className={styles.imageError}>
                        <span className={styles.imageErrorIcon}>🖼️</span>
                        <span>Error al cargar la imagen</span>
                      </div>
                    ) : (
                      <>
                        {!isLoaded && (
                          <div className={styles.imageError}>
                            <div className={styles.loadingSpinner} />
                          </div>
                        )}
                        <img
                          src={imageUrl}
                          alt={`Página ${pageNum}`}
                          className={styles.pageImage}
                          style={{ display: isLoaded ? 'block' : 'none' }}
                          onLoad={() => handleImageLoad(pageNum)}
                          onError={() => handleImageError(pageNum)}
                        />
                      </>
                    )}
                    {!isFullscreen && <span className={styles.pageNumber}>{pageNum}</span>}
                  </div>
                );
              })}
            </div>

            {!isFullscreen && (
              <Container className={styles.bottomNav}>
                {renderNavigation()}
              </Container>
            )}
            {isFullscreen && (
              <div className={styles.bottomNavFullscreen}>
                {renderNavigation()}
              </div>
            )}

            {!isFullscreen && (
              <button
                className={`${styles.backToTop} ${showBackToTop ? styles.visible : ''}`}
                onClick={scrollToTop}
                aria-label="Volver arriba"
              >
                ↑
              </button>
            )}
          </>
        )}

        <button
          className={styles.fullscreenButton}
          onClick={toggleFullscreen}
          aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
        >
          {isFullscreen ? (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
            </svg>
          ) : (
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
