# Data Models and Types

## Overview

This document describes all TypeScript interfaces, enums, and type definitions used in the Plinko game.

---

## Core Game Types

### BetMode

```typescript
export enum BetMode {
  MANUAL = 'MANUAL',  // Player clicks to drop each ball
  AUTO = 'AUTO',      // Automated ball dropping at intervals
}
```

**Usage:** Controls whether player manually drops balls or uses auto-bet mode.

**Consumers:**
- `BetControls.svelte` - Toggle between modes
- `Plinko.svelte` - Auto-bet logic

---

### RiskLevel

```typescript
export enum RiskLevel {
  LOW = 'LOW',       // Low volatility, consistent small wins
  MEDIUM = 'MEDIUM', // Balanced risk/reward
  HIGH = 'HIGH',     // High volatility, rare big wins
}
```

**Purpose:** Controls payout multiplier volatility

**Impact on Gameplay:**
- **LOW**: Smoother payouts, lower max multiplier
- **MEDIUM**: Balanced distribution
- **HIGH**: Extreme payouts (1000x possible on 16 rows)

**Payout Tables:** Defined in `src/lib/constants/game.ts` - `binPayouts` object

**Consumers:**
- `GameConfig.svelte` - Risk level selector
- `Plinko.svelte` - Payout calculation
- `constants/game.ts` - Multiplier lookup

---

### RowCount

```typescript
export type RowCount = 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;
```

**Purpose:** Number of pin rows in the game board

**Impact:**
- More rows = more bins = higher max payouts
- 8 rows → 9 bins
- 16 rows → 17 bins

**Validation:**
- Must be one of `rowCountOptions` from `constants/game.ts`
- Enforced at compile-time via TypeScript literal type

**Consumers:**
- `GameConfig.svelte` - Row count selector
- `PlinkoEngine.ts` - Pin grid generation
- `binPayouts` constant - Multiplier lookup

---

## Win Record Types

### WinRecord

```typescript
export type WinRecord = {
  /**
   * UUID of the win record (unique identifier)
   */
  id: string;

  /**
   * How much the player bet on this drop
   */
  betAmount: number;

  /**
   * Number of pin rows at the time of this win
   */
  rowCount: RowCount;

  /**
   * Zero-based index of which bin the ball fell into
   * (leftmost bin is 0, rightmost is rowCount)
   */
  binIndex: number;

  /**
   * Payout details
   */
  payout: {
    /**
     * Multiplier for the payout (e.g., 0.3, 1.5, 1000)
     * Looked up from binPayouts[rowCount][riskLevel][binIndex]
     */
    multiplier: number;

    /**
     * Actual payout amount = betAmount * multiplier
     */
    value: number;
  };

  /**
   * Profit = payout.value - betAmount
   * Can be negative (loss)
   */
  profit: number;
};
```

**Purpose:** Records each bet outcome for history and statistics

**Storage:**
- Array in `winRecords` store (`src/lib/stores/game.ts`)
- Not persisted to localStorage (session-only)
- Used for probability calculations and UI display

**Consumers:**
- `GameHistory.svelte` - Recent wins display
- `LiveStatsWindow/` - Statistics calculations
- `BinsDistribution.svelte` - Probability chart

---

### BetAmountOfExistingBalls

```typescript
export type BetAmountOfExistingBalls = {
  [ballId: number]: number;
};
```

**Purpose:** Tracks bet amount for each active ball in motion

**Why Needed:**
- Multiple balls can be in motion simultaneously
- Each ball may have a different bet amount
- Need to know bet when ball lands for payout calculation

**Example:**
```typescript
{
  1234: 10,  // Ball #1234 has $10 bet
  1235: 5,   // Ball #1235 has $5 bet
}
```

**Lifecycle:**
1. Ball created → Add entry with ball ID and bet amount
2. Ball lands → Calculate payout, remove entry
3. Store always reflects active balls

**Storage:** `betAmountOfExistingBalls` store in `src/lib/stores/game.ts`

---

## Store Types

### Writable Stores

**Defined in:** `src/lib/stores/game.ts`

```typescript
// Engine instance reference
export const plinkoEngine = writable<PlinkoEngine | null>(null);

// Current bet amount (editable by user)
export const betAmount = writable<number>(1);

// Active balls and their bet amounts
export const betAmountOfExistingBalls = writable<BetAmountOfExistingBalls>({});

// Number of pin rows (8-16)
export const rowCount = writable<RowCount>(16);

// Game volatility level
export const riskLevel = writable<RiskLevel>(RiskLevel.MEDIUM);

// All win records (session-only, not persisted)
export const winRecords = writable<WinRecord[]>([]);

// Cumulative profit history for charting
export const totalProfitHistory = writable<number[]>([0]);

// Player balance (persisted to localStorage)
export const balance = writable<number>(200);
```

### Derived Stores

**Defined in:** `src/lib/stores/game.ts`

```typescript
// Bin colors (background and shadow) based on row count
export const binColors = derived<typeof rowCount, {
  background: string[];
  shadow: string[];
}>(
  rowCount,
  ($rowCount) => {
    // Interpolates from red to yellow for gradients
    // Returns RGB color strings for each bin
  }
);

// Observed bin probabilities from actual game data
export const binProbabilities = derived<
  [typeof winRecords, typeof rowCount],
  { [binIndex: number]: number }
>(
  [winRecords, rowCount],
  ([$winRecords, $rowCount]) => {
    // Calculates frequency of balls landing in each bin
    // Returns probability (0-1) for each bin index
  }
);
```

---

## Constant Types

### binPayouts

**Type:**
```typescript
Record<RowCount, Record<RiskLevel, number[]>>
```

**Structure:**
```typescript
{
  8: {
    LOW: [5.6, 2.1, 1.1, 1, 0.5, 1, 1.1, 2.1, 5.6],
    MEDIUM: [13, 3, 1.3, 0.7, 0.4, 0.7, 1.3, 3, 13],
    HIGH: [29, 4, 1.5, 0.3, 0.2, 0.3, 1.5, 4, 29]
  },
  // ... up to 16 rows
}
```

**Purpose:** Payout multipliers for each bin based on row count and risk level

**Array Index = Bin Index:**
- Index 0 = leftmost bin
- Index `rowCount` = rightmost bin
- Symmetric distribution (center bins have lowest multipliers)

**Location:** `src/lib/constants/game.ts`

---

### binProbabilitiesByRowCount

**Type:**
```typescript
Record<RowCount, number[]>
```

**Purpose:** Theoretical probabilities based on Pascal's triangle

**Example (8 rows):**
```typescript
{
  8: [0.00390625, 0.03125, 0.109375, 0.21875, 0.2734375, 0.21875, 0.109375, 0.03125, 0.00390625]
}
```

**Calculation:** Uses binomial distribution (Pascal's triangle)

**Location:** `src/lib/constants/game.ts`

---

## Color Types

### RgbColor

```typescript
type RgbColor = {
  r: number; // 0-255
  g: number; // 0-255
  b: number; // 0-255
};
```

**Purpose:** RGB color representation for interpolation

**Usage:**
- Bin color gradients (red → yellow)
- Color interpolation in `src/lib/utils/colors.ts`

---

## Local Storage Schema

### Keys

**Defined in:** `src/lib/constants/game.ts`

```typescript
export const LOCAL_STORAGE_KEY = {
  BALANCE: 'plinko_balance',
  SETTINGS: {
    ANIMATION: 'plinko_settings_animation',
  },
} as const;
```

### Data Format

**Balance:**
```json
{
  "key": "plinko_balance",
  "value": 200
}
```

**Animation Settings:**
```json
{
  "key": "plinko_settings_animation",
  "value": true
}
```

---

## Type Guards

### isValidRowCount

```typescript
function isValidRowCount(value: number): value is RowCount {
  return rowCountOptions.includes(value as RowCount);
}
```

**Purpose:** Runtime validation of row count

**Usage:**
```typescript
const userInput = 10;
if (isValidRowCount(userInput)) {
  // TypeScript knows userInput is RowCount here
  rowCount.set(userInput);
}
```

---

## Type Exports

**Main Export File:** `src/lib/types/index.ts`

```typescript
export { BetMode, RiskLevel, type WinRecord, type BetAmountOfExistingBalls } from './game';
export type { RowCount } from './game';
```

**Import Pattern:**
```typescript
import { BetMode, RiskLevel, type WinRecord } from '$lib/types';
```

---

## Data Flow Diagram

```
User Action
    ↓
Component Updates Store
    ↓
Store Value Changes
    ↓
Reactive Dependencies Update
    ↓
Derived Stores Recalculate
    ↓
UI Re-renders

Example:
User sets rowCount to 12
    ↓
rowCount.set(12)
    ↓
binColors derived store recalculates (12+1=13 bins)
    ↓
binProbabilities derived store recalculates
    ↓
PlinkoEngine regenerates pin grid (12 rows)
    ↓
UI shows 13 bins with new colors
```

---

## Type Safety Best Practices

1. **Use `type` for exports** (not `interface` unless extending)
   ```typescript
   export type WinRecord = { ... };  // ✅
   export interface WinRecord { ... } // ❌ (unless extending)
   ```

2. **Use enums for fixed sets**
   ```typescript
   enum RiskLevel { LOW, MEDIUM, HIGH }  // ✅
   type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH';  // ❌ (less type-safe)
   ```

3. **Use literal types for constants**
   ```typescript
   type RowCount = 8 | 9 | 10 | ... | 16;  // ✅ Compile-time validation
   ```

4. **Document complex types**
   ```typescript
   /**
    * Tracks bet amounts for balls currently in motion.
    * Key: Ball ID, Value: Bet amount
    */
   export type BetAmountOfExistingBalls = { [ballId: number]: number };
   ```

---

*Generated: 2025-10-22*
*Data Models Version: 1.0*
