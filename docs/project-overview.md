# Plinko Game - Project Overview

## Project Summary

**Plinko Game Online** is a browser-based implementation of the classic arcade Plinko game. Players drop discs from the top of a peg board and watch them bounce through pins to land in bins with different payout multipliers.

**Project Type:** Web Application (SPA)
**Repository Structure:** Monolith
**Primary Language:** TypeScript
**Framework:** SvelteKit with Static Site Generation

## Quick Reference

### Technology Stack

| Category | Technology | Version | Purpose |
|----------|-----------|---------|---------|
| Framework | SvelteKit | ^2.0.0 | Web application framework |
| Language | TypeScript | ^5.0.0 | Type-safe development |
| Build Tool | Vite | ^5.0.3 | Fast development and bundling |
| Physics Engine | Matter.js | ^0.19.0 | Realistic physics simulation |
| Styling | Tailwind CSS | ^3.4.3 | Utility-first CSS framework |
| UI Components | bits-ui | ^0.21.7 | Accessible component primitives |
| State Management | Svelte Stores | Built-in | Reactive state management |
| Testing (Unit) | Vitest | ^1.2.0 | Fast unit testing |
| Testing (E2E) | Playwright | ^1.44.0 | End-to-end testing |
| Charting | Chart.js | ^4.4.2 | Statistics visualization |

### Architecture Type

**Single Page Application (SPA)** with:
- Static site generation (SSG) for deployment
- Client-side routing via SvelteKit
- Component-based architecture
- Reactive state management

### Entry Points

- **Main Application**: `src/routes/+page.svelte`
- **Layout**: `src/routes/+layout.svelte`
- **Benchmark Mode**: `src/routes/benchmark/+page.svelte`

### Key Features

1. **Physics-Based Gameplay** - Matter.js provides realistic ball physics
2. **Multiple Game Modes** - Manual and auto-bet modes
3. **Risk Levels** - Low, Medium, High volatility options
4. **Variable Difficulty** - 8-16 pin rows configurable
5. **Live Statistics** - Real-time probability tracking and visualization
6. **Persistent Balance** - Local storage for game progress
7. **Responsive Design** - Works on desktop and mobile

## Project Structure

```
Classroom-Plinko/
├── src/
│   ├── routes/               # SvelteKit routes
│   │   ├── +page.svelte     # Main game page
│   │   ├── +layout.svelte   # Root layout
│   │   └── benchmark/       # Performance testing mode
│   ├── lib/
│   │   ├── components/      # Reusable UI components
│   │   ├── stores/          # Svelte stores (state)
│   │   ├── utils/           # Utility functions
│   │   ├── types/           # TypeScript type definitions
│   │   └── constants/       # Game configuration constants
│   ├── app.html             # HTML template
│   └── app.css              # Global styles
├── static/                  # Static assets
├── tests/                   # E2E tests
├── screenshots/             # Marketing assets
└── bmad/                    # BMad workflow framework
```

## Development Workflow

### Prerequisites
- Node.js >=20
- pnpm package manager

### Commands

```bash
# Install dependencies
pnpm install

# Development server
pnpm dev

# Build for production
pnpm build

# Preview production build
pnpm preview

# Run all tests
pnpm test

# Unit tests
pnpm test:unit

# E2E tests
pnpm test:e2e

# Code quality
pnpm lint
pnpm format
pnpm check
```

## Links to Detailed Documentation

- [Architecture Documentation](./architecture.md)
- [Source Tree Analysis](./source-tree-analysis.md)
- [Component Inventory](./component-inventory.md)
- [Development Guide](./development-guide.md)
- [Data Models](./data-models.md)

---

*Generated: 2025-10-22*
*Documentation Version: 1.0*
