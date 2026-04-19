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

export async function getMangaDetail(id: number): Promise<MangaDetail> {
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
  id: number;
  title: string;
  type: string;
  coverUrl: string;
  latestUpdate: string;
  rating: number;
  ratingCount: number;
  isEro: boolean;
  url: string;
}
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
import { persist } from 'zustand/middleware';

interface FavoritesStore {
  favorites: number[];  // anime IDs
  addFavorite: (id: number) => void;
  removeFavorite: (id: number) => void;
  isFavorite: (id: number) => boolean;
}

export const useFavoritesStore = create<FavoritesStore>()(
  persist(
    (set, get) => ({
      favorites: [],
      addFavorite: (id) => set((s) => ({ favorites: [...s.favorites, id] })),
      removeFavorite: (id) => set((s) => ({ 
        favorites: s.favorites.filter((f) => f !== id) 
      })),
      isFavorite: (id) => get().favorites.includes(id),
    }),
    { name: 'animeav1-favorites' }
  )
);
```

### Manga Favorites Store

```typescript
// src/store/mangaFavoritesStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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

export const useMangaFavoritesStore = create<MangaFavoritesStore>()(
  persist(
    (set, get) => ({
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
    }),
    { name: 'animeav1-manga-favorites' }
  )
);
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
