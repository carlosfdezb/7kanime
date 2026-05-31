## Exploration: Frontend Metadata & Image Integration

### Current State

**Anime types (`src/types/api.ts`)** define flat image fields:
- `CatalogItem.poster: string` — single poster URL
- `AnimeDetail.poster: string`, `backdrop: string`, `trailer: string | null` — single URLs each
- **No** `images`, `jikan`, or `anilist` fields exist anywhere

**Manga types (`src/types/manga.ts`)** define:
- `MangaItem.coverUrl: string` — single cover URL
- `MangaDetail` extends `MangaItem` with description, author, genres, chapters
- **No** `anilist` or `images` fields

**Image usage patterns:**
- `Card.tsx` → `anime.poster` (2:3 aspect ratio, lazy loaded, skeleton + error placeholder)
- `MangaCard.tsx` → `manga.coverUrl` (identical pattern)
- `DetailHero.tsx` → `posterSrc` (2:3, 280px wide) + `backdropSrc` (full-width background, 40% opacity + gradient overlay)
- `HeroSection.tsx` → `backdrop` (full-width background, same overlay pattern)
- `ContinueCard.tsx` → `poster` (80x120px thumbnail)
- `MangaDetail.tsx` → uses `manga.coverUrl` for **both** poster and backdrop (repeats the same image)

**Metadata display patterns:**
- `InfoGrid.tsx` — generic grid of `{ label, value }` pairs; used in AnimeDetail (status, type, episodes, score) and MangaDetail (status, type, chapters, author, demographics, rating)
- `DetailHero.tsx` — shows badges for status, type, year, count, score; genre chips
- **No** display of studios, themes, rank, popularity, members, staff, or characters

### Affected Areas

| File | Why Affected |
|------|-------------|
| `src/types/api.ts` | Missing `images`, `jikan`, `anilist` fields on `CatalogItem` and `AnimeDetail` |
| `src/types/manga.ts` | Missing `anilist`/`images` fields on `MangaItem`/`MangaDetail` |
| `src/api/anime.ts` | Types will change; no mapper currently (raw API response → `AnimeDetail`) |
| `src/api/catalog.ts` | Types will change; `CatalogResponse.items` may now include richer data |
| `src/api/manga.ts` | Backend manga detail may return `anilist`; current `mapBackendDetail` would drop it |
| `src/components/ui/Card.tsx` | Uses `anime.poster` directly; needs image resolution strategy |
| `src/components/ui/MangaCard.tsx` | Uses `manga.coverUrl` directly; needs image resolution strategy |
| `src/components/ui/DetailHero.tsx` | Uses `posterSrc` + `backdropSrc`; should accept AniList banner |
| `src/components/ui/HeroSection.tsx` | Uses `backdrop` string; data source in Home.tsx needs updating |
| `src/components/ui/InfoGrid.tsx` | Generic enough; just needs more items passed in |
| `src/components/ui/ContinueCard.tsx` | Uses `poster` string; should use best available image |
| `src/pages/AnimeDetail.tsx` | Wires `poster`/`backdrop` to `DetailHero`; should add new metadata to `InfoGrid` |
| `src/pages/MangaDetail.tsx` | Reuses `coverUrl` for poster+backdrop; needs AniList banner separation |
| `src/pages/Home.tsx` | Featured hero uses `items[0].poster` as backdrop; should use banner |

### Approaches

#### 1. Minimal Type Extension (extend existing types)
Add optional `images`, `jikan`, `anilist` fields to existing types. Keep `poster`/`backdrop` as fallbacks.

```typescript
interface AnimeImages {
  scraper: { poster?: string; backdrop?: string };
  jikan: { jpg?: { image_url?: string; large_image_url?: string } };
  anilist: { bannerImage?: string; coverImage?: { extraLarge?: string; large?: string; medium?: string }; color?: string };
}

interface AnimeDetail {
  // ...existing fields...
  images?: AnimeImages;
  jikan?: { studios?: string[]; themes?: string[]; rank?: number; popularity?: number; members?: number; };
  anilist?: { bannerImage?: string; coverImage?: { extraLarge?: string; large?: string; medium?: string }; color?: string };
}
```

- **Pros**: Backward compatible; existing code keeps working; gradual migration
- **Cons**: Types become messier over time; `poster`/`backdrop` may conflict with `images.*` sources
- **Effort**: Low

#### 2. Unified Image Resolution Helper (recommended)
Create a `resolveImage(anime, purpose)` utility that returns the best available URL with cascading fallbacks.

```typescript
// src/utils/images.ts
export type ImagePurpose = 'poster' | 'backdrop' | 'thumbnail' | 'card';

export function resolveAnimeImage(
  anime: CatalogItem | AnimeDetail,
  purpose: ImagePurpose
): string {
  const images = (anime as any).images;
  if (!images) return anime.poster;
  
  switch (purpose) {
    case 'backdrop':
      return images.anilist?.bannerImage 
        || images.scraper?.backdrop 
        || anime.backdrop 
        || anime.poster;
    case 'poster':
      return images.anilist?.coverImage?.extraLarge
        || images.jikan?.jpg?.large_image_url
        || images.scraper?.poster
        || anime.poster;
    case 'thumbnail':
      return images.anilist?.coverImage?.medium
        || images.jikan?.jpg?.image_url
        || anime.poster;
    default:
      return anime.poster;
  }
}
```

Update components to call `resolveAnimeImage(anime, 'backdrop')` instead of `anime.backdrop`.

- **Pros**: Single source of truth for image resolution; easy to adjust priorities; components stay clean
- **Cons**: Requires updating every component that reads images; runtime overhead is negligible
- **Effort**: Medium

#### 3. Full Type Refactor (replace flat fields with nested)
Remove `poster`/`backdrop` from types entirely; use only `images.*` paths. Update all components at once.

- **Pros**: Clean, consistent types; no duplication or ambiguity
- **Cons**: Massive blast radius; breaks every component simultaneously; harder to rollback
- **Effort**: High

### Recommendation

**Approach 2 (Unified Image Resolution Helper) with Approach 1 (Minimal Type Extension)**.

Steps:
1. Add optional `images`, `jikan`, `anilist` fields to `CatalogItem`, `AnimeDetail`, and `MangaDetail`
2. Create `src/utils/images.ts` with `resolveAnimeImage()` and `resolveMangaImage()` helpers
3. Update components to use the helpers with appropriate `purpose` values:
   - `Card` → `resolveAnimeImage(anime, 'poster')`
   - `DetailHero` → `resolveAnimeImage(anime, 'backdrop')` for backdrop
   - `HeroSection` → `resolveAnimeImage(featured, 'backdrop')`
   - `MangaDetail` → `resolveMangaImage(manga, 'backdrop')` for backdrop (separate from poster)
4. Add new metadata to `InfoGrid` in `AnimeDetail` (studios, rank, popularity, members)
5. Keep old `poster`/`backdrop` fields as runtime fallbacks within the helper

### Risks

- **Backend contract uncertainty**: If the backend response shape differs from what we type, the helpers will silently fall back to old images. Need to verify actual API response.
- **AniList banner aspect ratio**: AniList banners are typically wide (~5:1). The current `DetailHero` and `HeroSection` use 70vh height with `object-fit: cover`, which may crop banners awkwardly. May need CSS adjustment.
- **Performance**: AniList extraLarge covers can be very large. The helper should prefer `large` or `medium` for thumbnails/cards.
- **Manga backend compatibility**: `src/api/manga.ts` already has backend mappers. If the backend starts returning `anilist` in `BackendMangaDetail`, the mapper will drop it unless updated.
- **Color field usage**: `anilist.color` (hex string) could be used for dynamic theming (genre chips, badges), but this adds UI complexity not requested.

### Ready for Proposal

**Yes.** The orchestrator should tell the user:

1. We need to confirm the **exact shape** of the new backend responses (especially for catalog/search vs detail endpoints — does the backend send enriched data on catalog, or only on detail?)
2. We need to decide if `CatalogItem` gets enriched images, or only `AnimeDetail`
3. We need to decide if we want to use `anilist.color` for any dynamic UI theming
4. The `MangaDetail` page currently reuses `coverUrl` for both poster and backdrop; the AniList banner will be a significant visual upgrade there
5. We should verify that AniList banner images have appropriate CORS headers for direct browser loading (or if they need proxying like manga images do)

### Component Inventory: Image & Metadata Display

| Component | Displays Images | Displays Metadata | Notes |
|-----------|----------------|-------------------|-------|
| `Card.tsx` | `anime.poster` (2:3) | type, score*, status* | *Cast from `any` since `CatalogItem` lacks them |
| `MangaCard.tsx` | `manga.coverUrl` (2:3) | type, rating | |
| `DetailHero.tsx` | `posterSrc` (2:3) + `backdropSrc` (full) | status, type, year, count, score, genres | Generic; used by both anime and manga |
| `HeroSection.tsx` | `backdrop` (full) | badge, meta, title, synopsis | Used on Home for featured anime |
| `ContinueCard.tsx` | `poster` (80x120) | title, episode/chapter, progress | |
| `InfoGrid.tsx` | — | label/value pairs | Used by both anime and manga detail |
| `AnimeDetail.tsx` | (delegates to DetailHero) | status, type, episodes, score | Also shows synopsis, episodes, relations |
| `MangaDetail.tsx` | (delegates to DetailHero) | status, type, chapters, author, demographics, rating | Also shows synopsis, chapters, progress |
| `Home.tsx` | (delegates to Card, HeroSection) | — | Featured uses `items[0].poster` as backdrop |

### Current Type Definitions vs Backend Response

**CatalogItem / SearchResult (current frontend):**
```typescript
interface CatalogItem {
  id: number;
  title: string;
  slug: string;
  poster: string;
  type: string;
  typeSlug: string;
  synopsis: string;
}
```

**Expected backend enrichment (needs verification):**
```typescript
// Hypothetical — needs confirmation from backend
interface CatalogItem {
  // ...existing...
  images?: {
    scraper?: { poster?: string; backdrop?: string };
    jikan?: { jpg?: { image_url?: string; large_image_url?: string } };
    anilist?: { bannerImage?: string; coverImage?: { extraLarge?: string; large?: string; medium?: string } };
  };
  jikan?: { studios?: string[]; themes?: string[]; rank?: number; popularity?: number; members?: number };
  anilist?: { bannerImage?: string; coverImage?: { extraLarge?: string; large?: string; medium?: string }; color?: string };
}
```

**AnimeDetail (current frontend):**
```typescript
interface AnimeDetail {
  // ...
  poster: string;
  backdrop: string;
  trailer: string | null;
  score: number;
  votes: number;
  // NO images, jikan, or anilist fields
}
```

**MangaDetail (current frontend):**
```typescript
interface MangaDetail extends MangaItem {
  description: string;
  author: string | null;
  artist: string | null;
  status: string;
  demographics: string[];
  genres: string[];
  chapters: MangaChapter[];
  // NO images or anilist fields
}
```

### CSS Image Handling Patterns

| File | Pattern | Notes |
|------|---------|-------|
| `Card.module.css` | `object-fit: cover` on 2:3 aspect-ratio container | `loading="lazy"` on `<img>` |
| `DetailHero.module.css` | Backdrop: `object-fit: cover`, 40% opacity + gradient overlay | No lazy loading (eager) |
| `HeroSection.module.css` | Backdrop: `object-fit: cover` + gradient overlay | Eager loading |
| `ContinueCard.module.css` | `object-fit: cover` on fixed 80x120 container | `loading="lazy"` |
| `MangaCard.module.css` | Same as Card.module.css | |

### Files That Need Modification (ordered by dependency)

1. **`src/types/api.ts`** — Add `images`, `jikan`, `anilist` fields to `CatalogItem` and `AnimeDetail`
2. **`src/types/manga.ts`** — Add `images`/`anilist` fields to `MangaItem`/`MangaDetail`
3. **`src/utils/images.ts`** — NEW: Image resolution helpers
4. **`src/components/ui/Card.tsx`** — Use `resolveAnimeImage(anime, 'poster')`
5. **`src/components/ui/MangaCard.tsx`** — Use `resolveMangaImage(manga, 'poster')`
6. **`src/components/ui/ContinueCard.tsx`** — Use image helper (if anime data available)
7. **`src/components/ui/DetailHero.tsx`** — No changes needed (accepts strings), but caller changes
8. **`src/pages/AnimeDetail.tsx`** — Wire new fields to DetailHero and InfoGrid
9. **`src/pages/MangaDetail.tsx`** — Separate poster from backdrop; add new metadata
10. **`src/pages/Home.tsx`** — Use banner for featured hero backdrop
11. **`src/api/manga.ts`** — Update `mapBackendDetail` to preserve new fields if backend sends them
