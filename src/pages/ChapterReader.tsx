import { useParams, Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import styles from './ChapterReader.module.css';
import { Container } from '../components/layout/Container';
import { MangaBreadcrumb } from '../components/layout/MangaBreadcrumb';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { useFetch } from '../hooks/useFetch';
import { getProxiedImageUrl } from '../api/manga';
import type { ChapterPage, MangaDetail, MangaChapter, ChapterVersion } from '../types/manga';

interface UniqueChapter {
  number: string;
  title: string | null;
  hash: string;
  versions: ChapterVersion[];
}

export function ChapterReader() {
  const { id, hash } = useParams<{ id: string; hash: string }>();
  const mangaId = id ? parseInt(id, 10) : null;

  const { data: chapterData, loading: chapterLoading, error: chapterError } = useFetch<ChapterPage>(hash ? `/manga/chapter/${hash}` : null);
  const { data: mangaData, loading: mangaLoading } = useFetch<MangaDetail>(mangaId ? `/manga/${mangaId}` : null);

  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set());
  const [visiblePages, setVisiblePages] = useState<Set<number>>(new Set());
  const [showBackToTop, setShowBackToTop] = useState(false);

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

  const navigate = useNavigate();

  const buildUniqueChapterList = (chapters: MangaChapter[]): UniqueChapter[] => {
    const seen = new Map<string, UniqueChapter>();
    for (const chapter of chapters) {
      if (!seen.has(chapter.number)) {
        seen.set(chapter.number, {
          number: chapter.number,
          title: chapter.title,
          hash: chapter.versions[0]?.hash ?? '',
          versions: chapter.versions,
        });
      }
    }
    return Array.from(seen.values());
  };

  const uniqueChapters = mangaData ? buildUniqueChapterList(mangaData.chapters) : [];
  const currentChapterIndex = uniqueChapters.findIndex(c => c.hash === hash);
  const prevChapter = currentChapterIndex > 0 ? uniqueChapters[currentChapterIndex - 1] : null;
  const nextChapter = currentChapterIndex < uniqueChapters.length - 1 ? uniqueChapters[currentChapterIndex + 1] : null;

  const currentChapter = currentChapterIndex >= 0 ? uniqueChapters[currentChapterIndex] : null;
  const hasMultipleVersions = currentChapter && currentChapter.versions.length > 1;

  const handleVersionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHash = e.target.value;
    navigate(`/manga/${id}/chapter/${newHash}`);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const renderNavigation = () => (
    <div className={styles.navigation}>
      {prevChapter ? (
        <Link
          to={`/manga/${id}/chapter/${prevChapter.hash}`}
          className={styles.navLink}
        >
          <span className={styles.navArrow}>←</span>
          <span className={styles.navLabel}>
            <span className={styles.navChapterNum}>Cap. {prevChapter.number}</span>
            {prevChapter.title && <span className={styles.navChapterTitle}>{prevChapter.title}</span>}
          </span>
        </Link>
      ) : (
        <span className={`${styles.navLink} ${styles.disabled}`}>
          <span className={styles.navArrow}>←</span>
          <span className={styles.navLabel}>Anterior</span>
        </span>
      )}

      <span className={styles.pageIndicator}>
        {chapter.totalPages} página{chapter.totalPages !== 1 ? 's' : ''}
      </span>

      {nextChapter ? (
        <Link
          to={`/manga/${id}/chapter/${nextChapter.hash}`}
          className={styles.navLink}
        >
          <span className={styles.navLabel}>
            <span className={styles.navChapterNum}>Cap. {nextChapter.number}</span>
            {nextChapter.title && <span className={styles.navChapterTitle}>{nextChapter.title}</span>}
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

  return (
    <div className={styles.page}>
      <Container className={styles.content}>
        <MangaBreadcrumb
          items={[
            { label: 'Manga', href: '/manga' },
            ...(mangaId && mangaData ? [{ label: mangaData.title, href: `/manga/${mangaId}` }] : []),
            ...(currentChapter ? [{ label: `Capítulo ${currentChapter.number}` }] : []),
          ]}
        />

        {hasMultipleVersions && (
          <div className={styles.versionSelector}>
            <span className={styles.versionLabel}>Versión:</span>
            <Select
              options={currentChapter!.versions.map((v, i) => ({
                value: v.hash,
                label: v.scanlator || `Versión ${i + 1}`,
              }))}
              value={hash}
              onChange={handleVersionChange}
              className={styles.versionSelect}
            />
          </div>
        )}

        {renderNavigation()}

        {chapter.pages.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No se encontraron páginas para este capítulo</p>
          </div>
        ) : (
          <>
            <div className={styles.imageStack}>
              {chapter.pages.map((page) => {
                const pageNum = page.pageNumber;
                const hasError = imageErrors.has(pageNum);
                const isLoaded = visiblePages.has(pageNum);

                return (
                  <div key={pageNum} className={styles.pageWrapper}>
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
                          src={getProxiedImageUrl(page.imageUrl)}
                          alt={`Página ${pageNum}`}
                          className={styles.pageImage}
                          style={{ display: isLoaded ? 'block' : 'none' }}
                          onLoad={() => handleImageLoad(pageNum)}
                          onError={() => handleImageError(pageNum)}
                        />
                      </>
                    )}
                    <span className={styles.pageNumber}>{pageNum}</span>
                  </div>
                );
              })}
            </div>

            <div className={styles.bottomNav}>
              {renderNavigation()}
            </div>

            <button
              className={`${styles.backToTop} ${showBackToTop ? styles.visible : ''}`}
              onClick={scrollToTop}
              aria-label="Volver arriba"
            >
              ↑
            </button>
          </>
        )}
      </Container>
    </div>
  );
}
