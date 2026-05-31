import { useEffect, useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import styles from './MangaLibrary.module.css';
import {
  Container,
  Header,
  MangaCard,
  Button,
  Chip,
  SkeletonCard,
  HeroSection,
  ContinueCard,
  Pagination,
  Footer,
} from '../components';
import { useMangaLibrary } from '../hooks/useMangaLibrary';
import { useMangaFavorites } from '../hooks/useMangaFavorites';
import { useContinueReading } from '../hooks/useContinueReading';
import { getTags } from '../api/manga';
import { translateGenreDisplay } from '../api/manga';

const ITEMS_PER_PAGE = 28;
const TAGS_COLLAPSED_COUNT = 30;

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

const FEATURED_MANGA = {
  backdrop:
    'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=1920&q=80',
  title: 'Jujutsu Kaisen',
  synopsis:
    'Yuji Itadori es un estudiante de secundaria con una capacidad atlética excepcional. Vive con su abuelo y, para evitar que sus compañeros del club de ocultismo se metan en problemas, consume un dedo maldito de Ryomen Sukuna, convirtiéndose en su recipiente.',
  badge: 'Destacado',
  meta: 'Manga • En emisión',
  slug: 'jujutsu-kaisen',
};

export function MangaLibrary() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { items, page, totalPages, totalItems, loading, error, fetchPage, fetchSearch } = useMangaLibrary();
  const { favorites } = useMangaFavorites();
  const { recentMangas } = useContinueReading();
  const [showFavorites, setShowFavorites] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagsExpanded, setTagsExpanded] = useState(false);
  const validRecentMangas = recentMangas;

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
        const popularSet = new Set<string>();
        for (const popular of POPULAR_TAGS) {
          const found = availableTags.find(
            (tag) => tag.toLowerCase() === popular.toLowerCase()
          );
          if (found) {
            popularSet.add(found);
          }
          if (popularSet.size >= TAGS_COLLAPSED_COUNT) break;
        }
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

  const handleTagToggle = (tag: string) => {
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
  };

  // Featured hero: prefer first item if available
  const featured =
    items.length > 0 && !loading && !searchQuery && !selectedTag
      ? {
          backdrop: items[0].coverUrl,
          title: items[0].title,
          synopsis: '',
          slug: items[0].publicId,
        }
      : FEATURED_MANGA;

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

      {/* Hero Section */}
      <HeroSection
        backdrop={featured.backdrop}
        title={featured.title}
        synopsis={featured.synopsis}
        badge="Destacado"
        meta="Manga • En emisión"
        compact
        primaryAction={{
          label: 'Leer ahora',
          to: `/manga/${featured.slug}`,
          variant: 'primary',
          icon: 'play',
        }}
        secondaryAction={{
          label: 'Más info',
          to: `/manga/${featured.slug}`,
          variant: 'ghost',
          icon: 'info',
        }}
      />

      <Container className={styles.content}>
        {/* Continue Reading */}
        {!showFavorites && validRecentMangas.length > 0 && (
          <section className={styles.continueSection} aria-label="Seguir leyendo">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Seguir leyendo</h2>
            </div>
            <div className={styles.continueGrid}>
              {validRecentMangas.map((item) => (
                <ContinueCard
                  key={item.mangaId}
                  slug={item.mangaId}
                  title={item.mangaTitle}
                  chapter={item.readCount}
                  poster={item.coverUrl}
                  progress={0}
                  type="manga"
                />
              ))}
            </div>
          </section>
        )}

        {/* Catalog Header */}
        <div className={styles.catalogHeader}>
          <h1 className={styles.sectionTitle}>
            {showFavorites
              ? 'Mis Manga Favoritos'
              : searchQuery
                ? `Resultados para "${searchQuery}"`
                : selectedTag
                  ? `Género: ${translateGenreDisplay(selectedTag)}`
                  : 'Biblioteca de Manga'}
          </h1>
          {!showFavorites && totalItems > 0 && (
            <span className={styles.catalogCount}>
              {totalItems} manga{totalItems !== 1 ? 's' : ''} encontrado
              {totalItems !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {/* Filters */}
        {!showFavorites && availableTags.length > 0 && (
          <div className={styles.filtersSection}>
            <div className={styles.filtersRow}>
              {displayedTags.map((tag) => (
                <Chip
                  key={tag}
                  label={translateGenreDisplay(tag)}
                  selected={selectedTag === tag}
                  onClick={() => handleTagToggle(tag)}
                />
              ))}
            </div>

            {availableTags.length > TAGS_COLLAPSED_COUNT && (
              <button
                className={`${styles.filterToggle} ${styles.filterToggleFullWidth}`}
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
            <div className={styles.catalogGrid}>
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
            <div className={styles.catalogGrid}>
              {items.map((manga) => (
                <MangaCard key={manga.publicId} manga={manga} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination
                currentPage={page}
                totalPages={totalPages}
                onPageChange={handlePageChange}
              />
            )}
          </>
        )}
      </Container>

      <Footer />
    </div>
  );
}
