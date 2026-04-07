# AnimeAV1 Frontend — AGENTS.md

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
│   └── episode.ts         # /episode/:slug/:number
├── components/            # Shared UI components
│   ├── ui/               # Atoms: Button, Input, Card, Chip
│   └── layout/            # Header, Footer, Container
├── pages/                 # Route pages
│   ├── Home.tsx          # Catalog + filters
│   ├── AnimeDetail.tsx   # Anime info
│   ├── Episode.tsx       # Player
│   └── NotFound.tsx
├── hooks/                 # Custom hooks
│   ├── useFetch.ts       # Generic fetch with loading/error
│   ├── useDebounce.ts    # Debounce utility
│   └── useFavorites.ts   # localStorage favorites
├── store/                 # Zustand stores
│   └── favoritesStore.ts # Favorites with localStorage sync
├── types/                 # TypeScript interfaces
│   └── api.ts            # API response types
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

---

## 4. Routing

```typescript
// App routes
/                    → Home (catalog)
/anime/:slug         → AnimeDetail
/episode/:slug/:num  → Episode (player)
/search?q=           → Search results (query param, no separate route)
```

```typescript
// React Router v6
<Routes>
  <Route path="/" element={<Home />} />
  <Route path="/anime/:slug" element={<AnimeDetail />} />
  <Route path="/episode/:slug/:number" element={<Episode />} />
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

---

## 6. UI Components

### Atomic Design Structure

```
components/
├── ui/
│   ├── Button.tsx         # Variants: primary, ghost
│   ├── Input.tsx          # Search input
│   ├── Card.tsx           # Anime card
│   ├── Chip.tsx           # Filter chip (genre, type, etc)
│   ├── Badge.tsx          # Status badges
│   ├── Skeleton.tsx       # Loading skeleton
│   └── Select.tsx         # Dropdown select
└── layout/
    ├── Header.tsx         # Logo + search
    ├── Container.tsx      # Max-width wrapper
    └── Grid.tsx           # Responsive grid
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

## 10. Filtros del Catálogo

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

## 11. Estilos CSS

### Variables CSS

```css
:root {
  --color-bg: #0a0a0a;
  --color-surface: #141414;
  --color-border: #262626;
  --color-text: #fafafa;
  --color-text-muted: #a1a1a1;
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

## 12. Errores y Edge Cases

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

## 13. Conventions

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
