import { useEffect, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './MangaLibrary.module.css';
import { Container } from '../components/layout/Container';
import { Header } from '../components/layout/Header';
import { MangaCard } from '../components/ui/MangaCard';
import { Button } from '../components/ui/Button';
import { Chip } from '../components/ui/Chip';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useMangaLibrary } from '../hooks/useMangaLibrary';
import { useMangaFavorites } from '../hooks/useMangaFavorites';
import { getTags } from '../api/manga';
import { translateGenreDisplay } from '../api/manga';

const ITEMS_PER_PAGE = 25;
const TAGS_INITIAL_SHOW = 12;

export function MangaLibrary() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, page, totalPages, totalItems, hasNextPage, loading, error, fetchPage, fetchSearch } = useMangaLibrary();
  const { favorites } = useMangaFavorites();
  const [showFavorites, setShowFavorites] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagsExpanded, setTagsExpanded] = useState(false);

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const searchQuery = searchParams.get('q') || '';
  const selectedTag = searchParams.get('tag') || '';

  useEffect(() => {
    const favoritesParam = searchParams.get('favorites');
    setShowFavorites(favoritesParam === 'true');
  }, [searchParams]);

  // Load available tags
  useEffect(() => {
    getTags()
      .then((tags) => {
        // Sort tags alphabetically and translate for display
        const sortedTags = tags.sort((a, b) => a.localeCompare(b));
        setAvailableTags(sortedTags);
      })
      .catch(() => {
        // Silently fail - tags are optional
      });
  }, []);

  const loadData = useCallback(async () => {
    if (searchQuery || selectedTag) {
      await fetchSearch(searchQuery, selectedTag || undefined);
    } else {
      await fetchPage(currentPage);
    }
  }, [currentPage, searchQuery, selectedTag, fetchPage, fetchSearch]);

  useEffect(() => {
    if (!showFavorites) {
      loadData();
    }
  }, [loadData, showFavorites]);

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set('page', String(newPage));
      return newParams;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const hasPrevPage = page > 1;

  return (
    <div className={styles.page}>
      <Header
        showFavorites={showFavorites}
        onToggleFavorites={() => {
          const newShowFavorites = !showFavorites;
          setShowFavorites(newShowFavorites);
          setSearchParams((prev) => {
            const newParams = new URLSearchParams(prev);
            if (newShowFavorites) {
              newParams.set('favorites', 'true');
            } else {
              newParams.delete('favorites');
            }
            return newParams;
          });
        }}
      />
      <Container className={styles.content}>
        <div className={styles.header}>
          <h1 className={styles.title}>
            {showFavorites ? 'Mis Manga Favoritos' : (searchQuery ? `Resultados para "${searchQuery}"` : selectedTag ? `Género: ${translateGenreDisplay(selectedTag)}` : 'Biblioteca de Manga')}
          </h1>
          {!showFavorites && totalItems > 0 && (
            <p className={styles.stats}>
              {totalItems} manga{totalItems !== 1 ? 's' : ''} encontrado{totalItems !== 1 ? 's' : ''}
            </p>
          )}
        </div>

        {/* Tag Filters */}
        {!showFavorites && availableTags.length > 0 && (
          <div className={styles.tagsSection}>
            <div className={styles.tagsList}>
              {availableTags.slice(0, tagsExpanded ? availableTags.length : TAGS_INITIAL_SHOW).map((tag) => (
                <Chip
                  key={tag}
                  label={translateGenreDisplay(tag)}
                  selected={selectedTag === tag}
                  onClick={() => {
                    setSearchParams((prev) => {
                      const newParams = new URLSearchParams(prev);
                      if (selectedTag === tag) {
                        newParams.delete('tag');
                      } else {
                        newParams.set('tag', tag);
                        newParams.delete('page');
                      }
                      return newParams;
                    });
                  }}
                />
              ))}
            </div>
            {availableTags.length > TAGS_INITIAL_SHOW && (
              <button
                className={styles.expandButton}
                onClick={() => setTagsExpanded((e) => !e)}
              >
                {tagsExpanded
                  ? 'Ver menos'
                  : `Ver más (${availableTags.length - TAGS_INITIAL_SHOW} más)`}
              </button>
            )}
          </div>
        )}

        {error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <Button onClick={loadData}>Reintentar</Button>
          </div>
        ) : loading && items.length === 0 ? (
          <div className={styles.loadingGrid}>
            {Array.from({ length: ITEMS_PER_PAGE }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : showFavorites ? (
          favorites.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No tienes manga favoritos todavía</p>
              <Button variant="ghost" onClick={() => setShowFavorites(false)}>
                Ver biblioteca
              </Button>
            </div>
          ) : (
            <div className={styles.grid}>
              {favorites.map((manga) => (
                <MangaCard key={manga.publicId} manga={manga} />
              ))}
            </div>
          )
        ) : items.length === 0 && !loading ? (
          <div className={styles.emptyState}>
            <p>No se encontraron manga</p>
            {searchQuery && (
              <Button variant="ghost" onClick={() => setSearchParams({})}>
                Ver toda la biblioteca
              </Button>
            )}
          </div>
        ) : (
          <>
            <div className={styles.grid}>
              {items.map((manga) => (
                <MangaCard key={manga.publicId} manga={manga} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className={styles.pagination}>
                <Button
                  variant="ghost"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={!hasPrevPage}
                >
                  ← Anterior
                </Button>
                <span className={styles.pageInfo}>
                  Página {page} de {totalPages}
                </span>
                <Button
                  variant="ghost"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={!hasNextPage}
                >
                  Siguiente →
                </Button>
              </div>
            )}
          </>
        )}
      </Container>
    </div>
  );
}
