# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Chinese traditional compass visualization platform** (中华传统罗盘可视化平台) built with Vue 3 + TypeScript. It is a multi-page app: a home page lists available "compasses" (罗盘), and each compass is a full-screen, polar-coordinate SVG visualization of traditional Chinese cosmological elements.

Four compasses currently ship:

- **中华天文圆环 (astronomy)** — a full astronomical disk stacking many concentric rings: 360-degree degree scale, 24 solar terms (二十四节气), 28 constellations (二十八星宿), 60 jiazi (六十甲子) with five-element nayin (五行纳音), 10 heavenly stems (十天干) with void positions (天干空亡), 12 longevity stages (十二长生), 12 earthly branches (十二地支), 8 gates (八门), four celestial symbols (四象), plus a solar ecliptic and a Taiji (太极) at the center.
- **六十甲子六环 (liushi-jiazi)** — six concentric 60-jiazi rings (year/month/day/hour/minute/second pillars) that track real time and highlight the current ganzhi cell on each ring.
- **七曜入宿天象盘 (planet-mansion)** — celestial sky projection with polar equator, ecliptic and lunar orbit obliquity, sun/moon/five planets real-time positioning into 28 mansions, featuring point-based 24 solar terms outer ring.
- **先天六十四卦盘 (sixty-four-gua)** — Fu Xi/Shao Yong's先天 circular diagram: 64 hexagrams arranged by binary bit-reversal order, Qian south Kun north, displaying hexagram symbols, names and six lines.

Core libraries: **astronomy-engine** for precise solar position, **tyme4ts** for traditional calendar / ganzhi calculations, **vue-router** for the multi-page structure.

## Architecture

The project moved from a "one .vue component per ring" design to a **data-driven, multi-page** architecture, then further evolved to a **two-ring-type (segment + point) foundation**. Understanding these four pivots is essential:

### 1. Compass registry → routes (multi-page)

`src/compasses/index.ts` is the single registry. Each entry (`CompassMeta`) declares an `id`, display `name`, `description`, `category`, and a lazy-loaded view `component`. Both the home page grid and the router read from this array:

- `src/views/HomeView.vue` renders one card per registry entry.
- `src/router/index.ts` generates `/compass/:id` routes from the registry, with `HomeView` at `/` and a catch-all redirect back home.

**Adding a new compass = create `src/views/XxxView.vue` + add one entry to the `compasses` array.** No router edits needed.

### 2. Three ring types: Segment (CircleRing) + Point (PointRing) + Body (DataBodyRing)

There are **three fundamentally different types of rings**, each with its own data model and renderer:

| Type | Use Case | Data Model | Component |
|------|----------|------------|-----------|
| **Segment (段)** | Items occupy angular *ranges* (60 jiazi, 12 branches, etc) | `RingData` → `RingItem[]` | `CircleRing` |
| **Point (点)** | Items exist at *precise angles* (24 solar terms ticks, etc) | `PointRingData` → `PointItem[]` | `PointRing` |
| **Body (体)** | Luminous celestial bodies at precise angles (sun, moon, 5 planets) | `BodyRingData` → `BodyItem[]` | `DataBodyRing` |

All three share the same type inheritance system (`RingItemBase` / `RingDataBase`), and all work with `RingStack` auto-layout.

### 3. Data-driven rings (DataRing + DataPointRing)

Traditional rings are no longer separate components. Instead:

#### Segment-oriented (CircleRing):
- `src/data/rings/*.ts` — each file exports a `RingData` object: the ring's `items` (labels, colors, angles, highlight flags) plus styling defaults.
- `src/components/rings/DataRing.vue` — generic wrapper that takes a `RingData` and renders it via `CircleRing`.
- `src/components/base/CircleRing.vue` — the actual SVG ring renderer (sectors, ticks, labels, highlight breathing animation).

#### Point-oriented (PointRing):
- `src/data/rings/*.ts` — exports a `PointRingData` object (e.g., `twentyFourSolarTerms`) with precise `angle` per item.
- `src/components/rings/DataPointRing.vue` — generic wrapper for point-oriented data.
- `src/components/base/PointRing.vue` — renders points/markers/ticks at precise angles (3 symbol types: `circle`/`diamond`/`tick`).

#### Body-oriented (DataBodyRing) — *NEW!*:
- `src/data/rings/*.ts` — exports a `BodyRingData` object with `angle`, `haloLevel`, and celestial `state` (retrograde, latitude, aspect, mansion).
- `src/components/rings/DataBodyRing.vue` — generic wrapper for celestial bodies (sun, moon, 5 planets, stars).
- Reuses `BodyMarker.vue` from `components/celestial/` for consistent rendering (halos + circle + symbol).
- Features: latitude offset, retrograde rings, mansion degree labeling, aspect highlighting.
- Helper functions in `src/data/rings/sevenLuminaries.ts`: `singlePlanetBody()`, `twoPlanetsBody()`, `sevenLuminariesBody()`.

This replaced the old `EarthlyBranches.vue`, `SiXiang.vue`, `SixtyJiazi.vue`, etc. — **those component files no longer exist**; their content lives in `src/data/rings/`.

### 4. Shared foundation: `useRingBase` composable

All ring logic (radius resolution, highlight levels, font-size propagation, angle math) is centralized in `src/composables/useRingBase.ts`:

```typescript
// In DataRing or DataPointRing:
const { resolvedRadius, resolvedInnerRadius, highlightLevelOf, itemsWithFontSize } =
  useRingBase<RingData, RingItem>(props, defaults)
```

Type system uses inheritance to eliminate duplication (`RingItemBase` → `RingItem` / `PointItem`, `RingDataBase` → `RingData` / `PointRingData`).

### 5. Concentric auto-layout (RingStack)

`src/components/base/RingStack.vue` solves manual radius bookkeeping. You declare an `outerRadius` and a list of rings (outer → inner), each with just a `thickness` (radial width). RingStack accumulates inward from `outerRadius`, computing `radius`/`innerRadius` for every ring so they never overlap, and injects `rotationDirection` into all of them. Per-ring `gapBefore` overrides the default `gap`.

Works for both `DataRing` (segment) and `DataPointRing` (point) components.

### Component layering

```
┌─────────────────────────────────────────────────────────┐
│  useRingBase.ts (composable)                            │
│  ├─ useHighlight — highlight level calculation          │
│  ├─ useRingProps — radius/angle resolution              │
│  ├─ useRingItemsWithFontSize — font size propagation    │
│  └─ useRingAngles — angle math utilities                 │
└─────────────────────────────────────────────────────────┘
                           ▲
                           │
PolarCanvas (base SVG canvas)
├── Standard polar coordinate system (0° at right/3 o'clock, clockwise)
├── Animation via useAnimation composable
├── polar ↔ cartesian conversion, arc/sector path generation
└── exposes utilities to children via slot props

CircleRing (segment-oriented ring renderer)
└── DataRing (data-driven wrapper: RingData → CircleRing)

PointRing (point-oriented ring renderer: circle/diamond/tick)
└── DataPointRing (data-driven wrapper: PointRingData → PointRing)

BodyMarker (celestial body marker: halos + circle + symbol)
└── DataBodyRing (data-driven celestial ring: BodyRingData → BodyMarker)

DegreeScale (degree-tick ring, NOT data-driven — interval-based)

SolarEcliptic (sun position via astronomy-engine, built on PolarCanvas)

TaiChi (time-driven yin-yang disk, standalone SVG)

RingStack (concentric auto-layout container; arranges all ring types)

Control (unified time / zoom / pan / rotation panel)
```

### Control panel refactoring

`Control.vue` functionality has been refactored into three reusable composables (commit c33f550):

- `useTimePlayback` — time playback control: play/pause, speed, stepping by second/minute/hour/day/month/year, reset to now
- `usePanelDrag` — draggable panel with position persistence to localStorage
- `useKeyboardShortcuts` — global keyboard shortcuts with ignore when input focused

The Control panel now features:
- Collapsible modules with state persisted to localStorage
- Three timeline displays: **Gregorian calendar** (公历) → **Dynasty** (朝代) → **Ganzhi** (干支)
- Lunar date and solar term display
- Support for BCE (公元前) years in date input
- Draggable panel that remembers position

### State management

Pinia is installed and registered in `src/main.ts`, but **there are currently no stores**. Each view holds its own state with `ref`s (`controlledTime`, `zoomLevel`, `offsetX/Y`, `rotationDirection`, `rotationAngle`) and wires them to `Control` via `v-model`. The viewport transform is applied directly on an SVG `<g transform>`.

## Project Structure

```
src/
├── compasses/
│   └── index.ts                   # Compass registry (drives home grid + routes)
├── views/
│   ├── HomeView.vue               # Home page: grid of compass cards
│   ├── AstronomyView.vue          # 中华天文圆环 compass
│   ├── LiushiJiaziView.vue        # 六十甲子六环 compass
│   ├── PlanetMansionView.vue      # 七曜入宿天象盘 compass (point-based 节气)
│   └── SixtyFourGuaView.vue       # 先天六十四卦盘 compass
├── components/
│   ├── base/
│   │   ├── PolarCanvas.vue         # Base polar coordinate canvas
│   │   ├── CircleRing.vue          # Segment-oriented ring renderer
│   │   ├── PointRing.vue           # Point-oriented ring renderer (3 symbol types)
│   │   └── RingStack.vue           # Concentric auto-layout container
│   ├── rings/
│   │   ├── DataRing.vue            # Segment data-driven: RingData → CircleRing
│   │   ├── DataPointRing.vue       # Point data-driven: PointRingData → PointRing
│   │   ├── DegreeScale.vue         # Degree-tick ring (interval-based)
│   │   ├── GuaRing.vue             # 六十四卦 ring (special hexagram rendering)
│   │   └── PlanetDegreeRing.vue   # Planet mansion degree ring
│   ├── celestial/                  # Celestial visualization components
│   │   ├── BodyMarker.vue          # Celestial body marker
│   │   ├── CelestialBody.vue       # Celestial body container
│   │   ├── EclipticCircle.vue      # Ecliptic circle rendering
│   │   └── LunarOrbit.vue          # Lunar orbit rendering
│   ├── HelioOrbits.vue             # Heliocentric orbits (planet-mansion)
│   ├── SkyChart.vue                # Complete sky chart projection
│   ├── SolarEcliptic.vue          # Solar ecliptic via astronomy-engine
│   ├── TaiChi.vue                 # Time-driven Taiji disk
│   └── Control.vue                # Unified control panel
├── data/rings/                    # Ring DATA (one file per ring)
│   ├── types.ts                   # Type hierarchy:
│   │                              #   RingItemBase → RingItem / PointItem
│   │                              #   RingDataBase → RingData / PointRingData
│   ├── index.ts                   # Barrel re-export
│   ├── twentyFourSolarTerms.ts    # 二十四节气 (PointRingData: 精确黄经点)
│   ├── twentyEightConstellations.ts # 二十八星宿
│   ├── sixtyJiazi.ts              # 六十甲子
│   ├── sixtyJiaziNayin.ts         # 五行纳音
│   ├── heavenlyStems.ts           # 十天干
│   ├── tianganKongwang.ts         # 天干空亡
│   ├── twelveLongevity.ts         # 十二长生
│   ├── earthlyBranches.ts         # 十二地支
│   ├── eightGates.ts              # 八门
│   ├── siXiang.ts                 # 四象
│   ├── seventyTwoHou.ts          # 七十二候
│   └── twelveShichen.ts           # 十二时辰
├── composables/
│   ├── useAnimation.ts            # Animation control composable
│   ├── useRingBase.ts             # Shared ring logic foundation
│   ├── useTimePlayback.ts         # Time playback (extracted from Control)
│   ├── usePanelDrag.ts            # Panel dragging (extracted from Control)
│   └── useKeyboardShortcuts.ts    # Keyboard shortcuts (extracted from Control)
├── utils/
│   ├── chineseCalendar.ts         # Chinese calendar helpers (tyme4ts)
│   ├── liushiJiazi.ts             # Six-pillar 60-jiazi index calc (tyme4ts)
│   ├── celestial.ts               # Celestial coordinate calculations
│   ├── eraCalendar.ts             # Dynasty era conversion + universal ganzhi across all time
│   ├── geometry.ts               # Polar geometry utilities
│   ├── planetMansion.ts           # Planet mansion calculations
│   ├── skyEvents.ts              # Celestial event calculations
│   └── skyProjection.ts          # Sky coordinate projection
├── router/index.ts                # Routes generated from compass registry
├── App.vue                        # Shell: just <RouterView />
└── main.ts                        # App entry (Vue + Pinia + Router)
```

## Development Commands

```bash
npm run dev          # Development server (Vite)
npm run build        # Type-check + production build
npm run preview      # Preview production build
npm run type-check   # vue-tsc type checking
npm run lint         # ESLint with auto-fix
npm run format       # Prettier on src/
npm run test:unit    # Vitest unit tests
npm run test:e2e     # Playwright e2e tests
npm run deploy       # Build + publish dist/ to gh-pages
```

E2E specifics:

```bash
npx playwright install                          # first-time browser install
npm run test:e2e -- --project=chromium          # single browser
npm run test:e2e -- tests/example.spec.ts       # single file
npm run test:e2e -- --debug                      # debug mode
```

## Development Patterns

### Adding a new compass

1. Create `src/views/XxxView.vue`. Follow `AstronomyView.vue` / `LiushiJiaziView.vue` / `PlanetMansionView.vue`: a `.container` wrapping an `<svg>` with a `<g transform="translate(...) scale(...) rotate(...)">`, a back-link to `/`, and a `Control` panel bound via `v-model`.
2. Add an entry to the `compasses` array in `src/compasses/index.ts` with a unique `id`, `name`, `description`, `category`, and lazy `component`.
3. The home card and `/compass/:id` route appear automatically.

### Adding a new segment-oriented (CircleRing) data-driven ring

1. Create `src/data/rings/myRing.ts` exporting a `RingData`:
```typescript
export const myRing: RingData = {
  radius: 400,
  innerRadius: 380,
  items: [
    { label: 'Item 1', startAngle: 0, endAngle: 30 },
    // ...
  ]
}
```
2. Re-export it from `src/data/rings/index.ts`.
3. In a view, add to `RingStack`:
```typescript
{ component: markRaw(DataRing), thickness: 20, props: { data: myRing } }
```

### Adding a new point-oriented (PointRing) data-driven ring

1. Create `src/data/rings/myPoints.ts` exporting a `PointRingData`:
```typescript
export const myPoints: PointRingData = {
  radius: 460,
  innerRadius: 440,
  pointSymbol: 'tick',  // or 'circle' / 'diamond'
  labelOffset: -15,     // label position relative to points (+ out / - in)
  items: [
    { label: '春分', angle: 0, pointColor: '#ffdd00' },
    { label: '清明', angle: 15 },
    // ...
  ]
}
```
2. Re-export it from `src/data/rings/index.ts`.
3. In a view, add to `RingStack`:
```typescript
{ component: markRaw(DataPointRing), thickness: 20, props: { data: myPoints } }
```

`RingStack` rings are declared **outer → inner**. Only `thickness` is required per ring; `radius`/`innerRadius` are computed. Use `gapBefore: 0` to butt a ring directly against the previous one (as nayin does against sixty-jiazi).

### PointRing symbol types

Use `pointSymbol` to control the visual style:

| Symbol | Use Case | Visual |
|--------|----------|--------|
| `'tick'` | Solar terms, degree markers | Radial line from outer edge inward (25% of ring thickness) |
| `'circle'` | Planets, markers | Filled circle at radius |
| `'diamond'` | Special points (equinoxes, solstices) | Diamond shape at radius |

### Rotation direction

Ring components accept `rotationDirection: 'clockwise' | 'counterclockwise'` so labels stay correctly oriented. `RingStack` injects it into all child rings from a single view-level `ref`. Note: `SolarEcliptic` and `TaiChi` are driven by `time` (astronomical/clock position), so the astronomy view deliberately does **not** apply whole-disk rotation animation to them — rotating the whole group would send time-positioned bodies spinning around the center.

### Time integration

Components accept a `time?: Date` prop. Views own a `controlledTime` ref bound to `Control` via `v-model`. `LiushiJiaziView` additionally runs a 1s live clock that advances `controlledTime` until the user takes over via the panel (then it stops following real time).

### Animation & shared logic

Use `useAnimation` composable for consistent self-rotating behavior:
```typescript
import { useAnimation } from '@/composables/useAnimation'
const { isAnimating, animationSpeed, startAnimation, stopAnimation } = useAnimation()
```

For ring-specific logic (highlight levels, radius resolution, font size propagation), use `useRingBase`:
```typescript
import { useRingBase, useHighlight } from '@/composables/useRingBase'
```

### Highlight levels

Instead of just a boolean `highlight`, the type system now supports graded highlighting:
- `0` / undefined: no highlight
- `1`: weak highlight
- `2`: medium highlight (breathing animation)
- `3`: strong highlight (faster, more intense breathing)

This allows multiple levels of highlighting (e.g., current year + current month + current day all highlighted with increasing intensity).

## Testing Strategy

- **Unit tests** (Vitest) for calculation utilities — `utils/liushiJiazi.ts` and `utils/chineseCalendar.ts` are the prime targets (pure functions, easy to assert).
- **Component tests** (Vue Test Utils) for ring rendering and interaction.
- **E2E tests** (Playwright) for navigation between home and compass pages and full workflows.
- **Type checking** with `vue-tsc` (`npm run type-check`).

## Performance Considerations

- Use **computed** properties to cache expensive calculations (ring item derivation, jiazi indices).
- Build `RingStack` ring arrays as `computed` rather than rebuilding per-frame in templates (see `LiushiJiaziView`).
- Minimize SVG DOM nodes; prefer `v-show` over `v-if` for frequently toggled elements.
- `markRaw` ring components passed into `RingStack` to avoid needless reactivity overhead.

## Deployment

GitHub Pages via `npm run deploy`, which runs the production build and publishes `dist/` to the `gh-pages` branch. CI workflows live in `.github/workflows/`.

## Key Files for Understanding

- `src/compasses/index.ts` — the registry that wires everything together
- `src/composables/useRingBase.ts` — **the foundation**: shared logic for ALL ring types
- `src/data/rings/types.ts` — type hierarchy: `RingItemBase` / `RingDataBase` → segment/point variants
- `src/components/base/RingStack.vue` — concentric auto-layout
- `src/components/rings/DataRing.vue` — segment-oriented data→render bridge
- `src/components/rings/DataPointRing.vue` — point-oriented data→render bridge
- `src/composables/useTimePlayback.ts` — time playback logic extracted from Control
- `src/views/PlanetMansionView.vue` — richest example: mixed segment + point rings
- `src/utils/liushiJiazi.ts` — six-pillar ganzhi calculation (tyme4ts usage)
- `README.md` / `COMPONENT_DOCUMENTATION.md` — Chinese-language project & component docs
