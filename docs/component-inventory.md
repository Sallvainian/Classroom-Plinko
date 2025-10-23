# Component Inventory

## Overview

This document catalogs all Svelte components in the Plinko game, organized by category and purpose.

---

## Game Components

### Plinko/ (Main Game Engine)

**`Plinko.svelte`**
- **Purpose:** Main game orchestrator component
- **Props:** None (uses stores)
- **State:** Manages game engine lifecycle
- **Key Features:**
  - Initializes PlinkoEngine
  - Handles bet placement
  - Manages auto-bet mode
  - Coordinates canvas rendering
- **Location:** `src/lib/components/Plinko/Plinko.svelte`

**`PlinkoCanvas.svelte`**
- **Purpose:** Canvas renderer for pins and balls
- **Props:** `engine: PlinkoEngine`, `width: number`, `height: number`
- **Features:**
  - 60fps rendering loop
  - Draws pin grid
  - Renders active balls
  - Draws bins with gradient colors
- **Location:** `src/lib/components/Plinko/PlinkoCanvas.svelte`

**`PlinkoEngine.ts`** ⚠️ (Not a component - TypeScript class)
- **Purpose:** Physics engine controller using Matter.js
- **Methods:**
  - `createBall(x)` - Spawn ball at position
  - `update()` - Physics step
  - `destroy()` - Cleanup
- **Events:**
  - `ballEntered` - Emitted when ball lands in bin
- **Location:** `src/lib/components/Plinko/PlinkoEngine.ts`

**`PlinkoPin.svelte`**
- **Purpose:** Individual pin visualization
- **Props:** `x: number`, `y: number`, `radius: number`
- **Features:** Simple SVG circle with glow effect
- **Location:** `src/lib/components/Plinko/PlinkoPin.svelte`

---

## Control Components (Sidebar/)

### Betting Controls

**`Sidebar.svelte`**
- **Purpose:** Main sidebar container
- **Features:**
  - Responsive collapse on mobile
  - Contains all betting and configuration controls
- **Location:** `src/lib/components/Sidebar/Sidebar.svelte`

**`BetControls.svelte`**
- **Purpose:** Bet amount and drop/auto-bet controls
- **Features:**
  - Bet amount input with validation
  - Manual "Drop" button
  - Auto-bet toggle with speed control
  - Balance validation
- **State:** Subscribes to `balance`, `betAmount`, `plinkoEngine` stores
- **Location:** `src/lib/components/Sidebar/BetControls.svelte`

**`GameConfig.svelte`**
- **Purpose:** Row count and risk level configuration
- **Features:**
  - Row count selector (8-16)
  - Risk level selector (Low/Medium/High)
  - Real-time payout preview
- **State:** Subscribes to `rowCount`, `riskLevel` stores
- **Location:** `src/lib/components/Sidebar/GameConfig.svelte`

**`GameHistory.svelte`**
- **Purpose:** Recent win history display
- **Features:**
  - Last 10 wins shown
  - Profit/loss highlighting
  - Payout multiplier display
- **State:** Subscribes to `winRecords` store
- **Location:** `src/lib/components/Sidebar/GameHistory.svelte`

---

## Information Display Components

### Balance

**`Balance.svelte`**
- **Purpose:** Current balance display
- **Features:**
  - Large, prominent number
  - Color coding (green when profitable)
  - Currency formatting
- **State:** Subscribes to `balance` store
- **Location:** `src/lib/components/Balance.svelte`

### Statistics

**`BinsDistribution.svelte`**
- **Purpose:** Bar chart of bin hit frequency
- **Features:**
  - Chart.js visualization
  - Theoretical vs. actual probabilities
  - Color-coded bins matching game colors
- **State:** Subscribes to `binProbabilities`, `rowCount` stores
- **Location:** `src/lib/components/BinsDistribution.svelte`

**`LiveStatsWindow/`**
- **Purpose:** Detailed statistics panel
- **Components:**
  - `LiveStatsWindow.svelte` - Container
  - `ProbabilityChart.svelte` - Distribution chart
  - `StatsTable.svelte` - Numerical statistics
- **Features:**
  - Win/loss ratio
  - Average multiplier
  - Total games played
  - Profit over time chart
- **Location:** `src/lib/components/LiveStatsWindow/`

---

## Settings Components (SettingsWindow/)

**`SettingsWindow.svelte`**
- **Purpose:** User preferences panel
- **Features:**
  - Modal dialog
  - Tabbed interface for categories
- **Location:** `src/lib/components/SettingsWindow/SettingsWindow.svelte`

**`AnimationSettings.svelte`**
- **Purpose:** Physics animation toggle
- **Features:**
  - Enable/disable ball animation
  - Performance optimization for auto-bet
- **State:** Subscribes to `settings` store
- **Location:** `src/lib/components/SettingsWindow/AnimationSettings.svelte`

**`SettingsPanel.svelte`**
- **Purpose:** Settings category container
- **Props:** `title: string`, `description: string`
- **Features:** Consistent layout for settings sections
- **Location:** `src/lib/components/SettingsWindow/SettingsPanel.svelte`

---

## Reusable UI Components (ui/)

### Form Controls

**`Button.svelte`**
- **Purpose:** Styled button component
- **Props:**
  - `variant?: 'primary' | 'secondary' | 'danger'`
  - `size?: 'sm' | 'md' | 'lg'`
  - `disabled?: boolean`
- **Features:**
  - Tailwind-based styling
  - Hover and active states
  - Loading state support
- **Location:** `src/lib/components/ui/Button.svelte`

**`Input.svelte`**
- **Purpose:** Text/number input field
- **Props:**
  - `type?: 'text' | 'number' | 'email'`
  - `value: string | number`
  - `placeholder?: string`
  - `min?: number`, `max?: number` (for number inputs)
- **Features:**
  - Validation styling
  - Label support
  - Error message display
- **Location:** `src/lib/components/ui/Input.svelte`

**`Select.svelte`**
- **Purpose:** Dropdown select component
- **Props:**
  - `options: Array<{value: any, label: string}>`
  - `value: any`
- **Features:**
  - Custom styling
  - Keyboard navigation
- **Location:** `src/lib/components/ui/Select.svelte`

### Overlays

**`Modal.svelte`**
- **Purpose:** Modal dialog container
- **Props:**
  - `open: boolean`
  - `title?: string`
- **Features:**
  - Backdrop overlay
  - Escape key to close
  - Click outside to close
  - Accessibility (focus trap, ARIA)
- **Location:** `src/lib/components/ui/Modal.svelte`

**`Toast.svelte`**
- **Purpose:** Notification toast message
- **Props:**
  - `message: string`
  - `type?: 'info' | 'success' | 'warning' | 'error'`
  - `duration?: number` (ms)
- **Features:**
  - Auto-dismiss
  - Slide-in animation
  - Stacking support
- **Location:** `src/lib/components/ui/Toast.svelte`

---

## Layout Components

**`+layout.svelte` (Root Layout)**
- **Purpose:** Application-wide layout wrapper
- **Features:**
  - Global styles
  - Balance persistence on unload
  - Meta tags and SEO
- **Location:** `src/routes/+layout.svelte`

---

## Component Dependencies

### Dependency Graph

```
Plinko.svelte
├── PlinkoCanvas.svelte
│   └── PlinkoEngine.ts (Matter.js)
├── PlinkoPin.svelte
├── Balance.svelte
├── Sidebar/
│   ├── BetControls.svelte
│   │   ├── Button.svelte
│   │   └── Input.svelte
│   ├── GameConfig.svelte
│   │   └── Select.svelte
│   └── GameHistory.svelte
├── SettingsWindow/
│   ├── Modal.svelte
│   ├── AnimationSettings.svelte
│   └── SettingsPanel.svelte
└── LiveStatsWindow/
    ├── ProbabilityChart.svelte (Chart.js)
    └── StatsTable.svelte
```

### External Dependencies

- **Matter.js** - Physics simulation (PlinkoEngine.ts)
- **Chart.js** - Statistics charts (ProbabilityChart.svelte, BinsDistribution.svelte)
- **bits-ui** - Accessible component primitives (Modal, Select base)
- **Tailwind CSS** - Utility styling (all components)

---

## Component Categories Summary

| Category | Count | Purpose |
|----------|-------|---------|
| Game Components | 4 | Core gameplay and physics |
| Control Components | 4 | User input and configuration |
| Information Display | 4 | Stats and data visualization |
| Settings Components | 3 | User preferences |
| UI Primitives | 5 | Reusable form and overlay components |
| Layout Components | 1 | Application structure |
| **Total** | **21** | Complete component inventory |

---

## Component Design Patterns

### State Management Pattern
All game components use **Svelte stores** for state:
```svelte
<script>
  import { balance, betAmount } from '$lib/stores/game';
</script>

<div>Balance: ${$balance}</div>
```

### Event Communication Pattern
Components use **custom events** for inter-component communication:
```typescript
// PlinkoEngine.ts
this.eventTarget.dispatchEvent(new CustomEvent('ballEntered', {
  detail: { binIndex, payout }
}));
```

### Composition Pattern
Complex components use **slot composition**:
```svelte
<!-- Modal.svelte -->
<div class="modal">
  <h2>{title}</h2>
  <slot></slot> <!-- Content injected here -->
</div>
```

---

*Generated: 2025-10-22*
*Component Inventory Version: 1.0*
