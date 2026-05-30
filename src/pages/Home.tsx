import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "./Home.module.css";
import {
  Container,
  Header,
  Card,
  Chip,
  Select,
  SkeletonCard,
  Button,
  Focusable,
  HeroSection,
  ContinueCard,
  Pagination,
  Footer,
} from "../components";
import { useDebounce, useAnimeFavorites, useTVNavigation } from "../hooks";
import { getCatalog } from "../api/catalog";
import { search } from "../api/search";
import { useWatchedStore } from "../store/watchedStore";
import type { CatalogItem } from "../types/api";
import type { WatchedAnime } from "../adapters/supabaseEpisodeAdapter";

const LETTERS = [
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M",
  "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "#",
];

const TYPE_OPTIONS = [
  { value: "tv-anime", label: "TV Anime" },
  { value: "ova", label: "OVA" },
  { value: "película", label: "Película" },
  { value: "especial", label: "Especial" },
];

const STATUS_OPTIONS = [
  { value: "emision", label: "En Emisión" },
  { value: "finalizado", label: "Finalizado" },
  { value: "proximamente", label: "Próximamente" },
];

const ORDER_OPTIONS = [
  { value: "", label: "Predeterminado" },
  { value: "score", label: "Puntuación" },
  { value: "popular", label: "Popularidad" },
  { value: "title", label: "Título" },
  { value: "latest_added", label: "Más recientes" },
  { value: "latest_released", label: "Último lanzado" },
];

const MIN_YEAR = 1980;
const MAX_YEAR = new Date().getFullYear();
const ITEMS_PER_PAGE = 20;

const GENRES = [
  { slug: "accion", label: "Acción" },
  { slug: "aventura", label: "Aventura" },
  { slug: "ciencia-ficcion", label: "Ciencia Ficción" },
  { slug: "comedia", label: "Comedia" },
  { slug: "deportes", label: "Deportes" },
  { slug: "drama", label: "Drama" },
  { slug: "fantasia", label: "Fantasía" },
  { slug: "misterio", label: "Misterio" },
  { slug: "recortes-de-la-vida", label: "Recortes de la Vida" },
  { slug: "romance", label: "Romance" },
  { slug: "seinen", label: "Seinen" },
  { slug: "shoujo", label: "Shoujo" },
  { slug: "shounen", label: "Shounen" },
  { slug: "sobrenatural", label: "Sobrenatural" },
  { slug: "suspenso", label: "Suspenso" },
  { slug: "terror", label: "Terror" },
  { slug: "antropomorfico", label: "Antropomórfico" },
  { slug: "artes-marciales", label: "Artes Marciales" },
  { slug: "carreras", label: "Carreras" },
  { slug: "detectives", label: "Detectives" },
  { slug: "ecchi", label: "Ecchi" },
  { slug: "escolares", label: "Escolares" },
  { slug: "espacial", label: "Espacial" },
  { slug: "gore", label: "Gore" },
  { slug: "gourmet", label: "Gourmet" },
  { slug: "harem", label: "Harem" },
  { slug: "historico", label: "Histórico" },
  { slug: "infantil", label: "Infantil" },
  { slug: "isekai", label: "Isekai" },
  { slug: "josei", label: "Josei" },
  { slug: "juegos-estrategia", label: "Juegos Estrategia" },
  { slug: "mahou-shoujo", label: "Mahou Shoujo" },
  { slug: "mecha", label: "Mecha" },
  { slug: "militar", label: "Militar" },
  { slug: "mitologia", label: "Mitología" },
  { slug: "musica", label: "Música" },
  { slug: "parodia", label: "Parodia" },
  { slug: "psicologico", label: "Psicológico" },
  { slug: "samurai", label: "Samurai" },
  { slug: "superpoderes", label: "Superpoderes" },
  { slug: "vampiros", label: "Vampiros" },
];

const GENRES_INITIAL_SHOW = 11;

const FEATURED_ANIME = {
  backdrop:
    "https://images.unsplash.com/photo-1578632767115-351597cf2477?w=1920&q=80",
  title: "Demon Slayer: Kimetsu no Yaiba",
  synopsis:
    "En un mundo donde los demonios devoran humanos, Tanjiro Kamado se convierte en cazador de demonios para vengar a su familia y curar a su hermana Nezuko, quien fue transformada en demonio.",
  badge: "Nuevo",
  meta: "TV Anime • 2024 • 24 eps",
  slug: "demon-slayer",
};

function CatalogGrid({
  items,
  containerRef,
}: {
  items: CatalogItem[];
  containerRef: React.RefObject<HTMLDivElement | null>;
}) {
  useTVNavigation({ containerRef });

  return (
    <div className={styles.catalogGrid}>
      {items.map((item) => (
        <Card key={item.id} anime={item} />
      ))}
    </div>
  );
}

export function Home() {
  const contentRef = useRef<HTMLDivElement>(null);
  const [searchParams, setSearchParams] = useSearchParams();
  const [items, setItems] = useState<CatalogItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [genreExpanded, setGenreExpanded] = useState(false);
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [showFavorites, setShowFavorites] = useState(false);

  const { favorites } = useAnimeFavorites();
  const { watchedEpisodes } = useWatchedStore();

  // Get recent episodes for "Continue Watching" widget
  const recentEpisodes = (() => {
    const entries = Object.entries(watchedEpisodes) as [string, WatchedAnime][];
    if (entries.length === 0) return [];

    return entries
      .map(([slug, data]) => ({ slug, ...data }))
      .map((item) => {
        const lastEpisode = Math.max(...item.episodes);
        const nextEpisode = lastEpisode + 1;
        return {
          ...item,
          nextEpisode,
          hasMoreEpisodes: item.episodesCount
            ? nextEpisode <= item.episodesCount
            : true,
        };
      })
      .filter((item) => item.hasMoreEpisodes)
      .sort((a, b) => {
        const aTime = a.lastWatchedAt
          ? new Date(a.lastWatchedAt).getTime()
          : 0;
        const bTime = b.lastWatchedAt
          ? new Date(b.lastWatchedAt).getTime()
          : 0;
        return bTime - aTime;
      })
      .slice(0, 10);
  })();

  const page = parseInt(searchParams.get("page") || "1", 10);
  const letter = searchParams.get("letter") || "";
  const genres = searchParams.getAll("genre");
  const genresKey = genres.join(",");
  const category = searchParams.get("category") || "";
  const minYear = searchParams.get("minYear") || "";
  const maxYear = searchParams.get("maxYear") || "";
  const status = searchParams.get("status") || "";
  const order = searchParams.get("order") || "";

  const activeFilterCount = [
    letter,
    genres.length > 0,
    category,
    minYear,
    maxYear,
    status,
    order,
  ].filter(Boolean).length;

  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  // Sync search query from URL on mount
  useEffect(() => {
    const urlSearch = searchParams.get("search") || "";
    if (urlSearch) {
      setSearchQuery(urlSearch);
    }
  }, []);

  const fetchCatalog = useCallback(
    async (pageNum: number) => {
      setLoading(true);
      setError(null);

      try {
        const params: Record<string, string | number | string[]> = {
          page: pageNum,
        };
        if (letter) params.letter = letter;
        if (genres.length > 0) params.genre = genres;
        if (category) params.category = category;
        if (minYear) params.minYear = parseInt(minYear, 10);
        if (maxYear) params.maxYear = parseInt(maxYear, 10);
        if (status) params.status = status;
        if (order) params.order = order;

        const response = await getCatalog(params);
        setItems(response.items);
        setTotal(response.total);
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Error al cargar el catálogo"
        );
      } finally {
        setLoading(false);
      }
    },
    [letter, genresKey, category, minYear, maxYear, status, order]
  );

  const fetchSearch = useCallback(
    async (query: string) => {
      if (query.length < 2) {
        setIsSearching(false);
        fetchCatalog(page);
        return;
      }

      setIsSearching(true);
      setLoading(true);
      setError(null);

      try {
        const response = await search(query);
        setItems(response.results);
        setTotal(response.count);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Error en la búsqueda"
        );
      } finally {
        setLoading(false);
      }
    },
    [page, fetchCatalog]
  );

  // Handle search query change
  useEffect(() => {
    if (debouncedSearchQuery.length >= 2) {
      fetchSearch(debouncedSearchQuery);
    } else if (debouncedSearchQuery.length === 0 && isSearching) {
      setIsSearching(false);
      fetchCatalog(page);
    }
  }, [debouncedSearchQuery, fetchSearch, fetchCatalog, page, isSearching]);

  // Sync search query to URL when user searches
  useEffect(() => {
    if (debouncedSearchQuery.length >= 2) {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.set("search", debouncedSearchQuery);
        newParams.set("page", "1");
        return newParams;
      });
    } else if (debouncedSearchQuery.length === 0) {
      setSearchParams((prev) => {
        const newParams = new URLSearchParams(prev);
        newParams.delete("search");
        return newParams;
      });
    }
  }, [debouncedSearchQuery, setSearchParams]);

  // Initial and filter change fetch
  useEffect(() => {
    if (debouncedSearchQuery.length < 2) {
      fetchCatalog(page);
    }
  }, [page, fetchCatalog, debouncedSearchQuery]);

  const handleFilterChange = (key: string, value: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      if (value) {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
      newParams.set("page", "1");
      return newParams;
    });
  };

  const handleGenreToggle = (slug: string) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      const currentGenres = newParams.getAll("genre");
      newParams.delete("genre");
      if (currentGenres.includes(slug)) {
        currentGenres
          .filter((g) => g !== slug)
          .forEach((g) => newParams.append("genre", g));
      } else {
        currentGenres.forEach((g) => newParams.append("genre", g));
        newParams.append("genre", slug);
      }
      newParams.set("page", "1");
      return newParams;
    });
  };

  const handleClearFilters = () => {
    setSearchParams({ page: "1" });
  };

  const handleLetterClick = (l: string) => {
    handleFilterChange("letter", letter === l ? "" : l);
  };

  const handlePageChange = (newPage: number) => {
    setSearchParams((prev) => {
      const newParams = new URLSearchParams(prev);
      newParams.set("page", String(newPage));
      return newParams;
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Featured hero: prefer first item if available
  const featured =
    items.length > 0 && !loading && !isSearching
      ? {
          backdrop: items[0].poster,
          title: items[0].title,
          synopsis: items[0].synopsis,
          slug: items[0].slug,
        }
      : FEATURED_ANIME;

  return (
    <div className={styles.page}>
      <Header
        onSearch={setSearchQuery}
        showFavorites={showFavorites}
        onToggleFavorites={() => setShowFavorites((v) => !v)}
      />

      {/* Hero Section */}
      <HeroSection
        backdrop={featured.backdrop}
        title={featured.title}
        synopsis={featured.synopsis}
        badge="Destacado"
        meta="TV Anime • En emisión"
        primaryAction={{
          label: "Ver ahora",
          to: `/episode/${featured.slug}/1`,
          variant: "primary",
          icon: "play",
        }}
        secondaryAction={{
          label: "Más info",
          to: `/anime/${featured.slug}`,
          variant: "ghost",
          icon: "info",
        }}
      />

      <Container className={styles.content} ref={contentRef}>
        {/* Continue Watching */}
        {recentEpisodes.length > 0 && (
          <section className={styles.continueSection} aria-label="Continuar viendo">
            <div className={styles.sectionHeader}>
              <h2 className={styles.sectionTitle}>Continuar viendo</h2>
            </div>
            <div className={styles.continueGrid}>
              {recentEpisodes.map((item) => {
                if (!item.poster_url || !item.anime_title) return null;
                const progress = item.episodesCount
                  ? (item.episodes.length / item.episodesCount) * 100
                  : 0;
                return (
                  <ContinueCard
                    key={item.slug}
                    slug={item.slug}
                    title={item.anime_title}
                    episode={item.nextEpisode}
                    poster={item.poster_url}
                    progress={Math.round(progress)}
                    type="anime"
                  />
                );
              })}
            </div>
          </section>
        )}

        {/* Catalog Header */}
        <div className={styles.catalogHeader}>
          <h1 className={styles.sectionTitle}>
            {showFavorites
              ? "Mis Anime Favoritos"
              : debouncedSearchQuery
                ? `Resultados para "${debouncedSearchQuery}"`
                : "Catálogo de Anime"}
          </h1>
          {!showFavorites && total > 0 && (
            <span className={styles.catalogCount}>
              {total} anime{total !== 1 ? "s" : ""} encontrado
              {total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {/* Genre Chips */}
        <div className={styles.filtersSection}>
          <div className={styles.filtersRow}>
            {GENRES.slice(
              0,
              genreExpanded ? GENRES.length : GENRES_INITIAL_SHOW
            ).map((g) => (
              <Chip
                key={g.slug}
                label={g.label}
                selected={genres.includes(g.slug)}
                onClick={() => handleGenreToggle(g.slug)}
              />
            ))}
          </div>
          {GENRES.length > GENRES_INITIAL_SHOW && (
            <button
              className={styles.filterToggle}
              onClick={() => setGenreExpanded((e) => !e)}
              data-tv-focus="true"
              data-tv-focus-id="expand-genres-btn"
            >
              {genreExpanded
                ? "Ver menos"
                : `Ver más (${GENRES.length - GENRES_INITIAL_SHOW} más)`}
            </button>
          )}

          {/* Advanced Filters Toggle */}
          <button
            className={styles.filterToggle}
            onClick={() => setFiltersVisible((v) => !v)}
            data-tv-focus="true"
            data-tv-focus-id="toggle-filters-btn"
          >
            <span>Más filtros</span>
            <span
              className={styles.filterChevron}
              style={{
                transform: filtersVisible ? "rotate(180deg)" : undefined,
              }}
            >
              ▼
            </span>
            {!filtersVisible && activeFilterCount > 0 && (
              <span className={styles.filterCount}>{activeFilterCount}</span>
            )}
          </button>

          {filtersVisible && (
            <div className={styles.advancedFilters}>
              <div className={styles.filterGroup}>
                <span className={styles.filterLabel}>Letras</span>
                <div className={styles.letterGrid}>
                  {LETTERS.map((l) => (
                    <Focusable
                      as="button"
                      key={l}
                      id={`letter-${l}`}
                      className={`${styles.letterButton} ${
                        letter === l ? styles.letterActive : ""
                      }`}
                      onClick={() => handleLetterClick(l)}
                    >
                      {l}
                    </Focusable>
                  ))}
                </div>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, 1fr)",
                  gap: "16px",
                }}
              >
                <div className={styles.filterGroup}>
                  <span className={styles.filterLabel}>Tipo</span>
                  <Select
                    options={TYPE_OPTIONS}
                    value={category}
                    onChange={(e) =>
                      handleFilterChange("category", e.target.value)
                    }
                    placeholder="Tipo"
                  />
                </div>

                <div className={styles.filterGroup}>
                  <span className={styles.filterLabel}>Estado</span>
                  <Select
                    options={STATUS_OPTIONS}
                    value={status}
                    onChange={(e) =>
                      handleFilterChange("status", e.target.value)
                    }
                    placeholder="Estado"
                  />
                </div>

                <div className={styles.filterGroup}>
                  <span className={styles.filterLabel}>Año</span>
                  <div className={styles.yearSlider}>
                    <div className={styles.sliderContainer}>
                      <div className={styles.sliderTrack} />
                      <div
                        className={styles.sliderTrackFilled}
                        style={{
                          left: `${
                            ((parseInt(minYear) || MIN_YEAR) - MIN_YEAR) /
                            (MAX_YEAR - MIN_YEAR) *
                            100
                          }%`,
                          width: `${
                            ((parseInt(maxYear) || MAX_YEAR) -
                              (parseInt(minYear) || MIN_YEAR)) /
                            (MAX_YEAR - MIN_YEAR) *
                            100
                          }%`,
                        }}
                      />
                      <input
                        type="range"
                        min={MIN_YEAR}
                        max={MAX_YEAR}
                        value={parseInt(minYear) || MIN_YEAR}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const max = parseInt(maxYear) || MAX_YEAR;
                          if (val <= max) {
                            handleFilterChange("minYear", String(val));
                          }
                        }}
                        className={styles.sliderMin}
                        data-tv-focus="true"
                        data-tv-focus-id="year-min-slider"
                      />
                      <input
                        type="range"
                        min={MIN_YEAR}
                        max={MAX_YEAR}
                        value={parseInt(maxYear) || MAX_YEAR}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const min = parseInt(minYear) || MIN_YEAR;
                          if (val >= min) {
                            handleFilterChange("maxYear", String(val));
                          }
                        }}
                        className={styles.sliderMax}
                        data-tv-focus="true"
                        data-tv-focus-id="year-max-slider"
                      />
                    </div>
                    <span className={styles.yearValue}>
                      {minYear || MIN_YEAR} — {maxYear || MAX_YEAR}
                    </span>
                  </div>
                </div>
              </div>

              <div className={styles.orderRow}>
                <span className={styles.orderLabel}>
                  <span className={styles.orderIcon}>⇅</span>
                  Ordenar
                </span>
                <Select
                  options={ORDER_OPTIONS}
                  value={order}
                  onChange={(e) => handleFilterChange("order", e.target.value)}
                />
              </div>

              {(letter ||
                genres.length > 0 ||
                category ||
                minYear ||
                maxYear ||
                status ||
                order) && (
                <Button
                  variant="ghost"
                  onClick={handleClearFilters}
                  data-tv-focus="true"
                  data-tv-focus-id="clear-filters-btn"
                >
                  Limpiar filtros
                </Button>
              )}
            </div>
          )}
        </div>

        {/* Results */}
        {error ? (
          <div className={styles.errorState}>
            <p>{error}</p>
            <Button onClick={() => fetchCatalog(page)}>Reintentar</Button>
          </div>
        ) : loading && items.length === 0 ? (
          <div className={styles.catalogGrid}>
            {Array.from({ length: 20 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No se encontraron resultados</p>
            {(letter ||
              genres.length > 0 ||
              category ||
              minYear ||
              maxYear ||
              status ||
              order ||
              searchQuery) && (
              <Button variant="ghost" onClick={handleClearFilters}>
                Limpiar filtros
              </Button>
            )}
          </div>
        ) : showFavorites ? (
          favorites.length === 0 ? (
            <div className={styles.emptyState}>
              <p>No tienes favoritos todavía</p>
              <Button variant="ghost" onClick={() => setShowFavorites(false)}>
                Ver catálogo
              </Button>
            </div>
          ) : (
            <CatalogGrid items={favorites} containerRef={contentRef} />
          )
        ) : (
          <>
            <CatalogGrid items={items} containerRef={contentRef} />

            {/* Pagination */}
            {!isSearching && totalPages > 1 && (
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
