import { useEffect, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './MangaLibrary.module.css';
import { Container } from '../components/layout/Container';
import { Header } from '../components/layout/Header';
import { MangaCard } from '../components/ui/MangaCard';
import { Button } from '../components/ui/Button';
import { SkeletonCard } from '../components/ui/Skeleton';
import { useMangaLibrary } from '../hooks/useMangaLibrary';
import { useMangaFavorites } from '../hooks/useMangaFavorites';

const ITEMS_PER_PAGE = 20;

export function MangaLibrary() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, page, totalPages, totalItems, hasNextPage, loading, error, fetchPage, fetchSearch } = useMangaLibrary();
  const { favorites } = useMangaFavorites();
  const [showFavorites, setShowFavorites] = useState(false);

  const currentPage = parseInt(searchParams.get('page') || '1', 10);
  const searchQuery = searchParams.get('q') || '';

  useEffect(() => {
    const favoritesParam = searchParams.get('favorites');
    setShowFavorites(favoritesParam === 'true');
  }, [searchParams]);

  const loadData = useCallback(async () => {
    if (searchQuery) {
      await fetchSearch(searchQuery, currentPage);
    } else {
      await fetchPage(currentPage);
    }
  }, [currentPage, searchQuery, fetchPage, fetchSearch]);

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
            {showFavorites ? 'Mis Manga Favoritos' : (searchQuery ? `Resultados para "${searchQuery}"` : 'Biblioteca de Manga')}
          </h1>
          {!showFavorites && totalItems > 0 && (
            <p className={styles.stats}>
              {totalItems} manga{totalItems !== 1 ? 's' : ''} encontrado{totalItems !== 1 ? 's' : ''}
            </p>
          )}
        </div>

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
                <MangaCard key={manga.id} manga={manga} />
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
                <MangaCard key={manga.id} manga={manga} />
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
