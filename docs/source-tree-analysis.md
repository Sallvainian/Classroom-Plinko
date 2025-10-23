# Source Tree Analysis

## Project Directory Structure

```
Classroom-Plinko/
├── .github/                          # GitHub workflows and configuration
│   └── workflows/
│       └── deploy.yml                # CI/CD for GitHub Pages deployment
│
├── bmad/                             # BMad Method framework (workflow tooling)
│   ├── bmb/                          # BMad Builder module
│   ├── bmm/                          # BMad Method module
│   ├── cis/                          # Creative Innovation Strategy module
│   ├── core/                         # Core BMad workflows
│   └── docs/                         # BMad framework documentation
│
├── docs/                             # **Project documentation** (generated)
│   ├── index.md                      # Master documentation index
│   ├── architecture.md               # Architecture documentation
│   ├── project-overview.md           # Project overview
│   ├── source-tree-analysis.md       # This file
│   ├── component-inventory.md        # UI component catalog
│   ├── development-guide.md          # Dev setup and workflows
│   ├── data-models.md                # Data structures and types
│   └── bmm-workflow-status.md        # Workflow tracking
│
├── screenshots/                      # Marketing and demo assets
│   └── *.png                         # Game screenshots
│
├── src/                              # **Application source code**
│   ├── routes/                       # SvelteKit file-based routing
│   │   ├── +page.svelte              # 🎯 Main game page (entry point)
│   │   ├── +layout.svelte            # Root layout wrapper
│   │   ├── +layout.ts                # Layout load function
│   │   └── benchmark/                # Performance testing mode
│   │       ├── +layout.ts            # Benchmark layout config
│   │       └── +page.svelte          # Benchmark page
│   │
│   ├── lib/                          # Reusable library code
│   │   ├── components/               # 🧩 Svelte UI components
│   │   │   ├── Balance.svelte        # Balance display
│   │   │   ├── BinsDistribution.svelte # Win distribution chart
│   │   │   ├── LiveStatsWindow/      # Real-time statistics panel
│   │   │   ├── Plinko/               # **Main game component**
│   │   │   │   ├── Plinko.svelte     # Game orchestrator
│   │   │   │   ├── PlinkoCanvas.svelte # Canvas renderer
│   │   │   │   ├── PlinkoEngine.ts   # 🎮 Physics engine controller
│   │   │   │   └── PlinkoPin.svelte  # Pin component
│   │   │   ├── SettingsWindow/       # User settings panel
│   │   │   ├── Sidebar/              # Game controls sidebar
│   │   │   │   ├── BetControls.svelte # Bet interface
│   │   │   │   ├── GameConfig.svelte # Game configuration
│   │   │   │   └── GameHistory.svelte # Win history
│   │   │   └── ui/                   # Reusable UI primitives
│   │   │       ├── Button.svelte
│   │   │       ├── Input.svelte
│   │   │       ├── Modal.svelte
│   │   │       └── Select.svelte
│   │   │
│   │   ├── stores/                   # 📦 Svelte stores (state)
│   │   │   ├── game.ts               # 🎲 Core game state
│   │   │   ├── settings.ts           # User preferences
│   │   │   └── layout.ts             # UI layout state
│   │   │
│   │   ├── utils/                    # Utility functions
│   │   │   ├── colors.ts             # Color interpolation
│   │   │   ├── numbers.ts            # Number utilities
│   │   │   ├── game.ts               # Game helpers
│   │   │   ├── settings.ts           # Settings helpers
│   │   │   ├── transitions.ts        # Svelte transitions
│   │   │   └── __tests__/            # Unit tests
│   │   │       ├── colors.test.ts
│   │   │       └── numbers.test.ts
│   │   │
│   │   ├── types/                    # TypeScript type definitions
│   │   │   ├── index.ts              # Type exports
│   │   │   └── game.ts               # Game-specific types
│   │   │
│   │   └── constants/                # Configuration constants
│   │       └── game.ts               # 🎯 Game constants (payouts, rows)
│   │
│   ├── app.html                      # HTML template
│   ├── app.css                       # Global styles
│   └── app.d.ts                      # TypeScript declarations
│
├── static/                           # Static assets
│   ├── favicon.png                   # Site icon
│   └── robots.txt                    # SEO crawler config
│
├── tests/                            # E2E tests (Playwright)
│   └── *.spec.ts                     # Test specifications
│
├── .claude/                          # Claude Code configuration
├── .git/                             # Git repository
├── .github/                          # GitHub configuration
│
├── package.json                      # 📦 NPM package manifest
├── pnpm-lock.yaml                    # Dependency lock file
├── tsconfig.json                     # TypeScript configuration
├── svelte.config.js                  # SvelteKit configuration
├── vite.config.ts                    # Vite build configuration
├── tailwind.config.js                # Tailwind CSS configuration
├── playwright.config.ts              # Playwright test configuration
├── postcss.config.js                 # PostCSS configuration
├── .eslintrc.cjs                     # ESLint configuration
├── .prettierrc                       # Prettier configuration
└── README.md                         # Project README
```

## Critical Directories

### `/src/routes/` - Application Pages
**Purpose:** SvelteKit file-based routing
**Entry Point:** `+page.svelte` (main game)
**Structure:**
- `+page.svelte` files define pages
- `+layout.svelte` files define layouts
- `+layout.ts` and `+page.ts` for data loading

### `/src/lib/components/` - UI Components
**Purpose:** Reusable Svelte components
**Key Components:**
- **Plinko/** - Core game engine and visualization (physics)
- **Sidebar/** - Game controls (betting, configuration, history)
- **SettingsWindow/** - User preferences
- **LiveStatsWindow/** - Real-time analytics
- **ui/** - Shared UI primitives (buttons, inputs, modals)

### `/src/lib/stores/` - State Management
**Purpose:** Centralized reactive state (Svelte stores)
**Files:**
- `game.ts` - Game state (balance, bets, wins, engine reference)
- `settings.ts` - User settings (animations, preferences)
- `layout.ts` - UI layout state (sidebar, panels)

### `/src/lib/types/` - Type Definitions
**Purpose:** TypeScript interfaces and enums
**Key Types:**
- `BetMode` - MANUAL | AUTO
- `RiskLevel` - LOW | MEDIUM | HIGH
- `RowCount` - 8-16 (pin rows)
- `WinRecord` - Bet outcome data structure

### `/src/lib/constants/` - Configuration
**Purpose:** Game configuration and constants
**Contents:**
- Payout multipliers by row count and risk level
- Bin probabilities (Pascal's triangle)
- Color gradients for bins
- Row count options (8-16)

### `/src/lib/utils/` - Utilities
**Purpose:** Pure helper functions
**Modules:**
- `colors.ts` - RGB interpolation for bin colors
- `numbers.ts` - Probability calculations
- `game.ts` - Game logic helpers
- `settings.ts` - LocalStorage helpers
- `transitions.ts` - Svelte animation transitions

## File Naming Conventions

### SvelteKit Routes
- `+page.svelte` - Page component
- `+layout.svelte` - Layout wrapper
- `+page.ts` / `+layout.ts` - Data loading/config
- `+page.server.ts` - Server-side logic (not used in this project)

### Components
- `PascalCase.svelte` - Svelte components
- `camelCase.ts` - TypeScript modules
- `__tests__/` - Test directories
- `*.test.ts` / `*.spec.ts` - Test files

## Integration Points

### Matter.js Physics
**Location:** `src/lib/components/Plinko/PlinkoEngine.ts`
**Integration:** Creates Matter.js world, manages ball physics
**Communication:** Event-driven (ball land events → store updates)

### Local Storage
**Location:** `src/lib/constants/game.ts` (keys), `src/lib/utils/settings.ts` (helpers)
**Keys:**
- `plinko_balance` - Player balance
- `plinko_settings_animation` - Animation preference
**Strategy:** Write on `beforeunload` for balance, immediate for settings

### Chart.js Visualization
**Location:** `src/lib/components/LiveStatsWindow/`
**Purpose:** Real-time probability distribution charts
**Data Source:** Derived from `winRecords` store

## Build Artifacts

**Output:** `build/` directory (gitignored)
**Structure:**
```
build/
├── index.html                # Pre-rendered entry point
├── _app/
│   ├── immutable/            # Cached assets (versioned)
│   │   ├── chunks/           # JavaScript bundles
│   │   ├── assets/           # CSS and images
│   │   └── entry/            # Entry points
│   └── version.json          # Build metadata
└── favicon.png               # Copied from static/
```

## Development vs Production

### Development (`pnpm dev`)
- Hot module replacement (HMR)
- Source maps enabled
- No minification
- Dev server on port 5173

### Production (`pnpm build`)
- Minification and tree-shaking
- Code splitting
- CSS extraction and optimization
- Static HTML generation
- Asset fingerprinting for cache busting

---

*Generated: 2025-10-22*
*Source Tree Version: 1.0*
