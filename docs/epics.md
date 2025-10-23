# Classroom-Plinko - Epic Breakdown

## Epic Overview

**Epic:** Educational Classroom Competition Transform

**Epic Slug:** classroom-competition

**Goal:** Transform the existing gambling-based Plinko game into an educational classroom competition tool with multi-class leaderboard tracking, offline capability, and teacher management controls.

**Scope:**
- Remove all gambling mechanics (betting, multipliers, risk levels, balance tracking)
- Implement fixed point-value slots for educational gameplay
- Add six-class period competition with persistent leaderboard
- Integrate Supabase cloud database with offline-first IndexedDB queue
- Create teacher admin panel for chip management and game control
- Ensure robust offline operation for unreliable school internet

**Success Criteria:**
- Zero gambling features remain in UI or code
- Teachers can select active class period and track six classes simultaneously
- Points accumulate correctly across browser sessions (persistent database)
- Leaderboard displays real-time rankings by total points
- Chips reset automatically at midnight (with manual override)
- Game functions offline and syncs when connection restored
- All admin controls (chip adjustment, undo, reset) work correctly

**Dependencies:**
- Supabase account and project setup
- Dexie.js for IndexedDB wrapper
- Existing SvelteKit + Matter.js codebase (brownfield)

---

## Epic Details

### Story Map

```
Epic: Educational Classroom Competition Transform
├── Story 1: Remove Gambling and Implement Point System (5 points)
├── Story 2: Implement Database and Offline Sync (5 points)
└── Story 3: Build Classroom Interface (3 points)
```

**Total Story Points:** 13
**Estimated Timeline:** 2 sprints (2 weeks)

### Implementation Sequence

1. **Story 1** → Remove gambling features and implement point-based scoring
   - Foundation for all other work
   - Must complete first to establish new data model

2. **Story 2** → Database integration with offline sync
   - Requires Story 1 complete (new data model)
   - Enables persistence and multi-day competition

3. **Story 3** → Classroom UI and teacher controls
   - Requires Story 2 complete (database operations)
   - Completes the user-facing transformation

### Story Summaries

#### Story 1: Remove Gambling and Implement Point System
**Points:** 5 | **Timeline:** 3-5 days

Transform core game mechanics from gambling multipliers to fixed educational point values. Remove all betting, risk, and balance features. Implement nine fixed-point slots and refactor scoring logic to additive point accumulation.

**Key Files:**
- `src/lib/stores/game.ts` - Remove gambling stores
- `src/lib/types/game.ts` - Remove gambling types
- `src/lib/constants/game.ts` - Replace multipliers with POINT_SLOTS
- `src/lib/components/Plinko/PlinkoEngine.ts` - Collision handler changes
- Delete: BetControls, GameConfig, Balance, LiveStatsWindow components

#### Story 2: Implement Database and Offline Sync
**Points:** 5 | **Timeline:** 3-5 days

Set up Supabase PostgreSQL database for six-class tracking. Implement IndexedDB offline queue with Dexie.js. Build sync service with auto-retry and exponential backoff. Enable real-time leaderboard updates via Supabase subscriptions.

**Key Files:**
- `src/lib/services/supabase.ts` - New Supabase client
- `src/lib/services/offlineQueue.ts` - New IndexedDB queue
- `src/lib/services/syncService.ts` - New sync orchestration
- `src/lib/stores/classroom.ts` - New class state management
- `src/lib/types/classroom.ts` - New type definitions

#### Story 3: Build Classroom Interface
**Points:** 3 | **Timeline:** 2-3 days

Create class period selector (6 classes), always-visible leaderboard sidebar, and teacher admin panel. Implement chip management controls (+/-, reset, undo). Add sync status indicator. Integrate with Supabase for real-time updates.

**Key Files:**
- `src/lib/components/Classroom/ClassPeriodSelector.svelte` - New
- `src/lib/components/Classroom/Leaderboard.svelte` - New
- `src/lib/components/Classroom/TeacherAdminPanel.svelte` - New
- `src/lib/components/Classroom/ChipCounter.svelte` - New
- `src/routes/+page.svelte` - Integrate classroom UI

---

**Generated:** 2025-10-22
**Project Level:** 1 (Coherent Feature)
**Project Type:** Software (Brownfield)
