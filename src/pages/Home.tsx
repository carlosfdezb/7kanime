import { useState, useEffect, useCallback } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import styles from "./Home.module.css";
import { Container } from "../components/layout/Container";
import { Grid } from "../components/layout/Grid";
import { Header } from "../components/layout/Header";
import { Card } from "../components/ui/Card";
import { Chip } from "../components/ui/Chip";
import { Select } from "../components/ui/Select";
import { SkeletonCard } from "../components/ui/Skeleton";
import { Button } from "../components/ui/Button";
import { useDebounce } from "../hooks/useDebounce";
import { getCatalog } from "../api/catalog";
import { search } from "../api/search";
import { useFavoritesStore } from "../store/favoritesStore";
import type { CatalogItem } from "../types/api";

const LETTERS = [
    "A",
    "B",
    "C",
    "D",
    "E",
    "F",
    "G",
    "H",
    "I",
    "J",
    "K",
    "L",
    "M",
    "N",
    "O",
    "P",
    "Q",
    "R",
    "S",
    "T",
    "U",
    "V",
    "W",
    "X",
    "Y",
    "Z",
    "#",
];

const TYPE_OPTIONS = [
    { value: "tv-anime", label: "TV Anime" },
    { value: "ova", label: "OVA" },
    { value: "película", label: "Película" },
    { value: "especial", label: "Especial" },
];

const STATUS_OPTIONS = [
    { value: "airing", label: "En Emisión" },
    { value: "finished", label: "Finalizado" },
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

export function Home() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);
    const [genreExpanded, setGenreExpanded] = useState(true);

    const { favorites } = useFavoritesStore();
    const showFavorites = searchParams.get("favorites") === "true";

    const page = parseInt(searchParams.get("page") || "1", 10);
    const letter = searchParams.get("letter") || "";
    const genre = searchParams.get("genre") || "";
    const category = searchParams.get("category") || "";
    const minYear = searchParams.get("minYear") || "";
    const maxYear = searchParams.get("maxYear") || "";
    const status = searchParams.get("status") || "";

    const debouncedSearchQuery = useDebounce(searchQuery, 300);

    const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const fetchCatalog = useCallback(
        async (pageNum: number) => {
            setLoading(true);
            setError(null);

            try {
                const params: Record<string, string | number> = {
                    page: pageNum,
                };
                if (letter) params.letter = letter;
                if (genre) params.genre = genre;
                if (category) params.category = category;
                if (minYear) params.minYear = parseInt(minYear, 10);
                if (maxYear) params.maxYear = parseInt(maxYear, 10);
                if (status) params.status = status;

                const response = await getCatalog(params);
                setItems(response.items);
                setTotal(response.total);
            } catch (err) {
                setError(
                    err instanceof Error
                        ? err.message
                        : "Error al cargar el catálogo",
                );
            } finally {
                setLoading(false);
            }
        },
        [letter, genre, category, minYear, maxYear, status],
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
                    err instanceof Error ? err.message : "Error en la búsqueda",
                );
            } finally {
                setLoading(false);
            }
        },
        [page, fetchCatalog],
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

    return (
        <div className={styles.page}>
            <Header onSearch={setSearchQuery} />

            <Container className={styles.content}>
                {/* Filters */}
                <div className={styles.filters}>
                    <div className={styles.filterSection}>
                        <span className={styles.filterLabel}>Géneros</span>
                        <div className={styles.genreChips}>
                            {GENRES.slice(0, genreExpanded ? GENRES.length : GENRES_INITIAL_SHOW).map((g) => (
                                <Chip
                                    key={g.slug}
                                    label={g.label}
                                    selected={genre === g.slug}
                                    onClick={() =>
                                        handleFilterChange(
                                            "genre",
                                            genre === g.slug ? "" : g.slug,
                                        )
                                    }
                                />
                            ))}
                        </div>
                        {GENRES.length > GENRES_INITIAL_SHOW && (
                            <button
                                className={styles.expandButton}
                                onClick={() => setGenreExpanded((e) => !e)}
                            >
                                {genreExpanded
                                    ? `Ver menos`
                                    : `Ver más (${GENRES.length - GENRES_INITIAL_SHOW} más)`}
                            </button>
                        )}
                    </div>

                    <div className={styles.filterRow}>
                        <Select
                            options={TYPE_OPTIONS}
                            value={category}
                            onChange={(e) =>
                                handleFilterChange("category", e.target.value)
                            }
                            placeholder="Tipo"
                            className={styles.filterSelect}
                        />
                        <Select
                            options={STATUS_OPTIONS}
                            value={status}
                            onChange={(e) =>
                                handleFilterChange("status", e.target.value)
                            }
                            placeholder="Estado"
                            className={styles.filterSelect}
                        />
                        <div className={styles.yearSlider}>
                            <span className={styles.yearLabel}>Año</span>
                            <div className={styles.sliderContainer}>
                                <div className={styles.sliderTrack} />
                                <div
                                    className={styles.sliderTrackFilled}
                                    style={{
                                        left: `${((parseInt(minYear) || MIN_YEAR) - MIN_YEAR) / (MAX_YEAR - MIN_YEAR) * 100}%`,
                                        width: `${((parseInt(maxYear) || MAX_YEAR) - (parseInt(minYear) || MIN_YEAR)) / (MAX_YEAR - MIN_YEAR) * 100}%`,
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
                                />
                            </div>
                            <span className={styles.yearValue}>
                                {minYear || MIN_YEAR} — {maxYear || MAX_YEAR}
                            </span>
                        </div>
                    </div>

                    <div className={styles.filterSection}>
                        <span className={styles.filterLabel}>Letras</span>
                        <div className={styles.letterGrid}>
                            {LETTERS.map((l) => (
                                <button
                                    key={l}
                                    className={`${styles.letterButton} ${letter === l ? styles.letterActive : ""}`}
                                    onClick={() => handleLetterClick(l)}
                                    aria-pressed={letter === l}
                                >
                                    {l}
                                </button>
                            ))}
                        </div>
                    </div>

                    {(letter || genre || category || minYear || maxYear || status) && (
                        <Button variant="ghost" onClick={handleClearFilters}>
                            Limpiar filtros
                        </Button>
                    )}
                </div>

                {/* Results */}
                {error ? (
                    <div className={styles.errorState}>
                        <p>{error}</p>
                        <Button onClick={() => fetchCatalog(page)}>
                            Reintentar
                        </Button>
                    </div>
                ) : loading && items.length === 0 ? (
                    <Grid cols={4}>
                        {Array.from({ length: 20 }).map((_, i) => (
                            <SkeletonCard key={i} />
                        ))}
                    </Grid>
                ) : items.length === 0 ? (
                    <div className={styles.emptyState}>
                        <p>No se encontraron resultados</p>
                        {(letter ||
                            genre ||
                            category ||
                            minYear ||
                            maxYear ||
                            status ||
                            searchQuery) && (
                            <Button
                                variant="ghost"
                                onClick={handleClearFilters}
                            >
                                Limpiar filtros
                            </Button>
                        )}
                    </div>
                ) : showFavorites ? (
                    favorites.length === 0 ? (
                        <div className={styles.emptyState}>
                            <p>No tienes favoritos todavía</p>
                            <Button
                                variant="ghost"
                                onClick={() => navigate("/")}
                            >
                                Ver catálogo
                            </Button>
                        </div>
                    ) : (
                        <Grid cols={4}>
                            {favorites.map((item) => (
                                <Card key={item.id} anime={item} />
                            ))}
                        </Grid>
                    )
                ) : (
                    <>
                        <Grid cols={4}>
                            {items.map((item) => (
                                <Card key={item.id} anime={item} />
                            ))}
                        </Grid>

                        {/* Pagination */}
                        {!isSearching && totalPages > 1 && (
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
