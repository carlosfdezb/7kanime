import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import styles from './ChapterReader.module.css';
import { Container } from '../components/layout/Container';
import { Header } from '../components/layout/Header';
import { MangaBreadcrumb } from '../components/layout/MangaBreadcrumb';
import { CascadeView } from '../components/reader/CascadeView';
import { PaginatedView } from '../components/reader/PaginatedView';
import { EndOfChapterOverlay } from '../components/reader/EndOfChapterOverlay';
import { useReadChapters } from '../hooks/useReadChapters';
import { useSyncContext } from '../context/SyncContext';
import { usePreferencesStore } from '../store/preferencesStore';
import { getChapterPages, getMangaDetail } from '../api/manga';
import { sortChaptersByOrden } from '../utils/manga';
import type { ChapterPages, MangaDetail, MangaChapter } from '../types/manga';
import type { ReadingMode } from '../types/preferences';

export function ChapterReader() {
  const { serieId, capituloId } = useParams<{ serieId: string; capituloId: string }>();
  const mangaId = serieId || null;

  const [chapterData, setChapterData] = useState<ChapterPages | null>(null);
  const [chapterLoading, setChapterLoading] = useState(false);
  const [chapterError, setChapterError] = useState<string | null>(null);
  const [mangaData, setMangaData] = useState<MangaDetail | null>(null);
  const [mangaLoading, setMangaLoading] = useState(false);

  const { preferencesAdapter } = useSyncContext();
  const { preferences, setReadingMode } = usePreferencesStore();

  useEffect(() => {
    if (!serieId || !capituloId) return;
    setChapterLoading(true);
    setChapterError(null);
    getChapterPages(serieId, capituloId)
      .then(setChapterData)
      .catch((err) => setChapterError(err instanceof Error ? err.message : 'Error al cargar el capítulo'))
      .finally(() => setChapterLoading(false));
  }, [serieId, capituloId]);

  useEffect(() => {
    if (!mangaId) return;
    setMangaLoading(true);
    getMangaDetail(mangaId)
      .then(setMangaData)
      .catch(() => {
        // Silently fail — manga detail is only for navigation/breadcrumbs
      })
      .finally(() => setMangaLoading(false));
  }, [mangaId]);

  const { markAsRead, removeFromRead, readChapters, isAuthenticated } = useReadChapters(mangaId ?? '');

  const isRead = capituloId ? readChapters.includes(capituloId) : false;

  // State shared between view modes
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [showBackToTop, setShowBackToTop] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showEndOfChapterNav, setShowEndOfChapterNav] = useState(false);

  // Paginated mode state
  const [currentPage, setCurrentPage] = useState(0);

  const fullscreenRef = useRef<HTMLDivElement>(null);
  const currentImageRef = useRef<HTMLImageElement | null>(null);

  // Reading mode from preferences store
  const readingMode: ReadingMode = preferences.readingMode;

  // Derive prev/next chapter from manga detail
  const sortedChapters = mangaData ? sortChaptersByOrden(mangaData.chapters) : [];
  const currentIndex = sortedChapters.findIndex(ch => ch.publicId === capituloId);
  const currentChapter = currentIndex >= 0 ? sortedChapters[currentIndex] : undefined;
  const prevChapter: MangaChapter | null = currentIndex > 0 ? sortedChapters[currentIndex - 1] : null;
  const nextChapter: MangaChapter | null = currentIndex >= 0 && currentIndex < sortedChapters.length - 1 ? sortedChapters[currentIndex + 1] : null;

  // Find the image closest to the top of the viewport
  const findMostVisibleImage = useCallback((): HTMLImageElement | null => {
    if (readingMode === 'paginated') {
      return null;
    }

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
  }, [readingMode]);

  const toggleFullscreen = useCallback(() => {
    const element = fullscreenRef.current;
    if (!element) return;

    if (document.fullscreenElement) {
      if (readingMode !== 'paginated') {
        const currentImage = findMostVisibleImage();
        if (currentImage) {
          currentImageRef.current = currentImage;
        }
      }
      document.exitFullscreen();
    } else {
      if (readingMode !== 'paginated') {
        const currentImage = findMostVisibleImage();
        if (currentImage) {
          currentImageRef.current = currentImage;
        }
      }
      element.requestFullscreen();
    }
  }, [findMostVisibleImage, readingMode]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      const entering = !!document.fullscreenElement;
      setIsFullscreen(entering);

      if (entering) {
        setTimeout(() => {
          if (readingMode === 'paginated') {
            // No scrollIntoView needed
          } else {
            const targetImage = currentImageRef.current || findMostVisibleImage();
            if (targetImage) {
              targetImage.scrollIntoView({ block: 'start', behavior: 'instant' });
              currentImageRef.current = targetImage;
            }
          }
        }, 100);
      } else {
        setTimeout(() => {
          if (readingMode === 'paginated') {
            // No scroll needed
          } else {
            const targetImage = currentImageRef.current || findMostVisibleImage();
            if (targetImage) {
              targetImage.scrollIntoView({ block: 'start', behavior: 'instant' });
            }
          }
        }, 100);
      }
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, [findMostVisibleImage, readingMode]);

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

  // Back-to-top visibility - only in cascade mode
  useEffect(() => {
    if (readingMode !== 'cascade') {
      setShowBackToTop(false);
      return;
    }

    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [readingMode]);

  // Reset current page and overlay state when chapter changes
  useEffect(() => {
    setCurrentPage(0);
    setShowEndOfChapterNav(false);
  }, [capituloId]);

  const handleImageError = (pageNumber: number) => {
    setImageErrors(prev => new Set(prev).add(pageNumber));
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

  const handleReadingModeChange = (mode: ReadingMode) => {
    setReadingMode(mode, preferencesAdapter ?? undefined);
    setCurrentPage(0);
  };

  const handlePrevPage = () => {
    setCurrentPage(p => Math.max(0, p - 1));
  };

  const handleNextPage = () => {
    if (!chapterData) return;
    setCurrentPage(p => Math.min(chapterData.paginas.length - 1, p + 1));
  };

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
                <button className={styles.backBtn}>Volver al manga</button>
              </Link>
            ) : (
              <Link to="/manga">
                <button className={styles.backBtn}>Volver a la biblioteca</button>
              </Link>
            )}
          </div>
        </Container>
      </div>
    );
  }

  const totalPages = chapterData.paginas.length;

  return (
    <div className={styles.page}>
      <Header />
      <Container className={`${styles.content} ${isFullscreen ? styles.hiddenInFullscreen : ''}`}>
        <MangaBreadcrumb
          items={[
            { label: 'Manga', href: '/manga' },
            ...(mangaId && mangaData ? [{ label: mangaData.title, href: `/manga/${mangaId}` }] : []),
            ...(currentChapter ? [{ label: `Capítulo ${currentChapter.numeroCapitulo}` }] : []),
          ]}
        />
      </Container>

      <section className={styles.readerSection}>
        <div
          ref={fullscreenRef}
          className={`${styles.readerWrapper} ${readingMode === 'paginated' ? styles.readerPaginated : ''}`}
          data-tv-focus="true"
          data-tv-focus-id="reader"
        >
          {totalPages === 0 ? (
            <div className={styles.emptyState}>
              <p>No se encontraron páginas para este capítulo</p>
            </div>
          ) : readingMode === 'cascade' ? (
            <CascadeView
              pages={chapterData.paginas}
              imageErrors={imageErrors}
              onImageError={handleImageError}
              onMidpointReached={() => {
                if (capituloId && currentChapter && mangaData) {
                  markAsRead(capituloId, currentChapter.numeroCapitulo, mangaData.title, mangaData.coverUrl);
                }
              }}
            />
          ) : (
            <PaginatedView
              pages={chapterData.paginas}
              currentPage={currentPage}
              onPageChange={setCurrentPage}
              onLastPageReached={() => {
                if (capituloId && currentChapter && mangaData) {
                  markAsRead(capituloId, currentChapter.numeroCapitulo, mangaData.title, mangaData.coverUrl);
                }
              }}
              onEndOfChapterReached={() => setShowEndOfChapterNav(true)}
              isFullscreen={isFullscreen}
              imageErrors={imageErrors}
              onImageError={handleImageError}
            />
          )}

          {/* End of chapter overlay in fullscreen paginated mode */}
          {isFullscreen && readingMode === 'paginated' && (
            <EndOfChapterOverlay
              prevChapter={prevChapter}
              nextChapter={nextChapter}
              currentChapter={currentChapter || null}
              mangaId={serieId || ''}
              isOpen={showEndOfChapterNav}
              onClose={() => setShowEndOfChapterNav(false)}
            />
          )}

          {/* Floating fullscreen button */}
          <button
            className={styles.fullscreenButton}
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
          >
            {isFullscreen ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
              </svg>
            )}
          </button>

          {/* Aria live region for screen readers */}
          <div aria-live="polite" className="sr-only">
            {showEndOfChapterNav ? 'Fin del capítulo alcanzado. Navegación de capítulo disponible.' : ''}
          </div>

          {/* Back-to-top button - cascade only */}
          {readingMode === 'cascade' && (
            <button
              className={`${styles.backToTop} ${showBackToTop ? styles.visible : ''}`}
              onClick={scrollToTop}
              aria-label="Volver arriba"
            >
              ↑
            </button>
          )}
        </div>
      </section>

      {/* Bottom controls and navigation outside fullscreen */}
      {!isFullscreen && (
        <Container>
          <div className={`${styles.controlsBar} animate-fade-in`}>
            <div className={styles.controlGroup}>
              <span className={styles.controlLabel}>Modo</span>
              <button
                className={`${styles.modeChip} ${readingMode === 'cascade' ? styles.active : ''}`}
                onClick={() => handleReadingModeChange('cascade')}
                data-tv-focus="true"
                data-tv-focus-id="mode-cascade"
                title="Modo cascada"
              >
                Cascada
              </button>
              <button
                className={`${styles.modeChip} ${readingMode === 'paginated' ? styles.active : ''}`}
                onClick={() => handleReadingModeChange('paginated')}
                data-tv-focus="true"
                data-tv-focus-id="mode-paginated"
                title="Modo paginado"
              >
                Paginado
              </button>
            </div>

            {readingMode === 'paginated' && (
              <div className={styles.controlGroup}>
                <span className={styles.controlLabel}>Página</span>
                <button
                  className={styles.pageNavBtn}
                  onClick={handlePrevPage}
                  disabled={currentPage <= 0}
                  data-tv-focus="true"
                  data-tv-focus-id="prev-page"
                  aria-label="Página anterior"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="15,18 9,12 15,6" />
                  </svg>
                </button>
                <span className={styles.pageCounter}>
                  <span>{currentPage + 1}</span> / <span>{totalPages}</span>
                </span>
                <button
                  className={styles.pageNavBtn}
                  onClick={handleNextPage}
                  disabled={currentPage >= totalPages - 1}
                  data-tv-focus="true"
                  data-tv-focus-id="next-page"
                  aria-label="Página siguiente"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9,18 15,12 9,6" />
                  </svg>
                </button>
              </div>
            )}

            {isAuthenticated && (
              <button
                className={`${styles.readBtn} ${isRead ? styles.read : ''}`}
                onClick={handleToggleRead}
                data-tv-focus="true"
                data-tv-focus-id="read-toggle"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polyline points="20,6 9,17 4,12" />
                </svg>
                {isRead ? 'Leído' : 'Marcar como leído'}
              </button>
            )}
          </div>

          <nav className={`${styles.chapterNav} animate-fade-in`} aria-label="Navegación de capítulos">
            {prevChapter ? (
              <Link
                to={`/manga/${serieId}/chapter/${prevChapter.publicId}`}
                className={`${styles.navButton} ${styles.navButtonPrev}`}
                data-tv-focus="true"
                data-tv-focus-id="prev-chapter"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12,19 5,12 12,5" />
                </svg>
                <div className={styles.navButtonInfo}>
                  <span className={styles.navButtonLabel}>Anterior</span>
                  <span className={styles.navButtonTitle}>Cap. {prevChapter.numeroCapitulo}</span>
                </div>
              </Link>
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

            <span className={styles.chapterCounter}>
              Capítulo <span>{currentChapter?.numeroCapitulo ?? '—'}</span> / {sortedChapters.length}
            </span>

            {nextChapter ? (
              <Link
                to={`/manga/${serieId}/chapter/${nextChapter.publicId}`}
                className={`${styles.navButton} ${styles.navButtonNext}`}
                data-tv-focus="true"
                data-tv-focus-id="next-chapter"
              >
                <div className={styles.navButtonInfo}>
                  <span className={styles.navButtonLabel}>Siguiente</span>
                  <span className={styles.navButtonTitle}>Cap. {nextChapter.numeroCapitulo}</span>
                </div>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12,5 19,12 12,19" />
                </svg>
              </Link>
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

          {/* Chapters List */}
          {sortedChapters.length > 0 && (
            <section className={`${styles.chaptersListSection} animate-fade-in`}>
              <h2 className={styles.chaptersListTitle}>Todos los capítulos</h2>
              <div className={styles.chaptersListCompact}>
                {sortedChapters.map((ch) => {
                  const isCurrent = ch.publicId === capituloId;
                  const isRead = readChapters.includes(ch.publicId);
                  return (
                    <Link
                      key={ch.publicId}
                      to={`/manga/${serieId}/chapter/${ch.publicId}`}
                      className={`${styles.chapterButton} ${isCurrent ? styles.chapterButtonCurrent : ''} ${isRead ? styles.chapterButtonRead : ''}`}
                      aria-current={isCurrent ? 'page' : undefined}
                      data-tv-focus="true"
                      data-tv-focus-id={`chapter-${ch.publicId}`}
                    >
                      <span className={styles.chapterButtonNum}>{ch.numeroCapitulo}</span>
                      {ch.title && (
                        <span className={styles.chapterButtonLabel}>{ch.title}</span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          )}
        </Container>
      )}
    </div>
  );
}
