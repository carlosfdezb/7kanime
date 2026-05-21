# AnimeAV1 Frontend — AGENTS.md

## Core rule

This project follows an ATL/SDD workflow:

explore → propose → spec → design → tasks → apply → verify → archive

The orchestrator coordinates the workflow.
The orchestrator must delegate real work to the correct SDD phase agent or support specialist.

Support agents must not replace the main SDD phases.

---

## Main SDD phases

### @sdd-explore
Use for initial investigation, codebase reading, context discovery, constraints, dependencies and existing patterns.

### @sdd-propose
Use to propose the implementation approach, alternatives, tradeoffs and recommended path.

### @sdd-spec
Use to write precise requirements, acceptance criteria, expected behavior and constraints.

### @sdd-design
Use to define architecture, technical decisions, interfaces, data flow and implementation strategy.

### @sdd-tasks
Use to break the approved design into ordered, executable tasks.

### @sdd-apply
Use to implement the approved tasks.
Do not delegate from this agent.
Keep changes focused and aligned with spec/design.

### @sdd-verify
Use to validate implementation against spec, design and expected behavior.
Do not implement new features here unless explicitly requested.

### @sdd-archive
Use to summarize final changes, decisions, verification results and pending items.

---

## Support agents

### @sdd-ui-review
Use when there is a screenshot, visual bug, responsive issue, layout problem, spacing problem, CSS/Tailwind issue, visual hierarchy issue, or visual fidelity comparison.

Expected output:
- visual diagnosis
- likely cause
- concrete frontend/UI recommendations
- suggested files/components to inspect

Do not apply code changes unless explicitly requested.

---

### @sdd-bug-hunter
Use when implemented code fails, regressions appear, logs are suspicious, or a bug is hard to reproduce.

Expected output:
- likely root cause
- reproduction clues
- risky areas
- focused fix plan

Avoid broad rewrites.

---

### @sdd-contract-check
Use when changes affect API contracts, DTOs, schemas, props, validation, serialization, frontend/backend compatibility, request/response shape, or typing.

Expected output:
- contract mismatches
- compatibility risks
- exact corrective actions

Do not redesign the feature.

---

### @sdd-test-writer
Use after apply or before verify when tests are needed.

Expected output:
- unit tests
- integration tests
- mocks/fixtures
- edge cases
- regression coverage

Prefer pragmatic, maintainable coverage.

---

### @sdd-code-review
Use for larger changes, risky refactors, architecture-sensitive edits, or final technical review before archive.

Expected output:
- maintainability issues
- readability issues
- risk areas
- technical debt
- concrete improvement suggestions

Do not apply changes directly unless explicitly requested.

---

## Delegation rules

If the user provides a screenshot or image related to frontend/UI, delegate first to @sdd-ui-review, then continue with @sdd-apply or @sdd-verify.

If implementation fails or a regression appears, delegate to @sdd-bug-hunter.

If the change touches interfaces between layers, delegate to @sdd-contract-check.

If tests are missing or weak, delegate to @sdd-test-writer.

If the change is large or risky, delegate to @sdd-code-review before archive.

Only the orchestrator should delegate to support agents.
Phase agents should complete their assigned work and return results to the orchestrator.

---

## Meta

- **Stack**: React 18 + Vite + TypeScript
- **State**: Zustand (minimal global state)
- **Routing**: React Router v6
- **Styling**: CSS Modules (no Tailwind — minimalismo)
- **HTTP**: Fetch nativo con custom hooks
- **API Base**: `https://animeav1-api-server.vercel.app/`

---

## 1. Arquitectura de Proyecto

```
src/
├── api/                    # Fetch functions
│   ├── client.ts          # Base fetch wrapper
│   ├── anime.ts           # /anime/:slug
│   ├── catalog.ts         # /catalog
│   ├── search.ts          # /search
│   ├── episode.ts         # /episode/:slug/:number
│   └── manga.ts           # /manga/* + image proxy
├── components/            # Shared UI components
│   ├── ui/               # Atoms: Button, Input, Card, Chip
│   └── layout/            # Header, Footer, Container
├── pages/                 # Route pages
│   ├── Home.tsx          # Catalog + filters
│   ├── AnimeDetail.tsx   # Anime info
│   ├── Episode.tsx       # Player
│   ├── MangaLibrary.tsx  # Manga catalog + favorites
│   ├── MangaDetail.tsx   # Manga info + chapter list
│   ├── ChapterReader.tsx # Chapter reader (fullscreen)
│   └── NotFound.tsx
├── hooks/                 # Custom hooks
│   ├── useFetch.ts       # Generic fetch with loading/error
│   ├── useDebounce.ts    # Debounce utility
│   ├── useFavorites.ts   # Anime localStorage favorites
│   ├── useMangaFavorites.ts # Manga favorites wrapper
│   └── useMangaLibrary.ts  # Manga library + search
├── store/                 # Zustand stores
│   ├── favoritesStore.ts   # Anime favorites
│   └── mangaFavoritesStore.ts # Manga favorites
├── types/                 # TypeScript interfaces
│   ├── api.ts            # Anime API types
│   └── manga.ts          # Manga types
├── utils/                 # Helpers
│   └── cn.ts             # Class name merger
└── styles/                # Global styles & variables
    └── globals.css
```

---

## 2. Patterns de Fetching

### 2.1 Custom Hook `useFetch<T>`

```typescript
// Patrón consistente para TODAS las requests
const { data, loading, error } = useFetch<CatalogResponse>('/catalog?page=1');
```

**Implementación**:
- Abortar requests en cleanup (AbortController)
- Loading state inicial
- Error handling con mensaje legible
- No cachear en hook (el server ya cachea)

### 2.2 API Client

```typescript
// src/api/client.ts
const API_BASE = 'https://animeav1-api-server.vercel.app';

export async function apiFetch<T>(endpoint: string): Promise<T> {
  const res = await fetch(`${API_BASE}${endpoint}`);
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}
```

### 2.3 Endpoint Functions

```typescript
// src/api/catalog.ts
import { apiFetch } from './client';

export async function getCatalog(params: CatalogParams): Promise<CatalogResponse> {
  const qs = new URLSearchParams();
  if (params.page) qs.set('page', String(params.page));
  if (params.letter) qs.set('letter', params.letter);
  if (params.genre) qs.set('genre', params.genre);
  if (params.type) qs.set('type', params.type);
  if (params.year) qs.set('year', String(params.year));
  if (params.status) qs.set('status', params.status);

  return apiFetch<CatalogResponse>(`/catalog?${qs}`);
}
```

### 2.4 Manga API

```typescript
// src/api/manga.ts
import { apiFetch } from './client';
import type { MangaDetail, ChapterPage, PaginatedMangaResponse } from '../types/manga';

export async function getMangaLibrary(page: number): Promise<PaginatedMangaResponse> {
  return apiFetch<PaginatedMangaResponse>(`/manga/library?page=${page}`);
}

export async function searchManga(query: string, page: number): Promise<PaginatedMangaResponse> {
  return apiFetch<PaginatedMangaResponse>(`/manga/search?q=${encodeURIComponent(query)}&page=${page}`);
}

export async function getMangaDetail(id: string): Promise<MangaDetail> {
  return apiFetch<MangaDetail>(`/manga/${id}`);
}

export async function getChapterPages(hash: string): Promise<ChapterPage> {
  return apiFetch<ChapterPage>(`/manga/chapter/${hash}`);
}

// Image proxy — required because manga images may be blocked by CORS
export const MANGA_PROXY_BASE = 'https://animeav1-api-server.vercel.app/manga/proxy?url=';

export function getProxiedImageUrl(url: string): string {
  return `${MANGA_PROXY_BASE}${encodeURIComponent(url)}`;
}
```

---

## 3. Tipos de Datos (API)

### CatalogItem (también SearchResult)
```typescript
interface CatalogItem {
  id: number;
  title: string;
  slug: string;
  poster: string;
  type: string;      // "TV Anime", "OVA", "Película", "Especial"
  typeSlug: string;  // "tv-anime", "ova", "película", "especial"
  synopsis: string;
}
```

### AnimeDetail
```typescript
interface AnimeDetail {
  id: number;
  title: string;
  aka: { "en-us"?: string; "ja-jp"?: string };
  genres: Genre[];
  synopsis: string;
  poster: string;
  backdrop: string;
  trailer: string | null;
  status: number;
  statusText: string;  // "Airing", "Finished"
  episodesCount: number;
  score: number;
  votes: number;
  slug: string;
  category: Category;
  episodes: { id: number; number: number }[];
}
```

### EpisodeDetail
```typescript
interface EpisodeDetail {
  id: number;
  mediaId: number;
  number: number;
  variants: { DUB: number; SUB: number };
  embeds: { DUB: MediaLink[]; SUB: MediaLink[] };
  downloads: { DUB: MediaLink[]; SUB: MediaLink[] };
}

interface MediaLink {
  server: string;  // "HLS", "Mega", "UPNShare", "MP4Upload"
  url: string;
}
```

### MangaItem
```typescript
interface MangaItem {
  publicId: string;
  title: string;
  type: string;
  coverUrl: string;
  latestUpdate: string;
  rating: number;
  ratingCount: number;
  isEro: boolean;
  url: string;
}

> **Nota**: En el código real, el identificador único es `publicId: string`, no `id: number`.
```

### MangaDetail (extends MangaItem)
```typescript
interface MangaDetail extends MangaItem {
  description: string;
  author: string | null;
  artist: string | null;
  status: string;
  demographics: string[];
  genres: string[];
  chapters: MangaChapter[];
}
```

### MangaChapter
```typescript
interface MangaChapter {
  number: string;
  title: string;
  versions: ChapterVersion[];
}
```

### ChapterVersion
```typescript
interface ChapterVersion {
  hash: string;
  scanlator: string;
  date: string;
}
```

### ChapterPage
```typescript
interface ChapterPage {
  chapterHash: string;
  totalPages: number;
  pages: { pageNumber: number; imageUrl: string; format: string }[];
  prevChapterUrl: string | null;
  nextChapterUrl: string | null;
}
```

### PaginatedMangaResponse
```typescript
interface PaginatedMangaResponse {
  items: MangaItem[];
  page: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
}
```

---

## 4. Routing

```typescript
// App routes
/                      → Home (catalog)
/anime/:slug           → AnimeDetail
/episode/:slug/:num    → Episode (player)
/manga                 → MangaLibrary
/manga/:id             → MangaDetail
/manga/:id/chapter/:hash → ChapterReader
/search?q=             → Search results (query param, no separate route)
```

```typescript
// React Router v6
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/anime/:slug" element={<AnimeDetail />} />
  <Route path="/episode/:slug/:number" element={<Episode />} />
  <Route path="/manga" element={<MangaLibrary />} />
  <Route path="/manga/:id" element={<MangaDetail />} />
  <Route path="/manga/:id/chapter/:hash" element={<ChapterReader />} />
  <Route path="*" element={<NotFound />} />
</Routes>
```

---

## 5. Estado Global (Zustand)

### Favorites Store

```typescript
// src/store/favoritesStore.ts
import { create } from 'zustand';

interface FavoritesStore {
  favorites: number[];  // anime IDs
  addFavorite: (id: number) => void;
  removeFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>()((set, get) => ({
  favorites: [],
  addFavorite: (id) => set((s) => ({ favorites: [...s.favorites, id] })),
  removeFavorite: (id) => set((s) => ({ 
    favorites: s.favorites.filter((f) => f !== id) 
  })),
  isFavorite: (id) => get().favorites.includes(id),
}));
```

> **Nota**: La implementación real NO usa el middleware `persist` de Zustand. La persistencia para usuarios autenticados se maneja vía un patrón `SyncAdapter` que sincroniza con Supabase. Los usuarios "guest" actualmente pierden sus favoritos al recargar la página.

### Manga Favorites Store

```typescript
// src/store/mangaFavoritesStore.ts
import { create } from 'zustand';

interface MangaFavorite {
  id: number;
  title: string;
  coverUrl: string;
  type: string;
}

interface MangaFavoritesStore {
  favorites: MangaFavorite[];
  addFavorite: (manga: MangaFavorite) => void;
  removeFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
  toggleFavorite: (manga: MangaFavorite) => void;
}

export const useMangaFavoritesStore = create<MangaFavoritesStore>()((set, get) => ({
  favorites: [],
  addFavorite: (manga: MangaFavorite) => {
    const { favorites } = get();
    if (!favorites.some(f => f.id === manga.id)) {
      set({ favorites: [...favorites, manga] });
    }
  },
  removeFavorite: (id: number) => {
    set({ favorites: get().favorites.filter(f => f.id !== id) });
  },
  isFavorite: (id: number) => get().favorites.some(f => f.id === id),
  toggleFavorite: (manga: MangaFavorite) => {
    if (get().favorites.some(f => f.id === manga.id)) {
      get().removeFavorite(manga.id);
    } else {
      get().addFavorite(manga);
    }
  },
}));
```

### Manga Hooks

```typescript
// src/hooks/useMangaFavorites.ts — wrapper around mangaFavoritesStore
export function useMangaFavorites() {
  const { favorites, addManga, removeManga, isMangaFavorite, toggleMangaFavorite } =
    useMangaFavoritesStore();
  return { favorites, addManga, removeManga, isMangaFavorite, toggleMangaFavorite };
}

// src/hooks/useMangaLibrary.ts — manga catalog + search
interface UseMangaLibraryResult {
  items: MangaItem[];
  page: number;
  totalPages: number;
  totalItems: number;
  hasNextPage: boolean;
  loading: boolean;
  error: string | null;
  fetchPage: (pageNum: number) => Promise<void>;
  fetchSearch: (query: string, pageNum: number) => Promise<void>;
}
```

---

## 6. UI Components

### Atomic Design Structure

```
components/
├── ui/
│   ├── Button.tsx         # Variants: primary, ghost
│   ├── Input.tsx          # Search input
│   ├── Card.tsx           # Anime card
│   ├── MangaCard.tsx       # Manga card (with favorites)
│   ├── Chip.tsx           # Filter chip (genre, type, etc)
│   ├── Badge.tsx          # Status badges
│   ├── Skeleton.tsx       # Loading skeleton
│   ├── Select.tsx         # Dropdown select
│   └── ChapterList.tsx    # Chapter list accordion
└── layout/
    ├── Header.tsx         # Logo + search
    ├── Container.tsx      # Max-width wrapper
    ├── Grid.tsx           # Responsive grid
    └── MangaBreadcrumb.tsx # Manga navigation breadcrumb
```

### Card Component

```typescript
// src/components/ui/Card.tsx
interface CardProps {
  anime: CatalogItem;
  variant?: 'default' | 'compact';
}

// Props que recibe:
// - anime.poster (image)
// - anime.title
// - anime.type
// - anime.slug (for link)

// NO recibe synopsis en variant='compact'
```

### MangaCard Component

```typescript
// src/components/ui/MangaCard.tsx
interface MangaCardProps {
  manga: MangaItem | MangaFavorite;
  variant?: 'default' | 'compact';
  className?: string;
}

// Props que recibe:
// - manga.coverUrl (image, via getProxiedImageUrl)
// - manga.title
// - manga.type
// - manga.id (for link and favorites)

// Incluye botón de favorito integrado (♡/♥)
// Usa placeholder SVG si la imagen falla
```

> **Nota**: A diferencia de `Card.tsx`, `MangaCard.tsx` NO utiliza el componente `Focusable` para navegación TV. Usa `Link` directamente, lo cual genera una inconsistencia en el comportamiento de navegación por control remoto entre las vistas de anime y manga.

### ChapterList Component

```typescript
// src/components/ui/ChapterList.tsx
interface ChapterListProps {
  chapters: MangaChapter[];
  mangaId: number;
}

// Accordion por capítulo
// Click en header toggles expanded state
// Muestra versions (scanlators) cuando expandido
// Link a cada versión: /manga/:mangaId/chapter/:hash
```

### MangaBreadcrumb Component

```typescript
// src/components/layout/MangaBreadcrumb.tsx
interface MangaBreadcrumbItem {
  label: string;
  href?: string;
}

interface MangaBreadcrumbProps {
  items: MangaBreadcrumbItem[];
}

// Items: array de {label, href?}
// Último item es current page (no link)
// Separador: › entre items
```

### Chip Component

```typescript
// src/components/ui/Chip.tsx
interface ChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
}
```

---

## 7. Debounce para Search

```typescript
// src/hooks/useDebounce.ts
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  
  return debouncedValue;
}

// Uso: 300ms debounce para search input
const debouncedQuery = useDebounce(searchQuery, 300);
```

---

## 8. Infinite Scroll (Catalog)

```typescript
// Patrón: Intersection Observer + useFetch
// 1. Cargar página 1
// 2. Cuando usuario llega al bottom (Intersection Observer)
// 3. Cargar página siguiente
// 4. Append items al estado local
// 5. Repetir hasta que no haya más páginas (total items cargados >= total)
```

---

## 9. Player (Episode Page)

```typescript
// Episode page usa iframe para embeber
//src/pages/Episode.tsx

// Preferir servers en orden:
// 1. HLS (mejor calidad, adaptive)
// 2. UPNShare
// 3. Mega
// 4. MP4Upload

// Mostrar selector DUB/SUB
// Variants.DUB === 1 → Dub disponible
// Variants.SUB === 1 → Sub disponible
```

### Iframe Handling

```typescript
// Sanitizar URLs de embed antes de usar
// NO ejecutar scripts externos manualmente
// Usar iframe con sandbox="allow-scripts allow-same-origin"
```

---

## 10. Chapter Reader (Manga)

```typescript
// src/pages/ChapterReader.tsx

// Vertical page display con lazy loading
// Cada página es un <img> que se carga on-demand
// El componente mantiene track de:
// - imageErrors: Set<number> para imágenes que fallaron
// - visiblePages: Set<number> para saber cuáles cargaron
// - showBackToTop: boolean para mostrar botón después de scroll 300px
```

### Fullscreen Mode

```typescript
// Toggle: floating button (bottom-right) o tecla F
// Estado: isFullscreen (boolean) basado en document.fullscreenElement

// Immersive reading:
// - fullscreenWrapper usa :fullscreen pseudo-class
// - Fondo negro (#000), padding 0
// - pageImage ocupa 100vw con border-radius 0
// - pageNumber oculto en fullscreen

// Scroll position preservation:
// - findMostVisibleImage(): busca la imagen más cercana al centro del viewport
// - currentImageRef: guarda referencia a la imagen actualmente visible
// - En fullscreenchange event: scroll a la imagen guardada usando scrollIntoView
// - Evita guardar pixel positions (se invalidan tras re-render)
```

### Version Selector

```typescript
// Muchos capítulos tienen múltiples scanlators
// buildUniqueChapterList(): deduplica por chapter.number
// currentChapter.versions: ChapterVersion[]
// Select component para cambiar entre versiones
// Navega a /manga/:id/chapter/:newHash
```

### Chapter Navigation

```typescript
// prevChapter / nextChapter basado en uniqueChapters array
// Links a /manga/:id/chapter/:hash
// Renderizado en top (Container) y bottom (en ambos modos)
// En fullscreen: bottomNavFullscreen (width auto, max-width 800px)
```

### Key CSS Classes (ChapterReader.module.css)

| Class | Purpose |
|-------|---------|
| `.fullscreenWrapper` | Container que recibe :fullscreen styles |
| `.fullscreenButton` | Floating button, position fixed bottom-right |
| `.imageStack` | Flex column, centered, gap-sm |
| `.pageWrapper` | position relative, text-align center |
| `.pageImage` | max-width 100%, auto height, border-radius |
| `.pageNumber` | Absolute bottom-right, bg rgba(0,0,0,0.75) |
| `.bottomNav` | margin-top 2xl, border-top, max-width container |
| `.bottomNavFullscreen` | margin-lg auto, max-width 800px |
| `.backToTop` | Fixed, bottom-(lg+48px), right-lg, 48x48px |

---

## 11. Filtros del Catálogo

### Query Params de Filtro

| Filter | Param | Example |
|--------|-------|---------|
| Página | `page` | `?page=2` |
| Letra | `letter` | `?letter=A` |
| Género | `genre` | `?genre=accion` (slug español) |
| Tipo | `type` | `?type=tv-anime` |
| Año | `year` | `?year=2024` |
| Estado | `status` | `?status=airing` |

### Chips de Filtro

- **Géneros**: Los géneros vienen de la API en `anime.genres[].slug` y `anime.genres[].name`
- **Tipos**: "tv-anime", "ova", "película", "especial"
- **Estados**: "airing", "finished"
- **Letras**: A-Z + "#" (para números)

---

## 12. Estilos CSS

### Variables CSS

```css
:root {
  --color-bg: #0a0a0a;
  --color-surface: #141414;
  --color-border: #262626;
  --color-text: #fafafa;
  --color-text-muted: #a1a1aa;
  --color-primary: #6366f1;
  --color-primary-hover: #4f46e5;
  --radius-sm: 4px;
  --radius-md: 8px;
  --radius-lg: 12px;
}
```

### Filosofía Minimalista

- Fondo oscuro (#0a0a0a)
- Espaciado generoso
- Cards limpios sin sombras excesivas
- Tipografía clara (sans-serif del sistema)
- Focus en el contenido (poster + título)

---

## 13. Errores y Edge Cases

### Manejo de Errores

```typescript
// useFetch retorna { data, loading, error }
// Mostrar mensaje de error apropiado:
// - 404: "Anime no encontrado"
// - 500: "Error del servidor, intenta más tarde"
// - Network error: "Sin conexión"
```

### Estados Vacíos

```typescript
// Sin resultados de búsqueda: "No se encontraron resultados para '{query}'"
// Sin favoritos: "Aún no tienes animes favoritos"
```

---

## 14. Conventions

### Nombres

- **Components**: PascalCase (`AnimeCard.tsx`)
- **Hooks**: camelCase con prefijo `use` (`useFetch.ts`)
- **Types**: PascalCase (`CatalogItem`)
- **CSS Modules**: same name `.module.css`

### Imports

```typescript
// Relative imports para co-located files
import { Card } from '../components/ui/Card';

// Absolute-style desde src/ para imports globales
import { useFavoritesStore } from '../store/favoritesStore';
```

### No Tailwind

- **Motivo**: Minimalismo UI, CSS vanilla con variables es suficiente
- **Components**: CSS Modules
- **Globales**: `src/styles/globals.css` con CSS custom properties

---

## 15. Roadmap de Mejoras y Bugs

### TABLA A: BUGS CRÍTICOS Y PROBLEMAS

| # | Bug/Problema | Impacto (1-10) | Esfuerzo (1-10) | Costo (1-10) | Score (I×E×C) | Archivo(s) Afectado(s) |
|---|--------------|----------------|-----------------|--------------|----------------|------------------------|
| 1 | Duplicación de tipo `AnimeDetail` - dos interfaces en `src/types/api.ts` (líneas 25-44 y 67-85). La segunda tiene `relations: Relation[]` que la primera no. TypeScript mergea o toma la segunda, causando inconsistencias. | 8 | 2 | 1 | 16 | `src/types/api.ts` |
| 2 | Guest mode sin persistencia - Los stores de Zustand no usan `persist` middleware. Un usuario guest pierde favoritos, episodios vistos y capítulos leídos al recargar la página. | 9 | 5 | 2 | 90 | `src/store/*` |
| 3 | `offlineQueue.ts` flushea sin token de Clerk - Usa `getSupabase()` que retorna cliente anónimo SIN JWT. Las operaciones offline se reintentan sin autenticación, fallan con RLS 100% de las veces. | 8 | 4 | 2 | 64 | `src/lib/offlineQueue.ts` |
| 4 | `batchQueue.ts` - `beforeunload` con async `flush()` - El navegador no espera la promesa, se pierden writes pendientes al cerrar la pestaña. | 6 | 2 | 1 | 12 | `src/lib/batchQueue.ts` |
| 5 | `hasHydrated.current` nunca se resetea en logout - En `App.tsx`, una vez que `hasHydrated.current = true`, nunca vuelve a `false`. Si el usuario hace logout y login con otra cuenta, NO se re-hidratan los stores. | 6 | 2 | 1 | 12 | `src/App.tsx` |
| 6 | `useFetchRetry` rompe URLs con query params - Si `retryUrl` ya tiene `?`, la URL queda inválida (`?foo=bar?retry=1`). Ignora el parámetro `_retries`. | 5 | 2 | 1 | 10 | `src/hooks/useFetchRetry.ts` |
| 7 | Global state pollution en TV Navigation - `useTVNavigation` y `Focusable` usan `(window as any).__tvFocusedId` y eventos globales en `window`. Solución arcaica que rompe encapsulamiento. | 5 | 5 | 2 | 50 | `src/hooks/useTVNavigation.ts`, `src/components/ui/Focusable.tsx` |
| 8 | Inconsistencia en fetching patterns - `AnimeDetail` y `Episode` usan `useFetch`, pero `MangaDetail` usa `useState + useEffect + llamada directa`. `MangaLibrary` usa `useMangaLibrary` que también usa `useState + useEffect`. | 6 | 4 | 1 | 24 | `src/pages/MangaDetail.tsx`, `src/hooks/useMangaLibrary.ts` |
| 9 | `useInfiniteScroll.ts` - código muerto - Existe pero no se usa en ninguna página. Tanto Home como MangaLibrary usan paginación tradicional. | 2 | 1 | 1 | 2 | `src/hooks/useInfiniteScroll.ts` |
| 10 | `PlayerControls.tsx` - componente huérfano - Existe pero `VideoPlayer.tsx` tiene controles inline. Nunca se importa. | 2 | 1 | 1 | 2 | `src/components/ui/PlayerControls.tsx` |
| 11 | HTML ID collisions - `Select.tsx` y `Input.tsx` usan fallback `'select'` e `'input'` como IDs. Si hay múltiples instancias en la misma página, se viola la unicidad de IDs en HTML. | 5 | 2 | 1 | 10 | `src/components/ui/Select.tsx`, `src/components/ui/Input.tsx` |
| 12 | No hay Error Boundaries - Cualquier throw en un componente hijo rompe TODA la app. No hay `componentDidCatch` ni `react-error-boundary`. | 8 | 4 | 2 | 64 | `src/App.tsx` |
| 13 | CERO tests - No hay archivos `.test.ts` ni `.spec.ts`. Nada de unit tests, integration tests ni e2e. | 9 | 7 | 3 | 189 | Todo el proyecto |
| 14 | `AGENTS.md` desactualizado - El documento de arquitectura describe tipos que no coinciden con el código real. | 5 | 2 | 1 | 10 | `AGENTS.md` |
| 15 | Supabase migrations duplicadas - `20250521_create_user_preferences.sql` y `20250521_user_preferences.sql` hacen lo mismo. | 3 | 1 | 1 | 3 | `supabase/migrations/` |
| 16 | `MangaCard.tsx` no usa `Focusable` - `Card.tsx` sí usa `Focusable` para TV nav, pero `MangaCard.tsx` usa `Link` directo. Inconsistente. | 3 | 2 | 1 | 6 | `src/components/ui/MangaCard.tsx` |
| 17 | `EasterEgg.tsx` - dependencia vacía en useEffect - El linter con `strict: true` debería quejarse del ref pattern. | 2 | 1 | 1 | 2 | `src/components/ui/EasterEgg.tsx` |
| 18 | `handleImageLoad` no-op en `ChapterReader.tsx` - La función está definida pero solo tiene un comentario. No hace nada. | 2 | 1 | 1 | 2 | `src/pages/ChapterReader.tsx` |

### TABLA B: MEJORAS Y NUEVAS FUNCIONALIDADES

| # | Mejora/Funcionalidad | Impacto (1-10) | Esfuerzo (1-10) | Costo (1-10) | Score (I×E×C) | Categoría |
|---|----------------------|----------------|-----------------|--------------|----------------|-----------|
| 1 | Persistencia local para guests - Implementar localStorage adapters para favoritos, watched y read chapters, o usar `zustand/persist` como fallback. | 9 | 5 | 2 | 90 | UX/Arquitectura |
| 2 | Scroll restoration - Guardar y restaurar scroll position entre navegación de páginas. | 5 | 2 | 1 | 10 | UX |
| 3 | Skeleton loaders consistentes - Algunas pages usan skeletons custom, otras no. Unificar. | 5 | 2 | 1 | 10 | UX |
| 4 | Indicador de progreso de lectura - Mostrar "Cap. 5 de 120" o progress bar en MangaDetail. | 6 | 2 | 1 | 12 | UX |
| 5 | Autoplay preference - Respetar `prefers-reduced-motion` o guardar preferencia de autoplay. | 3 | 2 | 1 | 6 | UX/Accesibilidad |
| 6 | Search params sincronizados - Home debería leer `?search=` del URL para que la búsqueda sobreviva a F5. | 5 | 2 | 1 | 10 | UX |
| 7 | Unificar fetching pattern - Todo debe usar `useFetch` o un hook consistente. MangaDetail y MangaLibrary deben migrar. | 7 | 4 | 1 | 28 | Arquitectura |
| 8 | Eliminar global state de TV nav - Reemplazar `window.__tvFocusedId` con un store de Zustand o React Context dedicado. | 5 | 5 | 2 | 50 | Arquitectura |
| 9 | Fix offlineQueue - Pasar el token de Clerk o el `mutationFn` completo a la cola, no usar `getSupabase()` anónimo. | 8 | 4 | 2 | 64 | Arquitectura/Bugfix |
| 10 | Fix batchQueue beforeunload - Usar `navigator.sendBeacon` o `Blob`+`sendBeacon` para flush síncrono. | 6 | 2 | 1 | 12 | Arquitectura/Bugfix |
| 11 | Barrel exports (`index.ts`) - Agregar en `components/`, `hooks/`, `utils/` para limpiar imports. | 3 | 2 | 1 | 6 | Arquitectura |
| 12 | Eliminar dead code - `useInfiniteScroll.ts`, `PlayerControls.tsx` si no se usan. | 2 | 1 | 1 | 2 | Arquitectura |
| 13 | Deduplicar `AnimeDetail` type - Unificar las dos interfaces en uno solo. | 8 | 2 | 1 | 16 | Arquitectura/Bugfix |
| 14 | Reset `hasHydrated` en logout - Escuchar cambios de auth y resetear el ref. | 6 | 2 | 1 | 12 | Arquitectura/Bugfix |
| 15 | Error Boundaries - Agregar al menos uno en el nivel de App y uno por dominio. | 8 | 4 | 2 | 64 | Arquitectura |
| 16 | ID únicos para inputs/selects - Usar `useId()` de React 18 o `crypto.randomUUID()`. | 5 | 2 | 1 | 10 | Arquitectura/Accesibilidad |
| 17 | Historial de episodios recientes - Widget en Home con "Continuar viendo". | 8 | 5 | 2 | 80 | Nueva Funcionalidad |
| 18 | Lista de "Seguir leyendo" - Similar para manga, basado en capítulos leídos. | 8 | 5 | 2 | 80 | Nueva Funcionalidad |
| 19 | Notificaciones de nuevos episodios/capítulos - Polling o push. | 8 | 8 | 4 | 256 | Nueva Funcionalidad |
| 20 | PWA / Service Worker - Offline browsing de catálogo cacheado. | 6 | 8 | 3 | 144 | Nueva Funcionalidad |
| 21 | Comentarios/reviews - Integrar con backend si existe. | 5 | 8 | 3 | 120 | Nueva Funcionalidad |
| 22 | Modo oscuro/claro toggle - Aunque ya es oscuro por defecto. | 3 | 2 | 1 | 6 | Nueva Funcionalidad |
| 23 | React.memo en listados - `Card`, `MangaCard`, `ChapterList` deben memoizarse. | 5 | 2 | 1 | 10 | Performance |
| 24 | Virtual scrolling para listas grandes - Si un manga tiene 500+ capítulos. | 7 | 5 | 2 | 70 | Performance |
| 25 | Prefetch de rutas - Prefetch `anime/:slug` al hacer hover en cards. | 5 | 3 | 1 | 15 | Performance |
| 26 | Lazy load de pages - `React.lazy()` para MangaLibrary, ChapterReader, etc. | 6 | 3 | 1 | 18 | Performance |
| 27 | Optimización de imágenes - Usar `srcset` o un proxy de thumbnails. | 5 | 4 | 2 | 40 | Performance |
| 28 | Debounce en búsqueda de manga vía URL - Evitar navigate en cada keystroke. | 4 | 2 | 1 | 8 | Performance |
| 29 | Skip links - "Saltar al contenido" para screen readers. | 7 | 2 | 1 | 14 | Accesibilidad |
| 30 | ARIA live regions - Anunciar cambios de filtros y resultados. | 5 | 3 | 1 | 15 | Accesibilidad |
| 31 | Focus trap en modales - EasterEgg no tiene focus trap. | 5 | 3 | 1 | 15 | Accesibilidad |
| 32 | Color contrast audit - Verificar ratios WCAG AA en badges y chips. | 5 | 3 | 1 | 15 | Accesibilidad |
| 33 | Lang attribute - `<html lang="es">` está probablemente ausente. | 3 | 1 | 1 | 3 | Accesibilidad |
| 34 | Unit tests para stores - Zustand es fácil de testear sin React. | 8 | 5 | 2 | 80 | Testing |
| 35 | Tests para adapters - Mock de localStorage y Supabase. | 7 | 5 | 2 | 70 | Testing |
| 36 | Tests para hooks - `useFetch`, `useDebounce`, `useInfiniteScroll`. | 6 | 4 | 2 | 48 | Testing |
| 37 | Component tests - Renderizado, interacciones, estados de error. | 8 | 7 | 3 | 168 | Testing |
| 38 | E2E con Playwright - Flujos críticos: login, ver episodio, leer manga. | 8 | 8 | 3 | 192 | Testing |

---

## 16. Cómo interpretar el Score

El score de cada ítem se calcula como: **`Impacto × Esfuerzo × Costo`**.

Cada dimensión se evalúa en una escala de 1 a 10:

- **Impacto**: Qué tanto mejora la experiencia del usuario o reduce riesgo técnico. Un 10 significa un cambio transformador o crítico; un 1 es marginal.
- **Esferzo**: Cuánto trabajo requiere implementar. Un 10 es complejo (semanas, refactor profundo); un 1 es trivial (minutos, cambio localizado).
- **Costo**: Recursos adicionales necesarios — tiempo de equipo, dependencias nuevas, infraestructura, licencias. Un 10 requiere inversión significativa; un 1 es gratuito.

**Regla general**: Items con **score > 50** son candidatos prioritarios. Representan el mayor retorno de inversión (ROI): alto impacto con esfuerzo y costo razonables. Items con score < 20 son quick wins que se pueden hacer entre tareas mayores.
