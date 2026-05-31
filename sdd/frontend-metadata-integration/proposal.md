# Proposal: Backend Metadata & Image Integration

## Intent
Consume new AniList/Jikan enriched fields from the backend to improve image quality and metadata richness on anime and manga detail pages, while maintaining full backward compatibility.

## Scope

### In Scope
- Extend types with optional `images`, `jikan`, `anilist` fields
- Create image resolution helpers with cascading fallbacks
- Upgrade posters and backdrops on detail pages
- Add Jikan metadata to `InfoGrid`
- Dynamic theming via `anilist.coverImage.color`
- Keep catalog/search untouched (not enriched yet)

### Out of Scope
- Removing legacy `poster`/`backdrop` fields
- Catalog/search enrichment
- Manga Jikan metadata (not provided by backend)

## Capabilities

### New Capabilities
- `image-resolution`: Anime/manga image fallback cascade helpers
- `dynamic-theming`: CSS custom property accent injection from AniList color

### Modified Capabilities
- `anime-detail-display`: Use enriched images and show Jikan metadata
- `manga-detail-display`: Use AniList banner as backdrop

## Approach
Extend types minimally (all optional), create `src/utils/images.ts` with `resolveAnimeImage` and `resolveMangaImage`, update callers to use helpers with appropriate `purpose`, inject `--theme-accent` from `anilist.color` into `DetailHero`.

## Image Resolution Strategy

| Purpose | Anime Cascade | Manga Cascade |
|---------|--------------|---------------|
| Backdrop | `anilist.bannerImage` → `images.scraper.backdrop` → `backdrop` → `poster` | `anilist.bannerImage` → `coverUrl` |
| Poster | `anilist.coverImage.extraLarge` → `large` → `images.scraper.poster` → `images.jikan.jpg.large_image_url` → `poster` | `anilist.coverImage.extraLarge` → `large` → `coverUrl` |
| Card/Thumb | `anilist.coverImage.medium` → `images.jikan.jpg.image_url` → `poster` | `anilist.coverImage.medium` → `coverUrl` |

## Type Changes
Add optional fields to `CatalogItem`, `AnimeDetail` (`src/types/api.ts`): `images?: { scraper?, jikan?, anilist? }`, `jikan?: { studios?, themes?, demographics?, rank?, popularity?, members?, favorites? }`, `anilist?: { bannerImage?, coverImage?, color? }`.

Add optional `anilist?: { bannerImage?, coverImage?, color? }` to `MangaItem`, `MangaDetail` (`src/types/manga.ts`).

## Component Changes

| File | Change |
|------|--------|
| `src/utils/images.ts` | NEW: `resolveAnimeImage`, `resolveMangaImage` |
| `src/types/api.ts` | Add optional enriched fields |
| `src/types/manga.ts` | Add optional `anilist` |
| `Card.tsx` | Use `resolveAnimeImage(anime, 'poster')` |
| `MangaCard.tsx` | Use `resolveMangaImage(manga, 'poster')` |
| `AnimeDetail.tsx` | Resolved images to `DetailHero`; Jikan metadata to `InfoGrid`; pass `themeColor` |
| `MangaDetail.tsx` | Resolved backdrop to `DetailHero`; pass `themeColor` |
| `Home.tsx` | Resolved backdrop for featured `HeroSection` |
| `DetailHero.tsx` | Accept `themeColor?`; inject `--theme-accent` CSS var |

## Dynamic Theming
`DetailHero` receives `themeColor?: string`. If present, sets `style={{ '--theme-accent': themeColor }}` on root element. CSS uses `var(--theme-accent, var(--color-primary))` for genre chips, score badge border, and status badge background. Fallback to existing primary if absent.

## Metadata Display
`AnimeDetail` adds to `InfoGrid`: **Studios** (`jikan.studios?.join(', ')`), **Rank** (`#${jikan.rank}`), **Popularidad** (`#${jikan.popularity}`), **Miembros** (`jikan.members?.toLocaleString()`), **Favoritos** (`jikan.favorites?.toLocaleString()`). Only shown when field present.

## Migration Strategy
All type extensions are optional. Helpers always fall back to original fields. Components can be updated incrementally. Runtime behavior identical to today when backend omits enriched data.

## Risks

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| AniList banner ~5:1 crops awkwardly | Med | Test mobile; adjust `object-position` |
| AniList CORS blocked | Low | Monitor; proxy if needed |
| `anilist.color` contrast issues | Med | Use at low opacity (10% bg, borders) |
| Large images slow loading | Med | Use `large`/`medium`, not `extraLarge`, for cards |

## Rollback Plan
All changes are additive. Revert: delete `src/utils/images.ts`, replace helper calls with direct field access, remove `themeColor` prop from `DetailHero`, remove optional type fields. Zero breaking changes in either direction.

## Dependencies
- Backend returning enriched fields on detail endpoints (confirmed)

## Success Criteria
- [ ] `AnimeDetail` uses AniList cover/banner when available
- [ ] `MangaDetail` uses AniList banner as backdrop
- [ ] `InfoGrid` shows Jikan metadata when present
- [ ] Genre chips/badges use `anilist.color` accent
- [ ] Graceful fallback to original fields when enriched data missing
- [ ] Catalog/search unchanged
