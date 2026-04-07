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

const generateYears = () => {
    const currentYear = new Date().getFullYear();
    return Array.from({ length: 20 }, (_, i) => ({
        value: String(currentYear - i),
        label: String(currentYear - i),
    }));
};

const ITEMS_PER_PAGE = 20;

export function Home() {
    const [searchParams, setSearchParams] = useSearchParams();
    const navigate = useNavigate();
    const [items, setItems] = useState<CatalogItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearching, setIsSearching] = useState(false);

    const { favorites } = useFavoritesStore();
    const showFavorites = searchParams.get("favorites") === "true";

    const page = parseInt(searchParams.get("page") || "1", 10);
    const letter = searchParams.get("letter") || "";
    const genre = searchParams.get("genre") || "";
    const type = searchParams.get("type") || "";
    const year = searchParams.get("year") || "";
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
                if (type) params.type = type;
                if (year) params.year = parseInt(year, 10);
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
        [letter, genre, type, year, status],
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
        setSearchParams(() => {
            const newParams = new URLSearchParams();
            if (value) {
                newParams.set(key, value);
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
                            <Chip
                                label="Acción"
                                selected={genre === "accion"}
                                onClick={() =>
                                    handleFilterChange(
                                        "genre",
                                        genre === "accion" ? "" : "accion",
                                    )
                                }
                            />
                            <Chip
                                label="Comedia"
                                selected={genre === "comedia"}
                                onClick={() =>
                                    handleFilterChange(
                                        "genre",
                                        genre === "comedia" ? "" : "comedia",
                                    )
                                }
                            />
                            <Chip
                                label="Drama"
                                selected={genre === "drama"}
                                onClick={() =>
                                    handleFilterChange(
                                        "genre",
                                        genre === "drama" ? "" : "drama",
                                    )
                                }
                            />
                            <Chip
                                label="Romance"
                                selected={genre === "romance"}
                                onClick={() =>
                                    handleFilterChange(
                                        "genre",
                                        genre === "romance" ? "" : "romance",
                                    )
                                }
                            />
                            <Chip
                                label="Terror"
                                selected={genre === "terror"}
                                onClick={() =>
                                    handleFilterChange(
                                        "genre",
                                        genre === "terror" ? "" : "terror",
                                    )
                                }
                            />
                            <Chip
                                label="Ciencia Ficción"
                                selected={genre === "ciencia-ficcion"}
                                onClick={() =>
                                    handleFilterChange(
                                        "genre",
                                        genre === "ciencia-ficcion"
                                            ? ""
                                            : "ciencia-ficcion",
                                    )
                                }
                            />
                        </div>
                    </div>

                    <div className={styles.filterRow}>
                        <Select
                            options={TYPE_OPTIONS}
                            value={type}
                            onChange={(e) =>
                                handleFilterChange("type", e.target.value)
                            }
                            placeholder="Tipo"
                            className={styles.filterSelect}
                        />
                        <Select
                            options={generateYears()}
                            value={year}
                            onChange={(e) =>
                                handleFilterChange("year", e.target.value)
                            }
                            placeholder="Año"
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

                    {(letter || genre || type || year || status) && (
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
                            type ||
                            year ||
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
