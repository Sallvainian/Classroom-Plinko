# Classroom-Plinko - Technical Specification

**Author:** Frank
**Date:** 2025-10-22
**Project Level:** 1
**Project Type:** software
**Development Context:** brownfield

---

## Source Tree Structure

### Files to Create (New Components & Services)

```
src/lib/
├── components/
│   ├── Classroom/
│   │   ├── ClassPeriodSelector.svelte        # NEW: Six class period selection UI
│   │   ├── Leaderboard.svelte                # NEW: Three-column leaderboard sidebar
│   │   ├── TeacherAdminPanel.svelte          # NEW: Chip controls, undo, reset
│   │   └── ChipCounter.svelte                # NEW: Visual chip remaining display
│   └── ui/
│       └── ConfirmDialog.svelte               # NEW: Confirmation modal for resets
├── services/
│   ├── supabase.ts                            # NEW: Supabase client configuration
│   ├── offlineQueue.ts                        # NEW: IndexedDB queue with Dexie.js
│   └── syncService.ts                         # NEW: Auto-sync orchestration
├── stores/
│   └── classroom.ts                           # NEW: Class period state management
└── types/
    └── classroom.ts                           # NEW: Class, LeaderboardEntry types
```

### Files to Modify (Transform Existing Components)

```
src/lib/
├── components/
│   ├── Plinko/
│   │   ├── PlinkoEngine.ts                    # MODIFY: Collision handlers (multiply → add)
│   │   └── Plinko.svelte                      # MODIFY: Remove gambling UI, integrate class state
│   ├── Sidebar/
│   │   ├── BetControls.svelte                 # DELETE: Entire file (gambling feature)
│   │   ├── GameConfig.svelte                  # DELETE: Entire file (risk/row settings)
│   │   ├── GameHistory.svelte                 # MODIFY: Show recent point drops per class
│   │   └── Sidebar.svelte                     # MODIFY: Replace with classroom controls
│   └── SettingsWindow/
│       └── SettingsWindow.svelte              # MODIFY: Remove risk/row tabs, add admin tab
├── stores/
│   └── game.ts                                # MODIFY: Remove balance/bet, add points/class
├── types/
│   └── game.ts                                # MODIFY: Remove RiskLevel, BetMode types
├── constants/
│   └── game.ts                                # MODIFY: Replace binPayouts with fixed point slots
└── routes/
    └── +page.svelte                           # MODIFY: Remove betting UI, add leaderboard sidebar
```

### Files to Delete (Gambling Features)

```
src/lib/components/
├── Balance.svelte                             # DELETE: Balance display (gambling)
├── BinsDistribution.svelte                    # DELETE: Statistics chart (not needed for MVP)
└── LiveStatsWindow/                           # DELETE: Entire folder (gambling analytics)
    ├── LiveStatsWindow.svelte
    ├── ProbabilityChart.svelte
    └── StatsTable.svelte
```

### Database Schema (Supabase PostgreSQL)

```sql
-- Table: classes
CREATE TABLE classes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,                   -- "Period 1", "Period 2", etc.
  total_points INTEGER NOT NULL DEFAULT 0,      -- Cumulative points (persistent)
  chips_remaining INTEGER NOT NULL DEFAULT 5,   -- Daily chip allocation (resets midnight)
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),      -- Last midnight reset timestamp
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: drop_history (audit log, optional for MVP)
CREATE TABLE drop_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id UUID REFERENCES classes(id) ON DELETE CASCADE,
  slot_index INTEGER NOT NULL,                  -- Which slot (0-8)
  points_earned INTEGER NOT NULL,               -- Points from this drop
  dropped_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast leaderboard queries
CREATE INDEX idx_classes_total_points ON classes(total_points DESC);

-- Row Level Security (RLS) - allow all operations for now (single teacher)
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations" ON classes FOR ALL USING (true);
```

### IndexedDB Schema (Dexie.js)

```typescript
// Offline queue schema
interface QueuedOperation {
  id?: number;                    // Auto-increment
  operation: 'add_points' | 'subtract_chip' | 'reset_chips' | 'undo';
  class_id: string;               // UUID from Supabase
  payload: {
    points?: number;              // For add_points
    slot_index?: number;          // For add_points
    chips?: number;               // For subtract_chip
  };
  timestamp: number;              // Unix timestamp
  retry_count: number;            // Exponential backoff tracking
  synced: boolean;                // Sync status
}

// Dexie schema definition
db.version(1).stores({
  queue: '++id, synced, timestamp',
  classes_cache: 'id, name, total_points, chips_remaining'
});
```

---

## Technical Approach

### 1. Game Mechanics Transformation (Stories 1-4)

**Current State:** Gambling game with betting, multiplier slots, risk levels, balance tracking
**Target State:** Points-based competition with fixed-value slots, class period tracking

#### Approach:

1. **Remove Gambling Data Model** (Story 1)
   - Delete `balance`, `betAmount`, `riskLevel`, `betAmountOfExistingBalls` stores
   - Remove `RiskLevel` and `BetMode` enums from `types/game.ts`
   - Delete `binPayouts` multiplier table from `constants/game.ts`
   - Remove balance persistence from `+layout.svelte` (localStorage cleanup)

2. **Implement Fixed Point Slots** (Story 2)
   - Define new constant: `pointSlots = [100, 500, 1000, 0, 10000, 0, 1000, 500, 100]`
   - Update `PlinkoEngine.ts` collision detection to return `pointSlots[binIndex]` instead of multiplier
   - Remove row count configuration (fix at 16 rows permanently)
   - Update bin color gradients to reflect point values (green for high, yellow for medium, red for zero)

3. **Refactor Scoring Logic** (Story 3)
   - Change from: `newBalance = currentBalance + (betAmount * multiplier)`
   - Change to: `newPoints = currentPoints + pointSlots[binIndex]`
   - Update `Plinko.svelte` ball landing handler to add points to active class
   - Remove win/loss calculation (no bet to compare against)

4. **Update UI for Point Display** (Story 4)
   - Replace balance display with "Total Points: {classPoints}" for active class
   - Update slot labels to show point values (not multipliers)
   - Remove betting controls entirely (no bet amount input, no auto-bet)
   - Add simple "Drop Chip" button with chip count validation

### 2. Database Integration (Stories 5-7)

**Current State:** No persistence (balance only in localStorage)
**Target State:** Supabase cloud database with offline IndexedDB queue

#### Approach:

1. **Supabase Setup** (Story 5)
   - Create Supabase project at https://supabase.com
   - Install: `npm install @supabase/supabase-js@2.39.0`
   - Create `src/lib/services/supabase.ts`:
     ```typescript
     import { createClient } from '@supabase/supabase-js';
     const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
     const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
     export const supabase = createClient(supabaseUrl, supabaseAnonKey);
     ```
   - Add environment variables to `.env` (not committed to git)
   - Execute SQL schema in Supabase dashboard
   - Seed initial six classes: "Period 1" through "Period 6"

2. **IndexedDB Offline Queue** (Story 6)
   - Install: `npm install dexie@3.2.4`
   - Create `src/lib/services/offlineQueue.ts`:
     - `addToQueue(operation, class_id, payload)` - Queue operation
     - `getUnsynced()` - Retrieve pending operations
     - `markSynced(id)` - Mark operation as synced
   - Implement `src/lib/stores/classroom.ts`:
     - `activeClassId` - Currently selected class UUID
     - `classesCache` - Local copy of classes for offline mode
     - `syncStatus` - 'online' | 'offline' | 'syncing'

3. **Sync Service** (Story 7)
   - Create `src/lib/services/syncService.ts`:
     - `syncNow()` - Immediate sync attempt
     - `startAutoSync()` - Interval-based sync (every 60 seconds)
     - `handleOnlineEvent()` - Browser online event listener
   - Implement retry logic with exponential backoff (1s, 2s, 4s, 8s, 16s max)
   - Add sync status indicator in UI (green dot = synced, yellow = pending, red = offline)
   - Use Supabase real-time subscriptions for leaderboard updates:
     ```typescript
     supabase.channel('classes_changes')
       .on('postgres_changes', { event: '*', schema: 'public', table: 'classes' },
         payload => refreshLeaderboard(payload))
       .subscribe();
     ```

### 3. Classroom UI & Leaderboard (Stories 8-10)

**Current State:** Gambling sidebar with bet controls
**Target State:** Leaderboard sidebar with class selection and teacher admin

#### Approach:

1. **Class Period Selection** (Story 8)
   - Create `ClassPeriodSelector.svelte`:
     - Display six buttons: "Period 1" - "Period 6"
     - Highlight active class with Tailwind `ring-2 ring-blue-500`
     - On click: Update `activeClassId` store, load class from Supabase
   - Position at top of left sidebar
   - Persist selection in `sessionStorage` (not localStorage - resets daily)

2. **Leaderboard Sidebar** (Story 9)
   - Create `Leaderboard.svelte`:
     ```svelte
     <table class="w-full text-sm">
       <thead>
         <tr><th>Class</th><th>Points</th><th>Chips</th></tr>
       </thead>
       <tbody>
         {#each sortedClasses as cls}
           <tr class:highlight={cls.id === $activeClassId}>
             <td>{cls.name}</td>
             <td>{cls.total_points.toLocaleString()}</td>
             <td>{cls.chips_remaining}/5</td>
           </tr>
         {/each}
       </tbody>
     </table>
     ```
   - Sort by `total_points DESC`
   - Real-time updates via Supabase subscription
   - Always visible (not collapsible)
   - Position: Left sidebar, below class selector

3. **Teacher Admin Panel** (Story 10)
   - Create `TeacherAdminPanel.svelte`:
     - **Chip Controls**: +1, -1 buttons per class
     - **Undo Button**: Reverse last drop (query `drop_history`, rollback points/chip)
     - **Manual Reset**: Button with `ConfirmDialog` to reset all chips to 5
     - **Sync Status**: Small indicator showing queue count and last sync time
   - Position: Collapsible panel at bottom of sidebar (default collapsed)
   - Protect reset with confirmation: "Reset all chips to 5? This cannot be undone."
   - Log all admin actions to `drop_history` for audit trail

---

## Implementation Stack

### Core Framework & Build Tools

- **SvelteKit**: `2.47.2` (latest stable, upgrade recommended)
- **Svelte**: `5.41.2` (latest stable, upgrade recommended)
- **TypeScript**: `5.9.3` (latest stable)
- **Vite**: `7.1.11` (latest stable - Vite 7 released!)
- **Node.js**: `22.x` (latest Active LTS, recommended for development)

### Physics & Game Engine

- **Matter.js**: `0.19.0` (existing, no changes needed)
  - Physics simulation remains unchanged
  - Only modify collision event handlers

### Database & Sync

- **Supabase Client**: `@supabase/supabase-js@2.76.1` ✅ **NEW**
  - PostgreSQL cloud database
  - Real-time subscriptions for leaderboard
  - Row Level Security for future multi-teacher support

- **Dexie.js**: `4.2.1` ✅ **NEW**
  - IndexedDB wrapper for offline queue
  - Promise-based API
  - Type-safe schema definitions
  - Modern ESM support

### UI & Styling

- **Tailwind CSS**: `4.1.15` (latest stable, Tailwind CSS v4 with performance improvements)
- **bits-ui**: `1.0.2` (latest stable)
  - Modal, Dialog primitives
- **Chart.js**: `4.4.7` (existing, but DELETE for MVP - no statistics needed)

### Testing & Quality

- **Vitest**: `3.2.4` (latest stable - Vitest 3 released!)
- **@playwright/test**: `1.56.1` (latest stable)
- **TypeScript ESLint**: `8.18.2` (latest stable)

### Deployment

- **GitHub Pages**: Existing setup (no changes)
- **Adapter Static**: `@sveltejs/adapter-static@3.0.11` (latest stable)

### Environment Variables

**`.env` file (not committed):**
```bash
VITE_SUPABASE_URL=https://xxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Package Installation Commands

```bash
# Upgrade existing dependencies to latest stable (verified January 2025)
npm install svelte@5.41.2 @sveltejs/kit@2.47.2
npm install vite@7.1.11 typescript@5.9.3
npm install tailwindcss@4.1.15
npm install @sveltejs/adapter-static@3.0.11
npm install vitest@3.2.4 @playwright/test@1.56.1

# Install new dependencies
npm install @supabase/supabase-js@2.76.1
npm install dexie@4.2.1

# Remove unused dependencies (gambling analytics)
npm uninstall chart.js
npm uninstall @types/chart.js

# Verify installation
npm install
npm run check  # TypeScript type checking
```

---

## Technical Details

### Data Flow Architecture

```
User clicks "Drop Chip"
    ↓
Check: chips_remaining > 0 for active class?
    ↓ YES
Subtract 1 chip from active class
    ↓
Queue operation: {operation: 'subtract_chip', class_id, payload: {chips: 1}}
    ↓
Update local cache (optimistic update)
    ↓
Create ball in PlinkoEngine (Matter.js)
    ↓
Ball falls through pins (physics simulation)
    ↓
Ball lands in bin (collision detected)
    ↓
Get points from pointSlots[binIndex]
    ↓
Add points to active class total_points
    ↓
Queue operation: {operation: 'add_points', class_id, payload: {points, slot_index}}
    ↓
Update local cache (optimistic update)
    ↓
Trigger leaderboard re-sort
    ↓
SyncService.syncNow() attempts to sync queued operations
    ↓ (if online)
POST to Supabase: UPDATE classes SET chips_remaining -= 1, total_points += points
    ↓
Mark operations as synced in IndexedDB
    ↓
Supabase broadcasts change via real-time channel
    ↓
All clients (if multi-device in future) receive leaderboard update
```

### Offline-First Sync Strategy

**Optimistic Updates:**
1. User action immediately updates local cache (`classesCache` store)
2. UI reflects change instantly (no loading spinners)
3. Operation queued in IndexedDB
4. Sync service attempts to push to Supabase

**Sync Intervals:**
- **Immediate**: After every user action (`syncNow()` called)
- **Periodic**: Every 60 seconds (`setInterval` in `startAutoSync()`)
- **On Reconnect**: Browser `online` event triggers `syncNow()`

**Conflict Resolution:**
- **Strategy**: Last Write Wins (LWW)
- **Rationale**: Single teacher, single device, no concurrent edits expected
- **Future**: If multi-teacher, use Supabase's `version` column for optimistic locking

**Queue Processing:**
- Operations sorted by timestamp (oldest first)
- Retry failed operations with exponential backoff
- Max retry count: 10 attempts
- Failed operations after max retries: Log error, show alert to teacher

### Midnight Reset Logic

**Approach 1: Client-Side (MVP)**
```typescript
// In +page.svelte onMount
setInterval(() => {
  const now = new Date();
  if (now.getHours() === 0 && now.getMinutes() === 0) {
    resetAllChips();
  }
}, 60000); // Check every minute
```

**Limitations:**
- Only works if app is open at midnight
- Browser must be running

**Approach 2: Server-Side (Future Enhancement)**
- Supabase Edge Function with cron trigger
- Runs daily at midnight (reliable even if app closed)
- Recommended for production, defer to Phase 2

**MVP Decision:** Use client-side with manual reset fallback
- Teacher can manually reset if app wasn't open at midnight
- Log last reset timestamp to avoid double-resets

### Component State Management

**New Stores in `classroom.ts`:**
```typescript
import { writable, derived } from 'svelte/store';
import type { Class, LeaderboardEntry } from '$lib/types/classroom';

// Active class ID (UUID from Supabase)
export const activeClassId = writable<string | null>(null);

// Local cache of all classes (synced from Supabase + offline queue)
export const classesCache = writable<Class[]>([]);

// Sync status indicator
export const syncStatus = writable<'online' | 'offline' | 'syncing'>('offline');

// Derived: Active class object
export const activeClass = derived(
  [activeClassId, classesCache],
  ([$activeClassId, $classesCache]) =>
    $classesCache.find(cls => cls.id === $activeClassId) || null
);

// Derived: Sorted leaderboard
export const leaderboard = derived(
  classesCache,
  ($classesCache) =>
    [...$classesCache].sort((a, b) => b.total_points - a.total_points)
);
```

**Modified Stores in `game.ts`:**
```typescript
// KEEP (still needed for gameplay)
export const plinkoEngine = writable<PlinkoEngine | null>(null);
export const rowCount = writable<RowCount>(16); // Fixed at 16 (no user config)
export const winRecords = writable<WinRecord[]>([]); // Rename to dropRecords

// DELETE (gambling-specific)
- balance
- betAmount
- betAmountOfExistingBalls
- riskLevel
- totalProfitHistory
- binColors (recalculate based on point values, not multipliers)
- binProbabilities (not needed for MVP)
```

### TypeScript Type Definitions

**New Types in `classroom.ts`:**
```typescript
export interface Class {
  id: string;                       // UUID
  name: string;                     // "Period 1", etc.
  total_points: number;             // Cumulative points
  chips_remaining: number;          // Daily allocation (0-5)
  last_reset_at: string;            // ISO timestamp
  created_at: string;               // ISO timestamp
  updated_at: string;               // ISO timestamp
}

export interface LeaderboardEntry {
  id: string;
  name: string;
  total_points: number;
  chips_remaining: number;
  rank: number;                     // 1-6 based on total_points DESC
}

export interface QueuedOperation {
  id?: number;                      // IndexedDB auto-increment
  operation: 'add_points' | 'subtract_chip' | 'reset_chips' | 'undo';
  class_id: string;                 // Foreign key to classes.id
  payload: {
    points?: number;                // For add_points
    slot_index?: number;            // For add_points (0-8)
    chips?: number;                 // For subtract_chip
  };
  timestamp: number;                // Unix ms
  retry_count: number;              // Exponential backoff
  synced: boolean;                  // Sync status
}
```

**Modified Types in `game.ts`:**
```typescript
// KEEP
export type RowCount = 8 | 9 | 10 | 11 | 12 | 13 | 14 | 15 | 16;

// RENAME
export type WinRecord = DropRecord; // Better naming for non-gambling context

export interface DropRecord {
  id: string;
  class_id: string;                 // NEW: Which class dropped
  slot_index: number;               // Which slot (0-8)
  points_earned: number;            // NEW: Points from pointSlots[slot_index]
  dropped_at: string;               // ISO timestamp
}

// DELETE
- BetMode enum (no auto-bet)
- RiskLevel enum (no gambling)
- BetAmountOfExistingBalls type (no betting)
```

### Error Handling Strategy

**Network Errors:**
```typescript
try {
  const { data, error } = await supabase
    .from('classes')
    .update({ total_points })
    .eq('id', class_id);

  if (error) throw error;
  markSynced(operation.id);
} catch (err) {
  // Increment retry_count
  // Re-queue with exponential backoff
  // If retry_count > 10, log error and alert teacher
  console.error('Sync failed:', err);
  syncStatus.set('offline');
}
```

**Validation Errors:**
```typescript
// Before dropping chip
if ($activeClass.chips_remaining <= 0) {
  alert('No chips remaining for this class today!');
  return;
}

// Before manual chip adjustment
if (newChipCount < 0 || newChipCount > 99) {
  alert('Chip count must be between 0 and 99');
  return;
}
```

**Database Constraint Violations:**
- Unique constraint on `classes.name`: Should never happen (seeded data)
- Foreign key violations: Should never happen (UUIDs generated by Supabase)
- Defensive: Wrap all Supabase calls in try/catch

---

## Development Setup

### Prerequisites

- **Node.js**: 22.x (latest stable LTS)
- **npm**: 10.x or higher
- **Git**: For version control
- **Supabase Account**: Free tier sufficient for MVP
- **Modern Browser**: Chrome, Firefox, or Edge (for IndexedDB support)

### Initial Setup

1. **Clone Repository** (if not already done)
   ```bash
   git clone <repository-url>
   cd Classroom-Plinko
   ```

2. **Install Dependencies**
   ```bash
   npm install
   npm install @supabase/supabase-js@2.76.1
   npm install dexie@4.2.1
   ```

3. **Create Supabase Project**
   - Go to https://supabase.com/dashboard
   - Create new project: "Classroom-Plinko"
   - Copy project URL and anon key
   - Execute SQL schema from tech spec in SQL Editor

4. **Configure Environment Variables**
   ```bash
   # Create .env file in project root
   echo "VITE_SUPABASE_URL=https://xxxxx.supabase.co" > .env
   echo "VITE_SUPABASE_ANON_KEY=your-anon-key-here" >> .env
   ```

5. **Seed Initial Data**
   ```sql
   -- Execute in Supabase SQL Editor
   INSERT INTO classes (name, total_points, chips_remaining) VALUES
     ('Period 1', 0, 5),
     ('Period 2', 0, 5),
     ('Period 3', 0, 5),
     ('Period 4', 0, 5),
     ('Period 5', 0, 5),
     ('Period 6', 0, 5);
   ```

6. **Verify Setup**
   ```bash
   npm run check      # TypeScript type checking
   npm run dev        # Start dev server
   ```

### Development Workflow

1. **Start Dev Server**
   ```bash
   npm run dev
   # Open http://localhost:5173
   ```

2. **Run Tests**
   ```bash
   npm run test:unit           # Vitest unit tests
   npm run test:e2e            # Playwright E2E tests
   ```

3. **Type Checking**
   ```bash
   npm run check               # TypeScript validation
   ```

4. **Build for Production**
   ```bash
   npm run build
   npm run preview             # Test production build locally
   ```

### Database Management

**View Data:**
- Supabase Dashboard > Table Editor > `classes`
- Real-time updates visible in browser

**Reset Data (for testing):**
```sql
UPDATE classes SET total_points = 0, chips_remaining = 5;
DELETE FROM drop_history;
```

**Backup Data:**
```bash
# Export from Supabase Dashboard > Database > Backups
# Or use SQL dump
```

---

## Implementation Guide

### Phase 1: Remove Gambling Features (Stories 1-2)

**Story 1: Remove Gambling Data Model**

Files to modify:
1. `src/lib/stores/game.ts`:
   ```typescript
   // DELETE these stores
   - balance
   - betAmount
   - betAmountOfExistingBalls
   - riskLevel
   - totalProfitHistory
   ```

2. `src/lib/types/game.ts`:
   ```typescript
   // DELETE these types
   - enum BetMode
   - enum RiskLevel
   - type BetAmountOfExistingBalls
   ```

3. `src/lib/constants/game.ts`:
   ```typescript
   // DELETE binPayouts multiplier table
   - export const binPayouts = { ... };
   ```

4. `src/routes/+layout.svelte`:
   ```typescript
   // DELETE balance persistence
   - browser.addEventListener('beforeunload', saveBalance);
   - localStorage.removeItem('plinko_balance');
   ```

5. **Delete entire files:**
   - `src/lib/components/Balance.svelte`
   - `src/lib/components/BinsDistribution.svelte`
   - `src/lib/components/LiveStatsWindow/` (entire folder)
   - `src/lib/components/Sidebar/BetControls.svelte`
   - `src/lib/components/Sidebar/GameConfig.svelte`

**Story 2: Implement Fixed Point Slots**

1. `src/lib/constants/game.ts`:
   ```typescript
   // ADD new constant
   export const POINT_SLOTS = [100, 500, 1000, 0, 10000, 0, 1000, 500, 100] as const;
   export const FIXED_ROW_COUNT = 16 as const;
   ```

2. `src/lib/components/Plinko/PlinkoEngine.ts`:
   ```typescript
   // MODIFY collision handler
   private onBallEnteredBin(binIndex: number) {
     const points = POINT_SLOTS[binIndex];
     this.eventTarget.dispatchEvent(new CustomEvent('ballEntered', {
       detail: { binIndex, points }
     }));
   }
   ```

3. Update bin visual labels to show point values (not multipliers)

### Phase 2: Database Integration (Stories 5-7)

**Story 5: Supabase Setup**

1. Create `src/lib/services/supabase.ts`:
   ```typescript
   import { createClient } from '@supabase/supabase-js';

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
   const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

   if (!supabaseUrl || !supabaseAnonKey) {
     throw new Error('Missing Supabase environment variables');
   }

   export const supabase = createClient(supabaseUrl, supabaseAnonKey);
   ```

2. Create `.env`:
   ```bash
   VITE_SUPABASE_URL=your-url-here
   VITE_SUPABASE_ANON_KEY=your-key-here
   ```

3. Execute SQL schema in Supabase dashboard

4. Seed six classes with initial data

**Story 6: IndexedDB Offline Queue**

1. Create `src/lib/services/offlineQueue.ts`:
   ```typescript
   import Dexie, { Table } from 'dexie';
   import type { QueuedOperation } from '$lib/types/classroom';

   class OfflineQueueDB extends Dexie {
     queue!: Table<QueuedOperation, number>;

     constructor() {
       super('ClassroomPlinkoQueue');
       this.version(1).stores({
         queue: '++id, synced, timestamp'
       });
     }
   }

   export const db = new OfflineQueueDB();

   export async function addToQueue(
     operation: QueuedOperation['operation'],
     class_id: string,
     payload: QueuedOperation['payload']
   ) {
     await db.queue.add({
       operation,
       class_id,
       payload,
       timestamp: Date.now(),
       retry_count: 0,
       synced: false
     });
   }

   export async function getUnsynced() {
     return await db.queue
       .where('synced').equals(false)
       .sortBy('timestamp');
   }

   export async function markSynced(id: number) {
     await db.queue.update(id, { synced: true });
   }
   ```

2. Create `src/lib/stores/classroom.ts`:
   ```typescript
   import { writable, derived } from 'svelte/store';
   import type { Class } from '$lib/types/classroom';

   export const activeClassId = writable<string | null>(null);
   export const classesCache = writable<Class[]>([]);
   export const syncStatus = writable<'online' | 'offline' | 'syncing'>('offline');

   export const activeClass = derived(
     [activeClassId, classesCache],
     ([$activeClassId, $classesCache]) =>
       $classesCache.find(cls => cls.id === $activeClassId) || null
   );

   export const leaderboard = derived(
     classesCache,
     ($classesCache) => [...$classesCache].sort((a, b) => b.total_points - a.total_points)
   );
   ```

**Story 7: Sync Service**

1. Create `src/lib/services/syncService.ts`:
   ```typescript
   import { supabase } from './supabase';
   import { db, getUnsynced, markSynced } from './offlineQueue';
   import { syncStatus, classesCache } from '$lib/stores/classroom';

   export async function syncNow() {
     syncStatus.set('syncing');
     const operations = await getUnsynced();

     for (const op of operations) {
       try {
         await processOperation(op);
         await markSynced(op.id!);
       } catch (err) {
         console.error('Sync failed for operation', op.id, err);
         await db.queue.update(op.id!, { retry_count: op.retry_count + 1 });
       }
     }

     await refreshClassesCache();
     syncStatus.set('online');
   }

   async function processOperation(op: QueuedOperation) {
     if (op.operation === 'add_points') {
       await supabase
         .from('classes')
         .update({ total_points: /* increment logic */ })
         .eq('id', op.class_id);
     }
     // ... handle other operations
   }

   export function startAutoSync() {
     setInterval(syncNow, 60000); // Every 60 seconds
   }

   export async function refreshClassesCache() {
     const { data } = await supabase.from('classes').select('*');
     classesCache.set(data || []);
   }
   ```

### Phase 3: Classroom UI (Stories 8-10)

**Story 8: Class Period Selection**

1. Create `src/lib/components/Classroom/ClassPeriodSelector.svelte`:
   ```svelte
   <script lang="ts">
     import { activeClassId, classesCache } from '$lib/stores/classroom';
   </script>

   <div class="grid grid-cols-2 gap-2">
     {#each $classesCache as cls}
       <button
         on:click={() => activeClassId.set(cls.id)}
         class:ring-2={$activeClassId === cls.id}
         class="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
       >
         {cls.name}
       </button>
     {/each}
   </div>
   ```

**Story 9: Leaderboard Sidebar**

1. Create `src/lib/components/Classroom/Leaderboard.svelte`:
   ```svelte
   <script lang="ts">
     import { leaderboard, activeClassId } from '$lib/stores/classroom';
   </script>

   <table class="w-full text-sm">
     <thead>
       <tr class="border-b">
         <th class="text-left py-2">Class</th>
         <th class="text-right">Points</th>
         <th class="text-right">Chips</th>
       </tr>
     </thead>
     <tbody>
       {#each $leaderboard as cls, i}
         <tr class:bg-blue-100={cls.id === $activeClassId}>
           <td class="py-2">{i + 1}. {cls.name}</td>
           <td class="text-right font-bold">{cls.total_points.toLocaleString()}</td>
           <td class="text-right">{cls.chips_remaining}/5</td>
         </tr>
       {/each}
     </tbody>
   </table>
   ```

**Story 10: Teacher Admin Panel**

1. Create `src/lib/components/Classroom/TeacherAdminPanel.svelte`:
   ```svelte
   <script lang="ts">
     import { classesCache } from '$lib/stores/classroom';
     import { supabase } from '$lib/services/supabase';

     async function adjustChips(class_id: string, delta: number) {
       const cls = $classesCache.find(c => c.id === class_id);
       if (!cls) return;

       const newChips = Math.max(0, cls.chips_remaining + delta);
       await supabase
         .from('classes')
         .update({ chips_remaining: newChips })
         .eq('id', class_id);
     }

     async function resetAllChips() {
       if (!confirm('Reset all chips to 5? This cannot be undone.')) return;

       await supabase
         .from('classes')
         .update({ chips_remaining: 5, last_reset_at: new Date().toISOString() })
         .neq('id', '00000000-0000-0000-0000-000000000000'); // Update all
     }
   </script>

   <div class="space-y-4">
     <h3>Teacher Controls</h3>

     {#each $classesCache as cls}
       <div class="flex items-center gap-2">
         <span class="flex-1">{cls.name}</span>
         <button on:click={() => adjustChips(cls.id, -1)}>-</button>
         <span>{cls.chips_remaining}</span>
         <button on:click={() => adjustChips(cls.id, 1)}>+</button>
       </div>
     {/each}

     <button on:click={resetAllChips} class="btn-danger">Reset All Chips</button>
   </div>
   ```

### Testing Strategy

**Unit Tests (Vitest):**
- Test `POINT_SLOTS` constant definition
- Test offline queue CRUD operations
- Test sync service retry logic
- Test leaderboard derived store sorting

**Integration Tests (Playwright):**
- Test class period selection flow
- Test chip drop with point accumulation
- Test leaderboard updates after drop
- Test offline mode (disable network in DevTools)
- Test sync after reconnect
- Test teacher admin controls

**Manual Testing:**
1. Drop chips for each class, verify points accumulate
2. Disconnect internet, drop chips, verify offline queue
3. Reconnect internet, verify auto-sync
4. Use admin panel to adjust chips, verify sync
5. Reset all chips, verify all set to 5
6. Test midnight reset (manually trigger by setting system clock)

---

## Testing Approach

### Unit Tests (Vitest)

**Test Files to Create:**
```
src/lib/
├── services/
│   ├── __tests__/
│   │   ├── offlineQueue.test.ts
│   │   ├── syncService.test.ts
│   │   └── supabase.test.ts
├── stores/
│   └── __tests__/
│       └── classroom.test.ts
└── utils/
    └── __tests__/
        └── points.test.ts
```

**Test Coverage Requirements:**
- All store derived calculations (leaderboard sorting, active class)
- Offline queue operations (add, getUnsynced, markSynced)
- Sync service retry logic with exponential backoff
- Point slot calculations and validations

**Example Unit Test:**
```typescript
// offlineQueue.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { db, addToQueue, getUnsynced } from '../offlineQueue';

describe('Offline Queue', () => {
  beforeEach(async () => {
    await db.queue.clear();
  });

  it('should add operation to queue', async () => {
    await addToQueue('add_points', 'class-uuid', { points: 100, slot_index: 4 });
    const unsynced = await getUnsynced();
    expect(unsynced).toHaveLength(1);
    expect(unsynced[0].operation).toBe('add_points');
  });

  it('should filter synced operations', async () => {
    await addToQueue('add_points', 'class-uuid', { points: 100, slot_index: 4 });
    const operations = await getUnsynced();
    await db.queue.update(operations[0].id!, { synced: true });

    const stillUnsynced = await getUnsynced();
    expect(stillUnsynced).toHaveLength(0);
  });
});
```

### E2E Tests (Playwright)

**Test Scenarios:**

1. **Happy Path Flow:**
   ```typescript
   test('complete gameplay flow', async ({ page }) => {
     await page.goto('/');

     // Select class period
     await page.click('text=Period 1');

     // Verify initial chips
     await expect(page.locator('text=/Chips: 5/')).toBeVisible();

     // Drop chip
     await page.click('text=Drop Chip');

     // Wait for ball to land
     await page.waitForTimeout(3000);

     // Verify chips decremented
     await expect(page.locator('text=/Chips: 4/')).toBeVisible();

     // Verify points updated in leaderboard
     await expect(page.locator('text=/Period 1.*[1-9]/')).toBeVisible();
   });
   ```

2. **Offline Mode Test:**
   ```typescript
   test('offline queue and sync', async ({ page, context }) => {
     await page.goto('/');

     // Go offline
     await context.setOffline(true);

     // Drop chip while offline
     await page.click('text=Period 2');
     await page.click('text=Drop Chip');
     await page.waitForTimeout(3000);

     // Verify offline indicator
     await expect(page.locator('.sync-status.offline')).toBeVisible();

     // Go back online
     await context.setOffline(false);

     // Wait for sync
     await page.waitForSelector('.sync-status.online', { timeout: 10000 });

     // Verify data synced to Supabase
     // (requires Supabase test database query)
   });
   ```

3. **Teacher Admin Controls:**
   ```typescript
   test('chip adjustment by teacher', async ({ page }) => {
     await page.goto('/');

     // Open admin panel
     await page.click('text=Teacher Controls');

     // Adjust chips for Period 3
     await page.click('button:near(:text("Period 3")):has-text("+")');

     // Verify leaderboard updated
     await expect(page.locator('text=/Period 3.*6\/5/')).toBeVisible();

     // Decrease chips
     await page.click('button:near(:text("Period 3")):has-text("-")');
     await page.click('button:near(:text("Period 3")):has-text("-")');

     // Verify back to 4 chips
     await expect(page.locator('text=/Period 3.*4\/5/')).toBeVisible();
   });
   ```

### Integration Testing with Supabase

**Setup Test Database:**
1. Create separate Supabase project for testing: "Classroom-Plinko-Test"
2. Use `.env.test` for test credentials:
   ```bash
   VITE_SUPABASE_URL=https://test-project.supabase.co
   VITE_SUPABASE_ANON_KEY=test-key-here
   ```

3. Reset test database before each E2E test:
   ```typescript
   test.beforeEach(async () => {
     // Reset classes table
     await supabase.from('classes').delete().neq('id', '');

     // Re-seed test data
     await supabase.from('classes').insert([
       { name: 'Period 1', total_points: 0, chips_remaining: 5 },
       { name: 'Period 2', total_points: 0, chips_remaining: 5 },
       // ... all six periods
     ]);
   });
   ```

### Manual Testing Checklist

**Before deploying to classroom:**
- [ ] All six classes display correctly
- [ ] Class selection highlights active class
- [ ] Chip drop decrements chip count
- [ ] Points add correctly for each slot (verify all 9 slots)
- [ ] Leaderboard sorts by total points descending
- [ ] Leaderboard updates in real-time after drop
- [ ] Offline mode queues operations (test by disabling Wi-Fi)
- [ ] Sync indicator shows correct status
- [ ] Auto-sync works after reconnecting
- [ ] Chip +/- controls work in admin panel
- [ ] Reset all chips requires confirmation
- [ ] Reset all chips sets all to 5 correctly
- [ ] Undo button reverses last drop (optional for MVP)
- [ ] Midnight reset triggers correctly (set system clock to test)
- [ ] No gambling UI remains (balance, bet, risk, auto-bet)

---

## Deployment Strategy

### Pre-Deployment Checklist

1. **Code Quality:**
   ```bash
   npm run check                # TypeScript validation
   npm run lint                 # ESLint checks
   npm run test:unit            # All unit tests pass
   npm run test:e2e             # All E2E tests pass
   ```

2. **Build Verification:**
   ```bash
   npm run build
   npm run preview              # Test production build locally
   ```

3. **Environment Variables:**
   - Ensure `.env` is in `.gitignore` (never commit credentials)
   - Document required variables in `README.md`
   - Provide `.env.example` template:
     ```bash
     VITE_SUPABASE_URL=your-supabase-url
     VITE_SUPABASE_ANON_KEY=your-anon-key
     ```

4. **Database Verification:**
   - All six classes seeded in production Supabase
   - Row Level Security policies active
   - Backup current data before deployment

### Deployment Steps

**Existing GitHub Pages Setup (No Changes Needed):**

The project already has static deployment configured:

1. **Build Static Site:**
   ```bash
   npm run build
   # Output: build/ directory
   ```

2. **Deploy to GitHub Pages:**
   ```bash
   # Option 1: Manual (already configured in workflow)
   git add .
   git commit -m "feat: transform to classroom competition game"
   git push origin main

   # GitHub Actions will automatically deploy to gh-pages branch
   ```

3. **Verify Deployment:**
   - URL: `https://<username>.github.io/Classroom-Plinko/`
   - Check all environment variables loaded correctly
   - Verify Supabase connection (check browser console for errors)
   - Test class selection and chip drop

### Production Environment Variables

**GitHub Secrets Configuration:**

1. Go to GitHub repository > Settings > Secrets and variables > Actions
2. Add secrets:
   - `VITE_SUPABASE_URL` = Production Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = Production anon key

3. Update GitHub Actions workflow (`.github/workflows/deploy.yml`):
   ```yaml
   env:
     VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
     VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
   ```

### Classroom Deployment

**Teacher's Computer Setup:**

1. **Option A: Use GitHub Pages URL**
   - Bookmark URL: `https://<username>.github.io/Classroom-Plinko/`
   - Create desktop shortcut (Chrome: More Tools > Create Shortcut > Open as window)
   - Add to browser favorites bar

2. **Option B: Local Installation (Offline Mode)**
   ```bash
   # On teacher's computer
   git clone <repository-url>
   cd Classroom-Plinko
   npm install
   npm run build
   npm run preview
   # Bookmark http://localhost:4173
   ```

**Classroom Display Setup:**

1. **Browser Settings:**
   - Use fullscreen mode (F11)
   - Disable browser autofill/suggestions
   - Set homepage to Plinko app URL

2. **Display Settings:**
   - Recommended: 1920x1080 resolution (Full HD)
   - High contrast mode for better visibility
   - Disable screensaver and sleep mode

3. **Network Settings:**
   - Connect to stable Wi-Fi or ethernet
   - If unreliable, offline mode will queue operations
   - Ensure Supabase domain not blocked by school firewall

### Rollback Strategy

**If deployment fails:**

1. **Revert to Previous Version:**
   ```bash
   git revert <commit-hash>
   git push origin main
   # GitHub Actions will auto-deploy previous version
   ```

2. **Database Rollback:**
   - Supabase Dashboard > Database > Backups
   - Restore from automatic daily backup
   - Or manually reset:
     ```sql
     UPDATE classes SET total_points = 0, chips_remaining = 5;
     ```

3. **Emergency Fallback:**
   - Keep old gambling version in separate branch: `gambling-original`
   - Can quickly switch back if transformation breaks

### Monitoring & Maintenance

**Daily Checks:**
- Verify midnight reset occurred (check `last_reset_at` timestamps)
- Check Supabase logs for errors
- Verify sync queue is empty (no stuck operations)

**Weekly Checks:**
- Review leaderboard data integrity
- Check for any failed sync operations
- Verify all six classes still have correct chip counts

**Monthly Maintenance:**
- Archive previous month's competition data:
  ```sql
  -- Copy to archive table
  INSERT INTO classes_archive SELECT * FROM classes WHERE created_at < NOW() - INTERVAL '1 month';

  -- Reset for new month
  UPDATE classes SET total_points = 0, chips_remaining = 5;
  ```
- Review Supabase usage metrics (free tier limits)
- Update dependencies: `npm update`

### Future Enhancements (Post-MVP)

**Phase 2 Features (if successful):**
1. Server-side midnight reset (Supabase Edge Function with cron)
2. Historical analytics dashboard (monthly competition archives)
3. Undo functionality with full audit trail
4. Export leaderboard to CSV for parent communication
5. Sound effects and animations for 10,000-point drops

**Phase 3 Features (multi-teacher):**
1. Teacher authentication (Supabase Auth)
2. School-wide leaderboards
3. Admin dashboard for school coordinator
4. Custom class names and chip allocations per teacher

---

**End of Technical Specification**
