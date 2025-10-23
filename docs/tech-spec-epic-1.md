# Technical Specification: Educational Classroom Competition Transform

Date: 2025-10-22
Author: Frank
Epic ID: 1
Status: Draft

---

## Overview

This technical specification details the transformation of an existing gambling-based Plinko web game into an educational classroom competition tool. The epic removes all betting mechanics and implements a fixed point system with multi-class leaderboard tracking, teacher management controls, and offline-first database synchronization. This brownfield transformation preserves the existing SvelteKit + Matter.js physics foundation while completely refactoring the game state, persistence layer, and user interface to serve educational classroom use cases with unreliable internet connectivity.

## Objectives and Scope

**In Scope:**
- Remove all gambling mechanics: betting interface, multipliers, risk levels, balance tracking
- Implement nine fixed point-value slots (replacing dynamic multiplier system)
- Add six-class period competition system with persistent leaderboard
- Integrate Supabase PostgreSQL database for cloud persistence
- Implement IndexedDB offline queue using Dexie.js for unreliable connectivity
- Build sync service with auto-retry and exponential backoff
- Create teacher admin panel with chip management (+/-, reset, undo)
- Implement automatic midnight chip reset with manual override
- Build always-visible leaderboard sidebar with real-time updates
- Add class period selector component
- Ensure zero gambling features remain in UI or codebase

**Out of Scope:**
- Backend API server (using Supabase backend-as-a-service)
- Native mobile applications (remains web-based)
- Multi-school or district-wide features
- Advanced analytics dashboard beyond basic leaderboard
- Student authentication system (teacher manages class roster)
- Integration with external LMS platforms

## System Architecture Alignment

This epic maintains the existing SvelteKit SPA architecture with static site generation but introduces significant changes to state management and data persistence:

**Preserved Components:**
- SvelteKit framework with SSG deployment model
- Matter.js physics simulation (PlinkoEngine)
- Svelte stores for reactive state management
- Component-based UI architecture
- Vite build pipeline and Tailwind CSS styling

**Architectural Extensions:**
- **New Persistence Layer**: Supabase PostgreSQL replaces localStorage for multi-session, multi-class data
- **Offline-First Pattern**: IndexedDB queue (Dexie.js) for write operations during network outages
- **Sync Service**: New orchestration layer managing Supabase ↔ IndexedDB synchronization
- **Real-Time Subscriptions**: Supabase real-time for live leaderboard updates across clients

**Modified Components:**
- Store architecture expands from single-player (`game.ts`) to multi-class tracking (`classroom.ts`)
- PlinkoEngine collision handler changes from multiplier-based to additive point scoring
- UI layer removes gambling components, adds classroom management components

**Constraints:**
- Must remain client-side only (no custom backend server)
- Must function offline and sync when online
- Must handle six concurrent class periods without performance degradation
- Must preserve deterministic physics behavior (Matter.js seed consistency)

## Detailed Design

### Services and Modules

| Module | Responsibility | Inputs | Outputs | Owner |
|--------|---------------|---------|---------|-------|
| **supabase.ts** | Supabase client initialization and database operations | API keys, table schemas | CRUD operations, real-time subscriptions | Story 2 |
| **offlineQueue.ts** | IndexedDB queue management for offline writes | Write operations (points, chips, player actions) | Queued transactions, sync status | Story 2 |
| **syncService.ts** | Orchestrates sync between IndexedDB and Supabase | Network status, queued operations | Sync results, error handling | Story 2 |
| **classroom.ts** (store) | Multi-class state management | Class period selection, player roster | Active class state, leaderboard data | Story 2 |
| **PlinkoEngine.ts** | Physics simulation (MODIFIED) | Point slots configuration | Ball collision events with point values | Story 1 |
| **ClassPeriodSelector.svelte** | Class period selection UI | Six class periods configuration | Selected class period | Story 3 |
| **Leaderboard.svelte** | Real-time leaderboard display | Player scores from Supabase | Sorted player rankings | Story 3 |
| **TeacherAdminPanel.svelte** | Teacher management controls | Teacher authentication state | Chip adjustments, reset commands | Story 3 |
| **ChipCounter.svelte** | Daily chip tracking display | Current chips remaining, reset schedule | Visual chip count | Story 3 |

### Data Models and Contracts

**New TypeScript Types (src/lib/types/classroom.ts):**

```typescript
// Class period identifier (1-6 for six class periods)
export type ClassPeriod = 1 | 2 | 3 | 4 | 5 | 6;

// Player entry in a class
export interface Player {
  id: string;              // UUID
  name: string;            // Student name (teacher-entered)
  classPeriod: ClassPeriod;
  totalPoints: number;     // Cumulative points across all games
  chipsRemaining: number;  // Daily chips (reset at midnight)
  lastActive: Date;        // Last activity timestamp
}

// Point slot value (replaces multiplier-based system)
export type PointValue = 10 | 25 | 50 | 100 | 250 | 500 | 1000;

// Fixed point slots configuration (9 slots)
export const POINT_SLOTS: PointValue[] = [
  1000, 500, 250, 100, 50, 100, 250, 500, 1000
];

// Drop record (replaces WinRecord)
export interface DropRecord {
  id: string;              // UUID
  playerId: string;        // Reference to Player.id
  classPeriod: ClassPeriod;
  pointsEarned: PointValue;
  slotIndex: number;       // 0-8 for nine slots
  timestamp: Date;
  synced: boolean;         // IndexedDB → Supabase sync status
}

// Offline queue entry
export interface QueuedOperation {
  id: string;              // UUID
  operation: 'add_points' | 'adjust_chips' | 'reset_chips';
  data: Record<string, any>;
  timestamp: Date;
  retryCount: number;
}
```

**Supabase Database Schema:**

```sql
-- Players table
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  class_period INTEGER CHECK (class_period BETWEEN 1 AND 6),
  total_points INTEGER DEFAULT 0,
  chips_remaining INTEGER DEFAULT 10,
  last_active TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Drop history table
CREATE TABLE drop_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES players(id) ON DELETE CASCADE,
  class_period INTEGER CHECK (class_period BETWEEN 1 AND 6),
  points_earned INTEGER NOT NULL,
  slot_index INTEGER CHECK (slot_index BETWEEN 0 AND 8),
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_players_class_period ON players(class_period);
CREATE INDEX idx_players_total_points ON players(class_period, total_points DESC);
CREATE INDEX idx_drops_player ON drop_records(player_id);
CREATE INDEX idx_drops_class_period ON drop_records(class_period);
```

**IndexedDB Schema (Dexie.js):**

```typescript
// src/lib/services/offlineQueue.ts
const db = new Dexie('ClassroomPlinko');
db.version(1).stores({
  queuedOperations: '++id, timestamp, operation',
  cachedPlayers: 'id, classPeriod, name',
  cachedDrops: '++id, playerId, timestamp'
});
```

### APIs and Interfaces

**Supabase Service Interface (src/lib/services/supabase.ts):**

```typescript
// Initialize Supabase client
export function createSupabaseClient(): SupabaseClient

// Player operations
export async function getPlayersByClass(classPeriod: ClassPeriod): Promise<Player[]>
export async function createPlayer(name: string, classPeriod: ClassPeriod): Promise<Player>
export async function updatePlayerPoints(playerId: string, points: number): Promise<void>
export async function updatePlayerChips(playerId: string, chips: number): Promise<void>
export async function resetDailyChips(classPeriod?: ClassPeriod): Promise<void>

// Drop record operations
export async function recordDrop(drop: Omit<DropRecord, 'id' | 'timestamp'>): Promise<DropRecord>
export async function getClassHistory(classPeriod: ClassPeriod, limit?: number): Promise<DropRecord[]>

// Real-time subscriptions
export function subscribeToClassLeaderboard(
  classPeriod: ClassPeriod,
  callback: (players: Player[]) => void
): RealtimeChannel
```

**Offline Queue Interface (src/lib/services/offlineQueue.ts):**

```typescript
// Queue operations for offline mode
export async function queueOperation(operation: QueuedOperation): Promise<void>
export async function getQueuedOperations(): Promise<QueuedOperation[]>
export async function removeQueuedOperation(id: string): Promise<void>
export async function clearQueue(): Promise<void>

// Cache operations
export async function cachePlayer(player: Player): Promise<void>
export async function getCachedPlayers(classPeriod: ClassPeriod): Promise<Player[]>
```

**Sync Service Interface (src/lib/services/syncService.ts):**

```typescript
// Sync orchestration
export async function syncQueuedOperations(): Promise<SyncResult>
export function startAutoSync(intervalMs: number): void
export function stopAutoSync(): void
export function getSyncStatus(): SyncStatus

// Types
export interface SyncResult {
  success: boolean;
  syncedCount: number;
  failedCount: number;
  errors: string[];
}

export interface SyncStatus {
  isOnline: boolean;
  queueSize: number;
  lastSyncTime: Date | null;
  isSyncing: boolean;
}
```

**Svelte Store Interface (src/lib/stores/classroom.ts):**

```typescript
// Writable stores
export const activeClassPeriod: Writable<ClassPeriod>
export const currentPlayers: Writable<Player[]>
export const syncStatus: Writable<SyncStatus>

// Derived stores
export const classLeaderboard: Readable<Player[]>  // Sorted by totalPoints DESC
export const canDrop: Readable<boolean>  // Based on chips remaining
```

### Workflows and Sequencing

**Game Drop Flow (Online Mode):**
```
1. Student clicks "Drop Chip" button
2. Validate chips remaining > 0 (classroom store)
3. Decrement chips in local state
4. Create ball in PlinkoEngine with point slots
5. Matter.js simulates physics → ball lands in slot
6. Determine point value from POINT_SLOTS[slotIndex]
7. Call Supabase: updatePlayerPoints(playerId, points)
8. Call Supabase: recordDrop(dropRecord)
9. Update classroom store with new totals
10. Real-time subscription triggers leaderboard update
```

**Game Drop Flow (Offline Mode):**
```
1. Student clicks "Drop Chip" button
2. Validate chips remaining > 0 (cached data)
3. Decrement chips in IndexedDB cache
4. Create ball in PlinkoEngine
5. Ball lands → determine point value
6. Queue operation: queueOperation({ operation: 'add_points', data: {...} })
7. Update local cache: cachePlayer(updatedPlayer)
8. UI shows "Offline - changes queued" indicator
9. [Later] Network restored → syncService.syncQueuedOperations()
10. Queued operations replayed to Supabase
11. Clear queue entries on success
```

**Class Period Switch Flow:**
```
1. Teacher selects class period (1-6) in ClassPeriodSelector
2. activeClassPeriod.set(newPeriod)
3. Unsubscribe from previous class real-time channel
4. Load players: getPlayersByClass(newPeriod)
5. Update currentPlayers store
6. Subscribe to new class leaderboard
7. Leaderboard component re-renders with new class data
```

**Midnight Chip Reset Flow:**
```
1. SyncService detects midnight crossing (Date comparison)
2. Call resetDailyChips() → Supabase RPC function
3. Supabase: UPDATE players SET chips_remaining = 10
4. Real-time subscription propagates changes to all clients
5. UI updates to show refreshed chip counts
```

**Teacher Chip Adjustment Flow:**
```
1. Teacher opens TeacherAdminPanel
2. Selects student from roster
3. Adjusts chips (+/- or manual reset)
4. If online: updatePlayerChips(playerId, newChips) → Supabase
5. If offline: queueOperation({ operation: 'adjust_chips', data: {...} })
6. Update local state/cache
7. Leaderboard reflects changes immediately (optimistic UI)
```

## Non-Functional Requirements

### Performance

**Measurable Targets:**
- Initial page load: <500ms (maintained from existing SPA architecture)
- Time to Interactive: <1s for static assets
- Physics simulation: 60fps target (no change from existing)
- Leaderboard update latency: <200ms after point change (Supabase real-time)
- IndexedDB operations: <50ms for queue writes
- Sync operation: <2s for batch of 50 queued operations

**Constraints (from PRD):**
- Support six concurrent class periods without performance degradation
- Handle 30+ students per class (180 total players across six classes)
- Maintain 60fps physics with up to 3 concurrent balls in motion
- Bundle size target: <200KB gzipped (current: ~150KB)

**Performance Requirements:**
- Supabase queries use indexed columns (class_period, total_points)
- Real-time subscriptions filter by class period (reduce payload size)
- IndexedDB batch operations for sync (not one-by-one)
- Lazy load Dexie.js (code-split for offline functionality)

### Security

**Authentication & Authorization:**
- Teacher admin panel requires authentication (Supabase Auth)
- Row-Level Security (RLS) policies on Supabase tables
- Student interactions limited to active class period only
- No server-side API to secure (Supabase handles backend)

**Data Handling:**
- Student names stored in Supabase (teacher-managed, no PII collection)
- No external data transmission beyond Supabase API
- Environment variables for Supabase keys (not committed to repo)
- Supabase API keys use appropriate role permissions (anon key for reads, service key for admin)

**Supabase RLS Policies:**
```sql
-- Students can only read players in their class period
CREATE POLICY "Students read own class" ON players
  FOR SELECT USING (class_period = current_setting('app.class_period')::integer);

-- Teachers can read all classes
CREATE POLICY "Teachers read all" ON players
  FOR SELECT USING (auth.role() = 'teacher');

-- Only authenticated teachers can modify chip counts
CREATE POLICY "Teachers manage chips" ON players
  FOR UPDATE USING (auth.role() = 'teacher');
```

**Threat Considerations:**
- Client-side only application (no server injection vectors)
- Static deployment (no runtime server vulnerabilities)
- Content Security Policy configured in HTML meta tags
- IndexedDB data scoped to origin (browser security model)

### Reliability/Availability

**Availability Target:** 99.5% uptime (relies on Supabase SLA + static hosting)

**Offline Operation Requirements (Critical from PRD):**
- Game must function completely offline with degraded sync
- IndexedDB queue persists operations until network restored
- UI indicates sync status: "Online" | "Offline - X operations queued"
- Automatic sync retry with exponential backoff (1s, 2s, 4s, 8s, max 30s)
- Manual sync trigger in teacher admin panel

**Recovery Behavior:**
- Network failure during drop: Queue operation, show success to user (optimistic UI)
- Sync failure: Retry with exponential backoff, alert teacher after 10 failed attempts
- Conflicting updates: Last-write-wins (timestamp-based) for chip adjustments
- Data loss prevention: IndexedDB persists until confirmed sync to Supabase

**Degradation Strategy:**
- Offline mode: Full gameplay with local cache, sync deferred
- Supabase unavailable: Fall back to IndexedDB-only mode
- Real-time subscription failure: Fall back to polling (every 5s)
- Leaderboard out of date: Show "Last updated: X seconds ago" indicator

**Error Handling:**
- Supabase connection errors logged to console, shown in sync status
- Invalid data from Supabase: Fallback to cached IndexedDB data
- Quota exceeded (IndexedDB): Alert teacher, disable new players until sync completes

### Observability

**Logging Requirements:**
- Console logging for all Supabase operations (connect, query, error)
- Sync service logs: queue size, sync attempts, success/failure
- IndexedDB operations: write, read, clear events
- Physics engine events: ball creation, collision, landing (existing)

**Metrics to Capture:**
- Sync queue size (current count of pending operations)
- Sync success rate (successful syncs / total attempts)
- Average sync latency (time from queue to Supabase confirmation)
- Drop frequency per class period (drops/hour)
- Network status changes (online ↔ offline transitions)

**Tracing Signals:**
- Drop flow: Button click → Physics → Point calculation → Sync → UI update
- Sync flow: Queue write → Network check → Supabase call → Queue removal
- Class switch: Period selection → Unsubscribe → Load data → Subscribe → Render

**Teacher Dashboard Visibility:**
- Sync status indicator (online/offline, queue size)
- Last sync timestamp
- Manual sync button (for troubleshooting)
- Error messages for failed operations
- Class activity metrics (drops today, active students)

**Development Tools:**
- Browser DevTools for IndexedDB inspection
- Supabase Dashboard for database queries and logs
- Network tab for Supabase API monitoring
- Console logging with debug levels (info, warn, error)

## Dependencies and Integrations

**New Dependencies to Add:**

| Package | Version | Purpose | Story |
|---------|---------|---------|-------|
| `@supabase/supabase-js` | `^2.39.0` | Supabase JavaScript client for database and real-time | Story 2 |
| `dexie` | `^3.2.4` | IndexedDB wrapper for offline queue | Story 2 |

**Existing Dependencies (Preserved):**

| Package | Version | Purpose | Notes |
|---------|---------|---------|-------|
| `@sveltejs/kit` | `^2.0.0` | Web framework | No changes |
| `svelte` | `^4.2.7` | UI framework | No changes |
| `matter-js` | `^0.19.0` | Physics engine | Modified collision handlers (Story 1) |
| `@types/matter-js` | `^0.19.6` | TypeScript types | No changes |
| `tailwind-css` | `^3.4.3` | Styling | No changes |
| `bits-ui` | `^0.21.7` | UI component primitives | No changes |
| `uuid` | `^9.0.1` | UUID generation | Used for Player.id, DropRecord.id |
| `vite` | `^5.0.3` | Build tool | No changes |

**Removed Dependencies (Gambling removal - Story 1):**
- `chart.js` - Statistics visualization (gambling analytics)
- `svelte-persisted-store` - Local storage balance tracking (replaced by Supabase)

**Integration Points:**

**Supabase Integration:**
- **Connection**: WebSocket for real-time subscriptions
- **Authentication**: Supabase Auth for teacher panel
- **Database**: PostgreSQL via Supabase REST API
- **Real-time**: Supabase Realtime for leaderboard updates
- **Environment Variables Required**:
  - `VITE_SUPABASE_URL` - Supabase project URL
  - `VITE_SUPABASE_ANON_KEY` - Public anonymous key
  - `SUPABASE_SERVICE_KEY` - Service role key (server-side only, not in client bundle)

**IndexedDB Integration:**
- **Browser API**: Native IndexedDB via Dexie.js wrapper
- **Storage**: Origin-scoped (same as existing localStorage)
- **Quota**: Browser-dependent (~50MB typical)

**Matter.js Integration (Modified):**
- **Collision Detection**: `Events.on(engine, 'collisionStart', handler)`
- **Modified Handler**: Replace multiplier lookup with `POINT_SLOTS[binIndex]`
- **Pin Configuration**: No changes to grid generation
- **Physics World**: Preserve existing gravity and restitution settings

**Build Integration:**
- **Environment Variables**: Vite's `import.meta.env.VITE_*` pattern
- **Code Splitting**: Lazy load Dexie.js for offline functionality
- **Static Adapter**: `@sveltejs/adapter-static` (no changes)
- **Deployment**: GitHub Pages or any static hosting (no backend required)

## Acceptance Criteria (Authoritative)

**Extracted from PRD Success Criteria:**

1. **AC-1**: Zero gambling features remain in UI (no betting interface, risk level selector, or balance display)
2. **AC-2**: Zero gambling features remain in code (all gambling stores, types, and constants removed)
3. **AC-3**: Nine fixed point slots implemented with values: 1000, 500, 250, 100, 50, 100, 250, 500, 1000
4. **AC-4**: Teacher can select active class period from six options (1-6)
5. **AC-5**: Application tracks six class periods simultaneously with separate leaderboards
6. **AC-6**: Points accumulate correctly and persist across browser sessions via Supabase database
7. **AC-7**: Leaderboard displays real-time rankings sorted by total points (descending)
8. **AC-8**: Leaderboard updates within 200ms when any player earns points
9. **AC-9**: Chips reset automatically at midnight (0:00 local time) for all players
10. **AC-10**: Teacher can manually trigger chip reset for specific class or all classes
11. **AC-11**: Game functions completely offline (drops work, points tracked locally)
12. **AC-12**: Offline operations sync to Supabase when network connection restored
13. **AC-13**: Sync status indicator shows "Online" or "Offline - X operations queued"
14. **AC-14**: Teacher can adjust individual student chip counts (+/- or manual value)
15. **AC-15**: Teacher can undo last drop for a student
16. **AC-16**: Teacher can reset entire class period (points and chips)
17. **AC-17**: All point calculations use additive scoring (no multipliers)
18. **AC-18**: Physics simulation maintains 60fps with point-based collisions

## Traceability Mapping

| AC | Spec Section(s) | Component(s)/API(s) | Test Idea |
|----|----------------|---------------------|-----------|
| AC-1 | Services and Modules | Remove: BetControls, GameConfig, Balance components | E2E: Verify no gambling UI elements present |
| AC-2 | Data Models | Remove: RiskLevel, BetMode, WinRecord types; Remove betting stores | Unit: Verify gambling types/stores not exported |
| AC-3 | Data Models, APIs | `POINT_SLOTS` constant, PlinkoEngine collision handler | Unit: Verify POINT_SLOTS array values; E2E: Drop ball, verify point values |
| AC-4 | Services and Modules, APIs | ClassPeriodSelector component, `activeClassPeriod` store | E2E: Click period selector, verify active period changes |
| AC-5 | Data Models, APIs | Supabase players table with `class_period` field, indexed queries | Integration: Create players in 6 classes, verify isolation |
| AC-6 | Data Models, APIs | Supabase `updatePlayerPoints()`, `recordDrop()` | E2E: Earn points, reload page, verify points persist |
| AC-7 | Services and Modules, APIs | Leaderboard component, `classLeaderboard` derived store | E2E: Verify leaderboard sorted by totalPoints DESC |
| AC-8 | NFR Performance, APIs | Supabase real-time subscription, `subscribeToClassLeaderboard()` | Performance: Measure update latency <200ms |
| AC-9 | Workflows and Sequencing | SyncService midnight detection, `resetDailyChips()` RPC | Integration: Mock midnight crossing, verify chips reset to 10 |
| AC-10 | Services and Modules, APIs | TeacherAdminPanel component, `resetDailyChips(classPeriod)` | E2E: Click manual reset, verify chips = 10 for class |
| AC-11 | NFR Reliability, Workflows | IndexedDB cache, offlineQueue operations, PlinkoEngine | E2E: Disconnect network, drop ball, verify points tracked |
| AC-12 | Workflows and Sequencing, APIs | `syncQueuedOperations()`, exponential backoff logic | Integration: Queue ops offline, reconnect, verify sync |
| AC-13 | Services and Modules, NFR Observability | `syncStatus` store, UI sync indicator component | E2E: Disconnect network, verify "Offline - X queued" shown |
| AC-14 | Services and Modules, APIs | TeacherAdminPanel, `updatePlayerChips(playerId, chips)` | E2E: Adjust chips via admin panel, verify updated value |
| AC-15 | Services and Modules, APIs | TeacherAdminPanel undo function, delete last DropRecord | E2E: Drop ball, click undo, verify points/chips reverted |
| AC-16 | Services and Modules, APIs | TeacherAdminPanel reset function, Supabase batch updates | E2E: Reset class, verify all players points=0, chips=10 |
| AC-17 | Data Models, Workflows | `POINT_SLOTS`, PlinkoEngine collision handler, no multiplier logic | Unit: Verify no multiplier references in collision handler |
| AC-18 | NFR Performance, Services | PlinkoEngine 60fps target, Matter.js integration | Performance: Monitor FPS during drops, verify ≥60fps |

## Risks, Assumptions, Open Questions

**Risks:**

1. **[Risk]** Supabase free tier quota limits (500MB database, 2GB bandwidth/month)
   - **Mitigation**: Monitor usage, upgrade to paid tier if needed (~$25/month)
   - **Impact**: HIGH - Could block all network operations if quota exceeded

2. **[Risk]** IndexedDB quota exhaustion in offline mode (browser-dependent, ~50MB typical)
   - **Mitigation**: Implement queue size limit (max 1000 operations), alert teacher
   - **Impact**: MEDIUM - Prevents new operations until sync completes

3. **[Risk]** Sync conflict resolution with last-write-wins may lose data
   - **Mitigation**: Timestamp all operations, log conflicts for teacher review
   - **Impact**: LOW - Rare edge case with multiple teachers on same class

4. **[Risk]** Real-time subscription failures require polling fallback
   - **Mitigation**: Implement 5-second polling when WebSocket connection drops
   - **Impact**: LOW - Degrades to slightly delayed updates

5. **[Risk]** Brownfield refactoring may introduce physics regression bugs
   - **Mitigation**: Preserve existing PlinkoEngine tests, add new point-based tests
   - **Impact**: MEDIUM - Could affect core gameplay experience

**Assumptions:**

1. **[Assumption]** Teachers have stable internet during chip management operations
   - **Validation**: Test offline admin panel functionality in Story 3

2. **[Assumption]** Browser supports IndexedDB (all modern browsers since 2015)
   - **Validation**: Add feature detection on app load, show error if unsupported

3. **[Assumption]** Six class periods sufficient for all use cases (no 7th period schools)
   - **Validation**: Confirm with user during implementation, easy to extend to 8 if needed

4. **[Assumption]** Point values (10-1000) provide sufficient reward variance
   - **Validation**: Gather feedback during testing, adjust POINT_SLOTS if needed

5. **[Assumption]** Daily chip reset at midnight local time is acceptable (not server time)
   - **Validation**: Confirm with user, could switch to server time via Supabase function

6. **[Assumption]** Existing Matter.js physics determinism preserved after refactoring
   - **Validation**: Run physics regression tests comparing old vs new collision handlers

**Open Questions:**

1. **[Question]** Should teacher authentication use Supabase Magic Link, OAuth, or simple password?
   - **Next Step**: Clarify with user during Story 3 planning

2. **[Question]** What happens to queued operations if IndexedDB is cleared by browser?
   - **Next Step**: Document data loss scenario, consider warning before browser cache clear

3. **[Question]** Should leaderboard show all students or only top N (e.g., top 10)?
   - **Next Step**: Design decision during Story 3 UI implementation

4. **[Question]** Is undo functionality (AC-15) limited to most recent drop or arbitrary history?
   - **Next Step**: Confirm scope - recommend most recent only for MVP

5. **[Question]** Should chip reset preserve historical total points or reset everything?
   - **Next Step**: Clarify AC-16 scope - current spec preserves total points, resets chips only

## Test Strategy Summary

**Test Levels and Coverage:**

**1. Unit Tests (Vitest)**
- **Target Coverage**: 80% for new services (supabase.ts, offlineQueue.ts, syncService.ts)
- **Focus Areas**:
  - New TypeScript types and constants (POINT_SLOTS validation)
  - Utility functions for sync logic, queue management
  - Store logic for classroom state and derived stores
  - Removal validation (ensure gambling types/stores not exported)
- **Test Files**: `src/lib/services/__tests__/*.test.ts`, `src/lib/stores/__tests__/*.test.ts`

**2. Integration Tests (Vitest + Supabase Test Instance)**
- **Target Coverage**: All Supabase operations and sync workflows
- **Focus Areas**:
  - Database CRUD operations (players, drop_records tables)
  - Offline queue → Supabase sync flow with exponential backoff
  - IndexedDB caching and retrieval
  - RLS policy enforcement (class period isolation)
  - Real-time subscription message handling
- **Setup**: Supabase local dev instance or test project with seeded data

**3. E2E Tests (Playwright)**
- **Target Coverage**: All 18 acceptance criteria
- **Critical Scenarios**:
  - **Gambling Removal** (AC-1, AC-2): Verify no gambling UI/code remains
  - **Point System** (AC-3, AC-17, AC-18): Drop ball, verify point values, check 60fps
  - **Multi-Class** (AC-4, AC-5, AC-6, AC-7, AC-8): Switch classes, verify isolation and real-time updates
  - **Offline Mode** (AC-11, AC-12, AC-13): Disconnect network, drop balls, reconnect, verify sync
  - **Admin Controls** (AC-9, AC-10, AC-14, AC-15, AC-16): Chip management, undo, reset
- **Test Files**: `tests/classroom/*.spec.ts`, `tests/offline/*.spec.ts`, `tests/admin/*.spec.ts`

**4. Performance Tests (Custom + Lighthouse)**
- **Metrics to Validate**:
  - Initial load <500ms (Lighthouse Performance score)
  - Physics 60fps during concurrent drops (custom FPS monitor)
  - Leaderboard update <200ms (custom latency measurement)
  - Sync operation <2s for 50 ops (custom timer)
- **Tools**: Lighthouse CI, custom performance observers

**Test Data Strategy:**
- **Seeded Data**: 6 classes with 10 students each (60 total players)
- **Point Ranges**: Test edge cases (0 points, max points, negative scenarios)
- **Offline Scenarios**: Mock network failures at different workflow stages
- **Concurrency**: Simulate multiple students dropping simultaneously

**Frameworks and Tools:**
- **Unit/Integration**: Vitest (existing)
- **E2E**: Playwright (existing)
- **Supabase Testing**: Supabase CLI local dev or test project
- **Performance**: Lighthouse, Chrome DevTools Performance API
- **Mocking**: Vitest mocks for Supabase/IndexedDB in unit tests

**Edge Cases to Cover:**
1. Browser refresh mid-drop (ball in motion)
2. IndexedDB quota exceeded during queue growth
3. Supabase rate limiting or quota errors
4. Concurrent chip adjustments by multiple teachers
5. Midnight chip reset during active gameplay
6. Class period switch during ball drop
7. Network disconnection during Supabase write
8. Real-time subscription reconnection after network restore

**Regression Testing:**
- Preserve existing PlinkoEngine physics tests
- Compare physics behavior before/after refactoring (deterministic seeds)
- Verify no performance degradation in build size or load times

**Acceptance Criteria Mapping:**
- Each AC maps to at least one E2E test (see Traceability Mapping table)
- Unit tests support AC verification (e.g., AC-2 verified by type export checks)
- Integration tests validate backend interactions (e.g., AC-6, AC-8, AC-12)
