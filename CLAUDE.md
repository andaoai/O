# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Chinese traditional compass visualization platform** (中华传统罗盘可视化平台) built with Vue 3 + TypeScript. It is a multi-page app: a home page lists available "compasses" (罗盘), and each compass is a full-screen, polar-coordinate SVG visualization of traditional Chinese cosmological elements.

Two compasses currently ship:

- **中华天文圆环 (astronomy)** — a full astronomical disk stacking many concentric rings: 360-degree degree scale, 24 solar terms (二十四节气), 28 constellations (二十八星宿), 60 jiazi (六十甲子) with five-element nayin (五行纳音), 10 heavenly stems (十天干) with void positions (天干空亡), 12 longevity stages (十二长生), 12 earthly branches (十二地支), 8 gates (八门), four celestial symbols (四象), plus a solar ecliptic and a Taiji (太极) at the center.
- **六十甲子六环 (liushi-jiazi)** — six concentric 60-jiazi rings (year/month/day/hour/minute/second pillars) that track real time and highlight the current ganzhi cell on each ring.

Core libraries: **astronomy-engine** for precise solar position, **tyme4ts** for traditional calendar / ganzhi calculations, **vue-router** for the multi-page structure.

## Architecture

The project recently moved from a "one .vue component per ring" design to a **data-driven, multi-page** architecture. Understanding these three pivots is essential:

### 1. Compass registry → routes (multi-page)

`src/compasses/index.ts` is the single registry. Each entry (`CompassMeta`) declares an `id`, display `name`, `description`, `category`, and a lazy-loaded view `component`. Both the home page grid and the router read from this array:

- `src/views/HomeView.vue` renders one card per registry entry.
- `src/router/index.ts` generates `/compass/:id` routes from the registry, with `HomeView` at `/` and a catch-all redirect back home.

**Adding a new compass = create `src/views/XxxView.vue` + add one entry to the `compasses` array.** No router edits needed.

### 2. Data-driven rings (DataRing + RingData)

Traditional rings are no longer separate components. Instead:

- `src/data/rings/*.ts` — each file exports a `RingData` object: the ring's `items` (labels, colors, angles, highlight flags) plus styling defaults. See `src/data/rings/types.ts` for `RingData` / `RingItem`.
- `src/components/DataRing.vue` — a single generic component that takes a `RingData` and renders it via `CircleRing`. Layout props (`radius`, `innerRadius`, `startDegree`, `rotationDirection`) injected by `RingStack` override the data's defaults.
- `src/components/base/CircleRing.vue` — the actual SVG ring renderer (sectors, ticks, labels, highlight breathing animation). Built on `PolarCanvas`.

This replaced the old `EarthlyBranches.vue`, `SiXiang.vue`, `SixtyJiazi.vue`, etc. — **those component files no longer exist**; their content lives in `src/data/rings/`.

### 3. Concentric auto-layout (RingStack)

`src/components/base/RingStack.vue` solves manual radius bookkeeping. You declare an `outerRadius` and a list of rings (outer → inner), each with just a `thickness` (radial width). RingStack accumulates inward from `outerRadius`, computing `radius`/`innerRadius` for every ring so they never overlap, and injects `rotationDirection` into all of them. Per-ring `gapBefore` overrides the default `gap`.

### Component layering

```
PolarCanvas (base SVG canvas)
├── Standard polar coordinate system (0° at right/3 o'clock, clockwise)
├── Animation via useAnimation composable
├── polar ↔ cartesian conversion, arc/sector path generation
└── exposes utilities to children via slot props

CircleRing (generic ring renderer, built on PolarCanvas)
└── DataRing (data-driven wrapper: RingData → CircleRing)

DegreeScale (degree-tick ring, built on PolarCanvas; NOT data-driven —
             generated from a scaleInterval rather than an items array)

SolarEcliptic (sun position via astronomy-engine, built on PolarCanvas)

TaiChi (time-driven yin-yang disk, standalone SVG)

RingStack (concentric auto-layout container; arranges DataRing/DegreeScale instances)

Control (unified time / zoom / pan / rotation panel)
```

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
│   └── LiushiJiaziView.vue        # 六十甲子六环 compass
├── components/
│   ├── base/
│   │   ├── PolarCanvas.vue         # Base polar coordinate canvas
│   │   ├── CircleRing.vue          # Generic SVG ring renderer
│   │   └── RingStack.vue           # Concentric auto-layout container
│   ├── DataRing.vue               # Data-driven ring (RingData → CircleRing)
│   ├── DegreeScale.vue            # Degree-tick ring (interval-based)
│   ├── SolarEcliptic.vue          # Solar ecliptic via astronomy-engine
│   ├── TaiChi.vue                 # Time-driven Taiji disk
│   └── Control.vue                # Unified control panel
├── data/rings/                    # Ring DATA (one RingData per file)
│   ├── types.ts                   # RingData / RingItem interfaces
│   ├── index.ts                   # Barrel re-export
│   ├── twentyFourSolarTerms.ts    # 二十四节气
│   ├── twentyEightConstellations.ts # 二十八星宿
│   ├── sixtyJiazi.ts              # 六十甲子
│   ├── sixtyJiaziNayin.ts         # 五行纳音
│   ├── heavenlyStems.ts           # 十天干
│   ├── tianganKongwang.ts         # 天干空亡
│   ├── twelveLongevity.ts         # 十二长生
│   ├── earthlyBranches.ts         # 十二地支
│   ├── eightGates.ts              # 八门
│   └── siXiang.ts                 # 四象
├── composables/
│   └── useAnimation.ts            # Animation control composable
├── utils/
│   ├── chineseCalendar.ts         # Chinese calendar helpers (tyme4ts)
│   └── liushiJiazi.ts             # Six-pillar 60-jiazi index calc (tyme4ts)
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

1. Create `src/views/XxxView.vue`. Follow `AstronomyView.vue` / `LiushiJiaziView.vue`: a `.container` wrapping an `<svg>` with a `<g transform="translate(...) scale(...) rotate(...)">`, a back-link to `/`, and a `Control` panel bound via `v-model`.
2. Add an entry to the `compasses` array in `src/compasses/index.ts` with a unique `id`, `name`, `description`, `category`, and lazy `component`.
3. The home card and `/compass/:id` route appear automatically.

### Adding a new data-driven ring

1. Create `src/data/rings/myRing.ts` exporting a `RingData` (define `items`; styling fields are optional). Re-export it from `src/data/rings/index.ts`.
2. In a view, add a `RingStack` entry: `{ component: markRaw(DataRing), thickness: N, props: { data: myRing } }`. Use `markRaw` to avoid wrapping the component in a reactive proxy.

`RingStack` rings are declared outer → inner. Only `thickness` is required per ring; `radius`/`innerRadius` are computed. Use `gapBefore: 0` to butt a ring directly against the previous one (as nayin does against sixty-jiazi).

### Rotation direction

Ring components accept `rotationDirection: 'clockwise' | 'counterclockwise'` so labels stay correctly oriented. `RingStack` injects it into all child rings from a single view-level `ref`. Note: `SolarEcliptic` and `TaiChi` are driven by `time` (astronomical/clock position), so the astronomy view deliberately does **not** apply whole-disk rotation animation to them — rotating the whole group would send time-positioned bodies spinning around the center.

### Time integration

Components accept a `time?: Date` prop. Views own a `controlledTime` ref bound to `Control` via `v-model`. `LiushiJiaziView` additionally runs a 1s live clock that advances `controlledTime` until the user takes over via the panel (then it stops following real time).

### Animation

Use the `useAnimation` composable for consistent self-rotating behavior:

```typescript
import { useAnimation } from '@/composables/useAnimation'
const { isAnimating, animationSpeed, startAnimation, stopAnimation } = useAnimation()
```

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
- `src/data/rings/types.ts` — the `RingData` contract for all rings
- `src/components/base/RingStack.vue` — concentric auto-layout
- `src/components/DataRing.vue` — data → render bridge
- `src/views/AstronomyView.vue` — the richest compass, shows the full stack
- `src/utils/liushiJiazi.ts` — six-pillar ganzhi calculation (tyme4ts usage)
- `README.md` / `COMPONENT_DOCUMENTATION.md` — Chinese-language project & component docs
