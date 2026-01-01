# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a **Chinese Astronomical Rings visualization system** (中华天文圆环) built with Vue 3 + TypeScript. It displays an interactive, polar-coordinate-based visualization of traditional Chinese cosmological elements including:

- 360-degree degree scales with customizable intervals
- Solar ecliptic system using astronomy-engine for precise calculations
- Lunar orbit/white path system (白道) with moon position tracking
- 28 constellations (二十八星宿) organized by four celestial symbols
- 24 solar terms (二十四节气) based on solar position
- 12 earthly branches (十二地支)
- 10 heavenly stems with void positions (天干空亡)
- Four celestial symbols (四象): Azure Dragon, Vermilion Bird, White Tiger, Black Tortoise
- Unified control panel for time, zoom, rotation, and pan controls
- Chinese calendar integration with tyme4ts

## Architecture

### Component Hierarchy

The project follows a **layered polar coordinate architecture**:

```
PolarCanvas (base canvas component)
├── Provides standard polar coordinate system (0° at right, clockwise)
├── Unified animation management via useAnimation composable
├── Coordinate conversion utilities (polar ↔ cartesian)
└── Exposes tools via slot props to child components

DegreeScale (flexible degree marking component)
├── Inherits from PolarCanvas
├── Supports custom intervals (1-360 degrees)
├── Generates sector visualizations
└── Smart text positioning pointing to center

SolarEcliptic (sun position component)
├── Inherits from PolarCanvas
├── Integrates astronomy-engine for precise calculations
└── Real-time solar position with seasonal colors

Active Traditional Components
├── TwentyFourSolarTerms - 24 solar terms (节气) with astronomical precision
├── TwentyEightConstellations - 28 Chinese constellations (星宿)
├── EarthlyBranches - 12 earthly branches (地支)
├── TiangangKongwang - 10 heavenly stems with void positions (天干空亡)
└── CustomRing - Generic customizable ring component

Legacy Components (temporarily disabled in App.vue, available for use)
├── SixtyJiazi - 60 Jiazi system
├── HeavenlyStems - 10 heavenly stems
├── EightGates - 8 gates system
├── TwelveLongevity - 12 longevity stages
└── SiXiang - Four celestial symbols

Orbit System Components
├── OrbitSystem - Generic orbital visualization component
└── CircleRing - Legacy ring component (still used by some traditional components)
```

### State Management

Uses **Pinia** for state management with:
- Time state synchronization across components
- Zoom and offset state for viewport controls
- Animation state management
- Inter-component communication

### Key Libraries

- **astronomy-engine (v2.1.19)**: High-precision astronomical calculations for solar and lunar positions
- **tyme4ts (v1.3.7)**: Traditional Chinese calendar calculations
- **Vue 3.5.22**: Composition API with `<script setup>` syntax
- **TypeScript**: Full type safety throughout
- **gh-pages (v6.3.0)**: GitHub Pages deployment via npm script

## Development Commands

### Essential Commands
```bash
# Development server
npm run dev

# Production build
npm run build

# Type checking
npm run type-check

# Linting and auto-fix
npm run lint

# Code formatting
npm run format

# Unit testing
npm run test:unit

# End-to-end testing
npm run test:e2e

# Deploy to GitHub Pages
npm run deploy
```

### Test Commands
```bash
# Run specific e2e test file
npm run test:e2e -- tests/example.spec.ts

# Run e2e tests on specific browser
npm run test:e2e -- --project=chromium

# Debug mode e2e testing
npm run test:e2e -- --debug

# Install Playwright browsers (first time only)
npx playwright install
```

## Project Structure

```
src/
├── components/
│   ├── base/                      # Base components
│   │   ├── PolarCanvas.vue        # 🆕 Base polar coordinate canvas
│   │   ├── OrbitSystem.vue        # 🆕 Orbit system component (lunar orbits)
│   │   └── CircleRing.vue         # Legacy ring component
│   ├── DegreeScale.vue            # 🆕 Flexible degree scale component
│   ├── SolarEcliptic.vue          # 🆕 Solar ecliptic with astronomy-engine
│   ├── TwentyFourSolarTerms.vue   # ✅ 24 solar terms (active)
│   ├── TwentyEightConstellations.vue # ✅ 28 constellations (active)
│   ├── EarthlyBranches.vue        # ✅ 12 earthly branches (active)
│   ├── tianggankongwang.vue       # ✅ Heavenly stems with void (active)
│   ├── SiXiang.vue                # ⏸️ Four celestial symbols (available, not in App.vue)
│   ├── SixtyJiazi.vue            # ⏸️ 60 Jiazi system (available, not in App.vue)
│   ├── HeavenlyStems.vue         # ⏸️ 10 heavenly stems (available, not in App.vue)
│   ├── EightGates.vue            # ⏸️ 8 gates system (available, not in App.vue)
│   ├── TwelveLongevity.vue       # ⏸️ 12 longevity stages (available, not in App.vue)
│   ├── CustomRing.vue            # 🆕 Generic customizable ring
│   └── Control.vue               # 🆕 Unified control panel
├── composables/
│   └── useAnimation.ts           # 🆕 Animation control composable
├── utils/
│   └── chineseCalendar.ts        # 🆕 Chinese calendar utilities
├── stores/                       # Pinia state management
├── router/                       # Vue Router configuration
└── types/                        # TypeScript type definitions
```

**Legend:**
- 🆕 Newly created/fully refactored
- ✅ Active and currently used in App.vue
- ⏸️ Available but not currently used in App.vue (can be enabled as needed)

## Key Components and Usage

### PolarCanvas Base Component

All polar coordinate components inherit from this base:

```vue
<PolarCanvas
  :enable-animation="true"
  :animation-speed="0.5"
  :rotation="45"
>
  <template #default="slotProps">
    <!-- Use slotProps utilities:
         - slotProps.centerX, slotProps.centerY
         - slotProps.totalRotation
         - slotProps.polarToCartesian(angle, radius)
         - slotProps.getMidAngle(startAngle, endAngle)
         - slotProps.generateArcPath(centerX, centerY, radius, startAngle, endAngle)
    -->
  </template>
</PolarCanvas>
```

### DegreeScale Component

Highly configurable degree marking system:

```vue
<!-- 60 Jiazi system: 6-degree intervals -->
<DegreeScale :radius="200" :scale-interval="6" />

<!-- 12 earthly branches: 12-degree intervals -->
<DegreeScale :radius="200" :scale-interval="12" />

<!-- 24 solar terms: 15-degree intervals -->
<DegreeScale :radius="200" :scale-interval="15" />
```

### SolarEcliptic Component

Precise solar position calculation using astronomy-engine:

```vue
<SolarEcliptic
  :radius="160"
  :time="controlledTime"
  :enable-animation="true"
  :show-sun-label="true"
/>
```

### Control Panel

Unified time, zoom, rotation, and pan controls with keyboard shortcuts:

```vue
<Control
  v-model="controlledTime"
  v-model:zoom="zoomLevel"
  v-model:offsetX="offsetX"
  v-model:offsetY="offsetY"
  v-model:rotation-direction="rotationDirection"
  v-model:rotation-angle="rotationAngle"
/>
```

**Keyboard Shortcuts:**
- `Space`: Play/pause animation
- `R`: Reset to current time
- `H/Shift+H`: +1 hour / -1 hour
- `D/Shift+D`: +1 day / -1 day
- `M/Shift+M`: +1 month / -1 month
- `Y/Shift+Y`: +1 year / -1 year
- `+/-/0`: Zoom controls
- `Arrow keys`: Pan viewport
- `Delete`: Reset pan

**New Rotation Controls:**
- `rotationDirection`: 'clockwise' | 'counterclockwise' - Controls text/label rotation direction
- `rotationAngle`: Manual rotation angle in degrees
- All ring components respect the global rotation direction for consistent text orientation

## Development Patterns

### Creating New Polar Components

1. **Inherit from PolarCanvas** for coordinate system and animation
2. **Use slot props utilities** for coordinate conversions
3. **Follow the established props pattern** for consistency
4. **Implement proper TypeScript typing** throughout

### Time Integration

All components should accept a `time` prop and integrate with the control panel:

```typescript
interface Props {
  time?: Date
  enableAnimation?: boolean
  // ... other props
}

const props = withDefaults(defineProps<Props>(), {
  time: () => new Date(),
  enableAnimation: true
})
```

### Rotation Direction

All traditional ring components should support the `rotationDirection` prop for consistent text orientation:

```typescript
interface Props {
  rotationDirection?: 'clockwise' | 'counterclockwise'
  // ... other props
}

const props = withDefaults(defineProps<Props>(), {
  rotationDirection: 'clockwise'
})
```

### Animation System

Use the `useAnimation` composable for consistent animation behavior:

```typescript
import { useAnimation } from '@/composables/useAnimation'

const { isAnimating, animationSpeed, startAnimation, stopAnimation } = useAnimation()
```

## Current Refactoring Status

The project is currently in the "重构天文体系" (Refactoring Astronomical System) phase.

**✅ Completed refactoring (actively used):**
- PolarCanvas - Base polar coordinate system
- DegreeScale - Flexible degree scale component (replaces CircleScale)
- SolarEcliptic - Solar position with astronomy-engine integration
- Control - Unified control panel with rotation controls
- TwentyFourSolarTerms - 24 solar terms with astronomical precision
- TwentyEightConstellations - 28 constellations with proper rotation
- tianggankongwang - Heavenly stems with void positions, customizable props

**⏸️ Legacy components (available but not in current App.vue):**
- SixtyJiazi - 60 Jiazi system (functional, ready to enable)
- HeavenlyStems - 10 heavenly stems (functional, ready to enable)
- EightGates - 8 gates system (functional, ready to enable)
- TwelveLongevity - 12 longevity stages (functional, ready to enable)
- SiXiang - Four celestial symbols (functional, ready to enable)

**🆕 Recent additions:**
- Lunar orbit/white path (白道) system with OrbitSystem component
- Rotation direction and angle controls (commit 7bd9fb8, 8cb2230)
- GitHub Pages deployment workflow (commit d1bffce, c835a8a)

When working with legacy components, they can be enabled by uncommenting in [App.vue](src/App.vue) and do not necessarily require refactoring unless adding new features.

## Key Files for Understanding

- `README.md` - Comprehensive project documentation in Chinese
- `COMPONENT_DOCUMENTATION.md` - Detailed API documentation for all components
- `astronomy-engine-usage.md` - Specific guide for astronomy-engine integration
- `src/components/base/PolarCanvas.vue` - Base coordinate system
- `src/components/SolarEcliptic.vue` - Example of astronomy-engine integration
- `src/components/base/OrbitSystem.vue` - Orbital visualization (lunar system)
- `src/App.vue` - Main application showing current component configuration

## Testing Strategy

- **Unit tests** for utility functions and calculation logic using Vitest
- **Component tests** for rendering and interaction using Vue Test Utils
- **E2E tests** for complete user workflows using Playwright
- **Type checking** with vue-tsc for type safety

## Performance Considerations

- Use **computed properties** to cache expensive calculations
- **Debounce** frequent updates (especially time-based animations)
- Optimize **SVG rendering** by minimizing DOM nodes
- Use **v-show** vs **v-if** appropriately for conditional rendering

## Deployment

The project is configured for GitHub Pages deployment:

```bash
# Build and deploy to GitHub Pages
npm run deploy
```

This command:
1. Runs the production build (`npm run build`)
2. Publishes the `dist/` directory to the `gh-pages` branch
3. GitHub Actions automatically deploy from gh-pages to GitHub Pages

The deployment workflow is configured in `.github/workflows/`.