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
import { useContinueReading } from '../hooks/useContinueReading';
import { getTags } from '../api/manga';
import { translateGenreDisplay } from '../api/manga';
import { Link } from 'react-router-dom';

const ITEMS_PER_PAGE = 25;
const TAGS_COLLAPSED_COUNT = 30;

// Popular tags shown first when collapsed (in priority order)
const POPULAR_TAGS = [
  'Acción', 'Adventure', 'Aventura', 'Comedia', 'Comedy', 'Drama',
  'Fantasía', 'Fantasy', 'Romance', 'Escolar', 'School', 'School Life',
  'Vida escolar', 'Shōnen', 'Shonen', 'Seinen', 'Shōjo', 'Shojo',
  'Isekai', 'Sobrenatural', 'Supernatural', 'Super Natural',
  'Deportes', 'Sports', 'Artes marciales', 'Martial Arts', 'Misterio',
  'Mystery', 'Horror', 'Terror', 'Ciencia Ficción', 'Sci-Fi',
  'Mecha', 'Psicológico', 'Psychological', 'Gore', 'Ecchi',
  'Harem', 'Hentai', 'Yaoi', 'Yuri', 'Slice of Life',
  'Recuentos de la vida', 'Vida Cotidiana', 'Histórico', 'Historical',
  'Guerra', 'War', 'Militar', 'Military', 'Policial',
  'Police', 'Musica', 'Music', 'Parodia', 'Parody',
];

export function MangaLibrary() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, page, totalPages, totalItems, hasNextPage, loading, error, fetchPage, fetchSearch } = useMangaLibrary();
  const { favorites } = useMangaFavorites();
  const { recentMangas } = useContinueReading();
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

  // Load and organize available tags
  useEffect(() => {
    getTags()
      .then((tags) => {
        setAvailableTags(tags);
      })
      .catch(() => {
        // Silently fail - tags are optional
      });
  }, []);

  // Organize tags for display: popular first when collapsed, alphabetical when expanded
  const displayedTags = tagsExpanded
    ? [...availableTags].sort((a, b) => a.localeCompare(b))
    : (() => {
        // When collapsed: show popular tags that exist in availableTags
        const popularSet = new Set<string>();
        
        // Add popular tags that exist in the API response
        for (const popular of POPULAR_TAGS) {
          const found = availableTags.find(
            (tag) => tag.toLowerCase() === popular.toLowerCase()
          );
          if (found) {
            popularSet.add(found);
          }
          if (popularSet.size >= TAGS_COLLAPSED_COUNT) break;
        }
        
        // If we don't have enough popular tags, fill with remaining tags alphabetically
        if (popularSet.size < TAGS_COLLAPSED_COUNT) {
          const remaining = availableTags
            .filter((tag) => !popularSet.has(tag))
            .sort((a, b) => a.localeCompare(b));
          
          for (const tag of remaining) {
            popularSet.add(tag);
            if (popularSet.size >= TAGS_COLLAPSED_COUNT) break;
          }
        }
        
        return Array.from(popularSet);
      })();

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
        {/* Continue Reading Widget */}
        {!showFavorites && recentMangas.length > 0 && (
          <section className={styles.continueReading} aria-label="Seguir leyendo">
            <h2 className={styles.continueReadingTitle}>Seguir leyendo</h2>
            <div className={styles.continueReadingGrid}>
              {recentMangas.map((item) => (
                <Link
                  key={item.mangaId}
                  to={`/manga/${item.mangaId}`}
                  className={styles.continueReadingCard}
                >
                  <div className={styles.continueReadingPoster}>
                    <img
                      src={item.coverUrl}
                      alt={item.mangaTitle}
                      loading="lazy"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = 'none';
                      }}
                    />
                    <span className={styles.continueReadingBadge}>
                      {item.readCount} leído{item.readCount !== 1 ? 's' : ''}
                    </span>
                  </div>
                  <div className={styles.continueReadingInfo}>
                    <h4>{item.mangaTitle}</h4>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

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
              {displayedTags.map((tag) => (
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
            {availableTags.length > TAGS_COLLAPSED_COUNT && (
              <button
                className={styles.expandButton}
                onClick={() => setTagsExpanded((e) => !e)}
              >
                {tagsExpanded
                  ? 'Ver menos'
                  : `Ver más (${availableTags.length - TAGS_COLLAPSED_COUNT} más)`}
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
