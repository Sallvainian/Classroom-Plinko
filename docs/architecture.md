# Architecture Documentation

## Executive Summary

Plinko Game is a statically-generated single-page application built with SvelteKit. The architecture emphasizes performance through client-side physics simulation, reactive state management, and efficient rendering patterns.

**Key Architectural Decisions:**
- Static site generation for fast load times and global CDN deployment
- Matter.js for deterministic physics simulation
- Svelte stores for centralized, reactive state management
- Component composition with clear separation of concerns
- Local storage for persistence without backend dependency

## Architecture Pattern

**Pattern:** Single Page Application (SPA) with Static Site Generation
**Deployment Model:** JAMstack (JavaScript, APIs, Markup)
**State Management:** Centralized reactive stores (Svelte)
**Rendering:** Client-side with SSG pre-rendering

### Architecture Diagram

```
┌─────────────────────────────────────────────────────────┐
│              Browser (Client-Side Only)                  │
├─────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌──────────────┐  ┌────────────────┐ │
│  │   Routes    │  │  Components  │  │   UI Layer     │ │
│  │ +page.svelte│◄─┤  (Svelte)    │◄─┤   bits-ui      │ │
│  │ +layout.     │  │  - Plinko    │  │   Tailwind     │ │
│  └──────┬───────┘  │  - Sidebar   │  └────────────────┘ │
│         │          │  - Settings  │                      │
│         ▼          └───────┬──────┘                      │
│  ┌──────────────────────┐ │                              │
│  │   Svelte Stores      │◄┘                              │
│  │  (State Management)  │                                │
│  │  - game.ts           │                                │
│  │  - settings.ts       │                                │
│  │  - layout.ts         │                                │
│  └──────────┬───────────┘                                │
│             │                                             │
│             ▼                                             │
│  ┌──────────────────────┐      ┌─────────────────┐      │
│  │  PlinkoEngine        │◄─────┤   Matter.js     │      │
│  │  (Game Logic)        │      │  (Physics)      │      │
│  └──────────┬───────────┘      └─────────────────┘      │
│             │                                             │
│             ▼                                             │
│  ┌──────────────────────┐                                │
│  │   Local Storage      │                                │
│  │  - Balance           │                                │
│  │  - Settings          │                                │
│  └──────────────────────┘                                │
└─────────────────────────────────────────────────────────┘
```

## Component Architecture

### Core Components

**Plinko/** - Main game engine and visualization
- `PlinkoEngine.ts` - Physics simulation controller
- `PlinkoCanvas.svelte` - Canvas renderer for pins and balls
- `Plinko.svelte` - Main game component orchestrator

**Sidebar/** - Game controls and information
- `BetControls.svelte` - Betting interface
- `GameConfig.svelte` - Row count and risk level settings
- `GameHistory.svelte` - Win history display

**SettingsWindow/** - User preferences
- `AnimationSettings.svelte` - Visual settings
- `SettingsPanel.svelte` - Settings UI container

**LiveStatsWindow/** - Real-time analytics
- `ProbabilityChart.svelte` - Distribution visualization
- `StatsTable.svelte` - Numerical statistics display

**ui/** - Reusable UI primitives
- `Button.svelte` - Styled button component
- `Input.svelte` - Form input component
- `Modal.svelte` - Modal dialog component
- `Select.svelte` - Dropdown select component

## Data Flow

### Game Initialization

```
User loads page
    ↓
SvelteKit renders static HTML
    ↓
Client hydrates JavaScript
    ↓
Load balance from localStorage
    ↓
Initialize Plinko Engine (Matter.js)
    ↓
Subscribe to store updates
    ↓
Ready for gameplay
```

### Bet Placement Flow

```
User clicks "Drop" or "Auto Bet"
    ↓
Validate bet amount ≤ balance
    ↓
Deduct bet from balance store
    ↓
Create ball in PlinkoEngine
    ↓
Matter.js simulates physics
    ↓
Ball lands in bin
    ↓
Calculate payout (multiplier × bet)
    ↓
Update balance, winRecords, totalProfitHistory stores
    ↓
Trigger UI updates (reactive)
    ↓
Save balance to localStorage on page unload
```

## State Management

### Store Architecture

**game.ts** - Core game state
- `plinkoEngine` - Engine instance reference
- `betAmount` - Current bet value
- `rowCount` - Number of pin rows (8-16)
- `riskLevel` - Payout volatility (LOW/MEDIUM/HIGH)
- `balance` - Player's current balance
- `winRecords` - Array of all win history
- `totalProfitHistory` - Cumulative profit over time
- `binColors` - Derived store for bin color gradients
- `binProbabilities` - Derived store for observed probabilities

**settings.ts** - User preferences
- `animationEnabled` - Toggle physics animation
- Persisted to localStorage

**layout.ts** - UI state
- `sidebarVisible` - Sidebar visibility
- `settingsOpen` - Settings panel state
- `statsOpen` - Stats panel state

### Reactivity Model

Svelte's reactive stores enable automatic UI updates:

```typescript
// Change to balance triggers:
$: balance.set(newValue)
    ↓
// All subscribers auto-update:
- Balance display component
- Bet amount validation
- Game enable/disable logic
```

## Physics Simulation

### Matter.js Integration

**PlinkoEngine.ts** orchestrates the physics:

1. **World Creation** - Static environment setup
   - Gravity configuration
   - Collision detection
   - World boundaries

2. **Pin Grid Generation** - Triangular peg layout
   - Row count determines grid size
   - Fixed spacing for consistent physics

3. **Ball Dynamics** - Realistic motion
   - Initial velocity at drop point
   - Collision with pins
   - Settling in bins

4. **Event System** - Game state updates
   - `ballEntered` event when ball lands
   - Triggers payout calculation
   - Updates stores

### Performance Optimizations

- Canvas-based rendering (not DOM)
- RequestAnimationFrame for smooth 60fps
- Limit max concurrent balls (performance threshold)
- Optional animation disable for auto-bet

## Data Persistence

### Local Storage Strategy

**Balance** - Saved on browser `beforeunload` event
- Avoids excessive writes on every update
- Improves performance on low-end devices

**Settings** - Saved immediately on change
- Small data footprint
- Infrequent updates

```typescript
// Balance persistence pattern
browser.addEventListener('beforeunload', () => {
  localStorage.setItem(
    LOCAL_STORAGE_KEY.BALANCE,
    JSON.stringify($balance)
  );
});
```

## Build & Deployment Architecture

### Build Process

```
Source Code (TypeScript + Svelte)
    ↓
Vite preprocessing
    ↓
SvelteKit compilation
    ↓
Tailwind CSS processing
    ↓
Bundle optimization
    ↓
Static HTML/CSS/JS output
    ↓
Deploy to CDN (GitHub Pages)
```

### Output Structure

```
build/
├── index.html                 # Pre-rendered HTML
├── _app/
│   ├── immutable/
│   │   ├── chunks/            # Code-split chunks
│   │   ├── assets/            # CSS and static assets
│   │   └── entry/             # Application entry points
│   └── version.json           # Build version
└── favicon.png
```

## Testing Strategy

### Unit Tests (Vitest)
- **Utilities** - Number formatting, color interpolation
- **Store Logic** - Derived calculations
- **Game Constants** - Payout multipliers

Test files: `src/lib/utils/__tests__/*.test.ts`

### E2E Tests (Playwright)
- Game load and initialization
- Bet placement flows
- Settings changes
- Balance persistence

Test files: `tests/*.spec.ts`

## Security Considerations

1. **No Server-Side** - No API endpoints to secure
2. **Client-Side Only** - No sensitive data transmission
3. **Local Storage** - Only stores game balance (not financial)
4. **Static Deployment** - No injection vulnerabilities
5. **Content Security Policy** - Configured via meta tags

## Performance Characteristics

- **Initial Load**: <500ms (pre-rendered HTML)
- **Time to Interactive**: <1s (static SPA)
- **Physics FPS**: 60fps target
- **Bundle Size**: ~150KB gzipped
- **Lighthouse Score**: 95+ (Performance, Accessibility, SEO)

## Future Architecture Considerations

**Multiplayer Support** (would require backend)
- WebSocket server for real-time state sync
- Player sessions and matchmaking
- Leaderboard persistence

**Mobile App** (using existing codebase)
- Capacitor wrapper for iOS/Android
- Native UI adaptations
- App store deployment

---

*Generated: 2025-10-22*
*Architecture Version: 1.0*
