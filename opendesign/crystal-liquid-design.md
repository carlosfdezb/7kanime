# Crystal Liquid Design System
## Premium Anime Streaming Platform — Apple TV+ Inspired

### Philosophy
Dark, immersive, premium. The interface should feel like liquid glass — translucent layers floating over deep, rich content. Every surface has depth. Light refracts through the UI. The content (anime posters, backdrops) is the hero, never competing with chrome.

### Color Palette

The design system supports **Light** and **Dark** themes via CSS custom properties scoped to `[data-theme="light"]` and `[data-theme="dark"]` on the `<html>` element. The default follows `prefers-color-scheme`.

#### Backgrounds
| Token | Dark (default) | Light |
|-------|---------------|-------|
| `--bg-deep` | `#030305` | `#f8f9fc` |
| `--bg-primary` | `#0a0a0f` | `#ffffff` |
| `--bg-secondary` | `#12121a` | `#f1f5f9` |
| `--bg-tertiary` | `#1a1a25` | `#e2e8f0` |
| `--bg-glass` | `rgba(18, 18, 26, 0.72)` | `rgba(255, 255, 255, 0.72)` |
| `--bg-glass-light` | `rgba(255, 255, 255, 0.04)` | `rgba(0, 0, 0, 0.04)` |

#### Surfaces
| Token | Dark | Light |
|-------|------|-------|
| `--surface-1` | `#12121a` | `#f8fafc` |
| `--surface-2` | `#1c1c28` | `#f1f5f9` |
| `--surface-3` | `#252532` | `#e2e8f0` |
| `--surface-glass` | `rgba(28, 28, 40, 0.65)` | `rgba(255, 255, 255, 0.65)` |

#### Text
| Token | Dark | Light |
|-------|------|-------|
| `--text-primary` | `#f0f0f5` | `#0f172a` |
| `--text-secondary` | `#9ca3af` | `#475569` |
| `--text-tertiary` | `#6b7280` | `#94a3b8` |
| `--text-inverse` | `#030305` | `#ffffff` |

#### Accents (Crystal Liquid) — Consistent across themes
- `--accent-primary`: #60a5fa — Crystal blue (primary actions)
- `--accent-primary-glow`: rgba(96, 165, 250, 0.3) — Glow effect
- `--accent-secondary`: #a78bfa — Purple crystal (secondary)
- `--accent-liquid`: #38bdf8 — Liquid cyan (highlights)
- `--accent-rose`: #fb7185 — Rose crystal (favorites, love)

#### Status — Consistent across themes
- `--status-success`: #34d399 — Emerald
- `--status-warning`: #fbbf24 — Amber
- `--status-error`: #f87171 — Red

#### Borders & Dividers
| Token | Dark | Light |
|-------|------|-------|
| `--border-subtle` | `rgba(255, 255, 255, 0.06)` | `rgba(0, 0, 0, 0.08)` |
| `--border-medium` | `rgba(255, 255, 255, 0.1)` | `rgba(0, 0, 0, 0.12)` |
| `--border-glow` | `rgba(96, 165, 250, 0.2)` | `rgba(96, 165, 250, 0.3)` |

### Typography

#### Font Stack
- Display: "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif
- Body: "SF Pro Text", -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif
- Mono: "SF Mono", "JetBrains Mono", ui-monospace, monospace

#### Scale
- Hero title: clamp(2.5rem, 5vw, 4rem), weight 700, line-height 1.1, letter-spacing -0.02em
- Section title: clamp(1.5rem, 3vw, 2.25rem), weight 600, line-height 1.2
- Card title: 1rem (16px), weight 500, line-height 1.3
- Body: 0.9375rem (15px), weight 400, line-height 1.6
- Caption: 0.8125rem (13px), weight 400, line-height 1.5
- Meta: 0.75rem (12px), weight 500, line-height 1.4, uppercase, letter-spacing 0.05em

### Spacing
- Base unit: 4px
- xs: 4px, sm: 8px, md: 16px, lg: 24px, xl: 32px, 2xl: 48px, 3xl: 64px
- Container max-width: 1400px
- Container padding: 24px (mobile), 48px (desktop)

### Glassmorphism
```css
.glass {
  background: rgba(18, 18, 26, 0.72);
  backdrop-filter: blur(24px) saturate(1.4);
  -webkit-backdrop-filter: blur(24px) saturate(1.4);
  border: 1px solid rgba(255, 255, 255, 0.06);
}

.glass-strong {
  background: rgba(28, 28, 40, 0.85);
  backdrop-filter: blur(40px) saturate(1.6);
  -webkit-backdrop-filter: blur(40px) saturate(1.6);
  border: 1px solid rgba(255, 255, 255, 0.08);
}
```

### Theme System

**Default behavior:** The theme respects `prefers-color-scheme` (system preference). Users can override via a toggle that sets `data-theme="light|dark"` on `<html>`.

```css
/* System preference default */
@media (prefers-color-scheme: light) {
  :root:not([data-theme="dark"]) { /* light tokens */ }
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) { /* dark tokens */ }
}

/* Manual override */
[data-theme="light"] { /* light tokens */ }
[data-theme="dark"] { /* dark tokens */ }
```

**Implementation:** All pages link to `styles.css` which contains the full token matrix. The `data-theme` attribute is persisted to `localStorage` and applied before paint to prevent flash.

### Shadows & Glows
- `--shadow-sm`: 0 1px 2px rgba(0, 0, 0, 0.3)
- `--shadow-md`: 0 4px 12px rgba(0, 0, 0, 0.4)
- `--shadow-lg`: 0 8px 24px rgba(0, 0, 0, 0.5)
- `--shadow-glow`: 0 0 24px rgba(96, 165, 250, 0.15)
- `--shadow-glow-strong`: 0 0 40px rgba(96, 165, 250, 0.2)

### Border Radius
- sm: 8px, md: 12px, lg: 16px, xl: 20px, full: 9999px
- Cards: 16px, Buttons: 12px, Inputs: 12px, Pills: 9999px

### Animations
- `--ease-out-expo`: cubic-bezier(0.16, 1, 0.3, 1)
- `--ease-out-quart`: cubic-bezier(0.25, 1, 0.5, 1)
- `--duration-fast`: 150ms
- `--duration-normal`: 250ms
- `--duration-slow`: 400ms

### Interactive States
- Hover: background lightens 4%, scale(1.02), shadow increases
- Active: scale(0.98), background darkens
- Focus: ring 2px accent-primary with 2px offset
- Selected: border-glow, subtle background tint

### TV Navigation
- Focus ring: 3px solid accent-primary, 4px offset, glow effect
- Focused card: scale(1.05), z-index elevated, shadow-lg
- Transition: all 200ms ease-out-expo

### Layout Patterns
- Header: Fixed, glass, 72px height, z-index 50
- Content: padding-top 72px + 32px
- Grid: CSS Grid with auto-fill, minmax(160px, 1fr), gap 16px
- Cards: Vertical poster + title, aspect-ratio 2/3, radius 16px
- Hero: Full-width backdrop, gradient overlay, content overlaid

---

## Component Library

All components are extracted into standalone HTML files under `/components/`. Each component includes markup, required CSS classes, variants, and interaction notes.

### Header / Navigation (`components/header.html`)
**Purpose:** Primary navigation bar, fixed at top with scroll-responsive glassmorphism.

**Required Classes:**
- `.header`, `.header.scrolled` — Fixed container with gradient/glass transition
- `.header-inner` — Flex layout: logo | nav | actions
- `.logo`, `.logo-accent`, `.logo-text` — Brand mark with gradient accent
- `.nav`, `.nav-link`, `.nav-link.active` — Horizontal nav with pill active state
- `.header-actions` — Search toggle, search form, avatar button
- `.search-toggle`, `.search-form`, `.search-input`, `.search-icon` — Collapsible search
- `.avatar-btn` — User menu trigger with gradient background

**Variants:**
- **Default:** Full header with nav + search + avatar (index.html, manga.html)
- **Minimal:** Logo + back button (visualizador.html, manga-lector.html)
- **Detail:** Logo only with nav (detalle.html, manga-detalle.html)

**States:**
- `.scrolled` — Applied after 50px scroll, activates glassmorphism + border
- `.open` — Mobile search form visibility
- `.active` — Current nav link

**Accessibility:**
- `data-tv-focus="true"` on interactive elements for TV navigation
- `aria-label` on all icon-only buttons

---

### Hero Section (`components/hero.html`)
**Purpose:** Featured content showcase with backdrop image and overlaid info.

**Required Classes:**
- `.hero` — Relative container, 70vh height, flex align-end
- `.hero-backdrop` — Absolute full-bleed image with gradient overlay
- `.hero-content` — Relative z-index content container
- `.hero-meta` — Uppercase eyebrow with badge and metadata
- `.hero-badge` — Pill badge with accent glow border
- `.hero-title` — Large display text, clamp(2.5rem, 5vw, 4rem)
- `.hero-synopsis` — Description with 3-line clamp
- `.hero-actions` — CTA button group

**Variants:**
- **Anime Hero:** "Ver ahora" play button, episode count meta
- **Manga Hero:** "Leer ahora" button, chapter count meta

**Responsive:**
- Mobile: 60vh height, smaller title (2rem), hidden synopsis overflow

---

### Anime Card / Manga Card (`components/card.html`)
**Purpose:** Content thumbnail card for catalog grids and relation sections.

**Required Classes:**
- `.anime-card` / `.manga-card` — Flex column, gap 12px, cursor pointer
- `.card-poster` — Aspect-ratio 2/3, rounded 16px, overflow hidden
- `.card-overlay` — Gradient fade-in on hover with synopsis text
- `.card-type` — Absolute top-right badge (TV, Manga, etc.)
- `.card-favorite` — Heart button, appears on hover, toggle state
- `.card-info` — Title + meta row
- `.card-title` — 2-line clamp
- `.card-meta` — Score + status
- `.card-score` — Star icon + number in warning color

**States:**
- **Hover:** Card translateY(-8px) scale(1.02), image scale(1.08), overlay opacity 1
- **Favorite:** `.active` class — Rose colored filled heart, always visible
- **Loading:** `.skeleton` class — Shimmer animation placeholder

**Accessibility:**
- `data-tv-focus="true"` for remote navigation
- `loading="lazy"` on images

---

### Continue Card (`components/continue-card.html`)
**Purpose:** Horizontal card showing watch/read progress for resuming content.

**Required Classes:**
- `.continue-section` — Wrapper with section header
- `.continue-grid` — Grid layout, auto-fill minmax(280px, 1fr)
- `.continue-card` — Horizontal flex: poster + info, padding 16px
- `.continue-poster` — 80x120px thumbnail with episode/chapter badge
- `.continue-badge` — Absolute bottom-left badge (Ep. X / Cap. X)
- `.continue-info` — Title + subtitle + progress bar
- `.continue-progress` — Track container, 3px height
- `.continue-progress-bar` — Gradient fill indicating progress

**Data Structure:**
```json
{
  "slug": "string",
  "title": "string", 
  "episode?": "number",
  "chapter?": "number",
  "poster": "url",
  "progress": "0-100"
}
```

**States:**
- **Hover:** Background lighten, border glow, translateY(-2px)

---

### Filters (`components/filters.html`)
**Purpose:** Content filtering interface with genre chips and advanced panel.

**Required Classes:**
- `.filters-section` — Wrapper
- `.filters-row` — Horizontal chip container with wrap
- `.chip`, `.chip.active` — Pill filter buttons
- `.filter-toggle` — Advanced filters expand/collapse button
- `.advanced-filters`, `.advanced-filters.open` — Collapsible panel
- `.filter-group` — Grouped filter controls
- `.filter-label` — Uppercase section label
- `.letter-grid`, `.letter-btn`, `.letter-btn.active` — A-Z alphabet filter
- `.select` — Styled dropdowns
- `.year-slider` — Dual-handle range slider
- `.slider-container`, `.slider-track`, `.slider-track-filled` — Custom slider
- `.slider-input`, `.slider-thumb` — Range inputs and visual thumbs

**Interactions:**
- **Genre chips:** Single select, adds `.active` class
- **Advanced toggle:** Expands/collapses panel, rotates chevron
- **Letter buttons:** Toggle select for alphabetical filtering
- **Year slider:** Dual inputs with visual thumb tracking

---

### Detail Hero (`components/detail-hero.html`)
**Purpose:** Title information header for detail pages with poster and metadata.

**Required Classes:**
- `.detail-hero` — Two-column grid: poster + info
- `.detail-backdrop` — Full-width backdrop with deep gradient
- `.detail-hero-content` — Grid layout: 280px | 1fr
- `.detail-poster` — 2/3 aspect, 20px radius, heavy shadow
- `.detail-info` — Title, meta, genres, actions
- `.detail-meta-top` — Badge row: status, type, year, score
- `.badge`, `.badge-status`, `.badge-type`, `.score-badge` — Metadata pills
- `.detail-title` — Large title, clamp(2rem, 4vw, 3.5rem)
- `.detail-aka` — Original title in italic secondary
- `.detail-genres` — Horizontal wrap of genre chips
- `.genre-chip` — Pill button with hover state
- `.detail-actions` — CTA buttons row

**Variants:**
- **Anime:** Episodes count, studio info, duration
- **Manga:** Chapters count, author, magazine

**Responsive:**
- Mobile: Single column, centered content, poster max-width 200px
- Tablet (769-1024px): 220px poster column

---

### Info Grid (`components/info-grid.html`)
**Purpose:** Key-value metadata display in responsive grid format.

**Required Classes:**
- `.info-grid` — CSS grid, auto-fit minmax(200px, 1fr), gap 24px
- `.info-item` — Card with surface background, padding 20px
- `.info-label` — Uppercase meta label, 0.75rem
- `.info-value` — Primary text value

**Usage:**
- Anime: Status, Type, Episodes, Duration, Year, Studio, Rating, Score
- Manga: Status, Type, Chapters, Author, Year, Demographics, Magazine, Score

**Responsive:**
- Mobile: 2-column grid

---

### Episode Row / Chapter Row (`components/episode-row.html`)
**Purpose:** List item for episodes or chapters with watch/read status.

**Required Classes:**
- `.episodes-section` / `.chapters-section` — Wrapper with header
- `.episodes-header` / `.chapters-header` — Title + count + order toggle
- `.episodes-list` / `.chapters-list` — Vertical flex container
- `.episode-row` / `.chapter-row` — Horizontal flex item
- `.episode-row.watched` / `.chapter-row.read` — Green tinted state
- `.episode-play` / `.chapter-read-icon` — Action icon button
- `.episode-num` / `.chapter-num` — Tabular numeric index
- `.episode-info` / `.chapter-info` — Title + meta
- `.episode-title` / `.chapter-title` — Ellipsis truncation
- `.episode-meta` / `.chapter-meta` — Episode/chapter number + status
- `.episode-duration` / `.chapter-date` — Optional metadata
- `.episode-status` / `.chapter-status` — Green dot indicator

**States:**
- **Hover:** translateX(4px), background lighten, play icon turns gradient
- **Watched/Read:** Green background tint, success-colored number
- **Current:** Accent background (in list views)

**Accessibility:**
- Full keyboard navigation via `data-tv-focus`

---

### Video Player (`components/video-player.html`)
**Purpose:** Video playback container with placeholder state.

**Required Classes:**
- `.player-section` — Wrapper
- `.player-wrapper` — 16:9 aspect ratio container, rounded 20px
- `.player-placeholder` — Gradient background with centered play button
- `.player-play-btn` — 80px circular button with gradient and glow

**Features:**
- Placeholder state with animated play button
- Ready for iframe embedding (HLS, YouTube, etc.)
- TV navigation support on container

**Interactions:**
- **Hover:** Play button scale(1.1), enhanced glow
- **Click:** Replace placeholder with actual video iframe

---

### Manga Reader (`components/manga-reader.html`)
**Purpose:** Image-based manga reading interface with multiple modes.

**Required Classes:**
- `.reader-section` — Wrapper
- `.reader-wrapper` — Dark container with rounded corners
- `.reader-cascade` — Vertical stack of images
- `.reader-paginated` — Single centered image
- `.controls-bar` — Mode toggle + page nav + read button
- `.control-group` — Grouped controls
- `.control-label` — Uppercase section label
- `.mode-chip`, `.mode-chip.active` — Reading mode selector
- `.page-nav-btn` — Previous/Next page buttons
- `.page-counter` — Current / Total display
- `.read-btn`, `.read-btn.read` — Mark as read toggle
- `.fullscreen-btn` — Fixed position fullscreen toggle

**Modes:**
- **Cascade (default):** All pages stacked vertically, continuous scroll
- **Paginated:** One page at a time with prev/next navigation

**Features:**
- Mode toggle between cascade and paginated
- Page counter in paginated mode
- Fullscreen support
- Mark as read toggle
- TV navigation support

---

### Pagination (`components/pagination.html`)
**Purpose:** Page navigation for catalog lists.

**Required Classes:**
- `.pagination` — Centered flex container
- `.page-btn` — Number/arrow buttons
- `.page-btn.active` — Current page (accent background)
- `.page-btn:disabled` — Boundary pages (reduced opacity)

**Patterns:**
- Previous / 1 / 2 / 3 / ... / Last / Next
- Ellipsis for gap indication

---

### Empty State (`components/empty-state.html`)
**Purpose:** Visual feedback when no content is available.

**Required Classes:**
- `.empty-state` — Centered flex column, padding 80px
- `.empty-state-icon` — 64px icon in tertiary color

**Variants:**
- **No Results:** Search icon + "No se encontraron resultados"
- **Empty Search:** Search icon + prompt to search
- **Error:** Alert icon + error message

---

### Breadcrumb (`components/breadcrumb.html`)
**Purpose:** Hierarchical navigation showing current location.

**Required Classes:**
- `.breadcrumb` — Horizontal flex with separators
- `.breadcrumb-separator` — Slash divider

**Patterns:**
- Home / Section / Title (detalle)
- Home / Section / Title / Chapter (lector)

---

### Footer (`components/footer.html`)
**Purpose:** Site footer with links and copyright. **NEW COMPONENT.**

**Required Classes:**
- `.footer` — Full-width surface background
- `.footer-inner` — Grid layout: brand + links
- `.footer-brand` — Logo + description
- `.footer-logo` — Brand mark
- `.footer-description` — Muted text description
- `.footer-links` — Multi-column link grid
- `.footer-section` — Link group with title
- `.footer-title` — Section heading
- `.footer-link` — Individual link with hover
- `.footer-bottom` — Copyright bar
- `.footer-bottom-inner` — Flex: copyright + social
- `.footer-copyright` — Legal text
- `.footer-social` — Social icon links

**Responsive:**
- Mobile: Single column, stacked sections

**Note:** CSS for footer needs to be added to pages using it.

---

## Component Usage Matrix

| Component | index.html | manga.html | detalle.html | manga-detalle.html | visualizador.html | manga-lector.html |
|-----------|-----------|-----------|-------------|-------------------|------------------|------------------|
| Header | ✓ (default) | ✓ (default) | ✓ (detail) | ✓ (detail) | ✓ (minimal) | ✓ (minimal) |
| Hero | ✓ | ✓ | — | — | — | — |
| Card | ✓ | ✓ | ✓ (relations) | ✓ (relations) | — | — |
| Continue Card | ✓ | ✓ | — | — | — | — |
| Filters | ✓ | ✓ | — | — | — | — |
| Detail Hero | — | — | ✓ | ✓ | — | — |
| Info Grid | — | — | ✓ | ✓ | — | — |
| Episode Row | — | — | ✓ | — | ✓ | — |
| Chapter Row | — | — | — | ✓ | — | ✓ |
| Video Player | — | — | — | — | ✓ | — |
| Manga Reader | — | — | — | — | — | ✓ |
| Pagination | ✓ | ✓ | — | — | — | — |
| Empty State | ✓ | ✓ | — | — | — | — |
| Breadcrumb | — | — | ✓ | ✓ | ✓ | ✓ |
| Footer | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

---

## CSS Architecture Notes

### Current State
All CSS is currently **inlined per page**, resulting in significant duplication. The design system tokens (`:root` variables) are repeated across all 6 HTML files.

### Theme System
**Implemented:** Dual-theme support (Light / Dark) via `data-theme` attribute on `<html>`.
- **Default:** Respects `prefers-color-scheme` system preference
- **Override:** User toggle sets `data-theme="light|dark"` + persists to `localStorage`
- **Tokens:** All color tokens have light/dark variants in `styles.css`
- **No flash:** Theme script runs in `<head>` before paint

### Recommended Refactor Path
1. **Extract shared CSS** into a single `styles.css` containing:
   - `:root` design tokens for both themes
   - Reset & base styles
   - Utility classes
   - Animation keyframes
   - All component CSS
   - Theme toggle button styles

2. **Page-specific CSS** should only contain:
   - Layout adjustments unique to that page
   - Page-specific overrides

3. **Component HTML files** serve as:
   - Markup templates
   - Documentation of required classes
   - Copy-paste references for implementation

### File Structure
```
project/
├── index.html
├── manga.html
├── detalle.html
├── manga-detalle.html
├── visualizador.html
├── manga-lector.html
├── crystal-liquid-design.md
├── styles.css              ← Shared stylesheet with themes
└── components/
    ├── header.html
    ├── hero.html
    ├── card.html
    ├── continue-card.html
    ├── filters.html
    ├── detail-hero.html
    ├── info-grid.html
    ├── episode-row.html
    ├── video-player.html
    ├── manga-reader.html
    ├── pagination.html
    ├── empty-state.html
    ├── breadcrumb.html
    └── footer.html
```
