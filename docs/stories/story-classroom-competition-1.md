# Story: Remove Gambling and Implement Point System

Status: Done

## Story

As a **developer**,
I want **to remove all gambling mechanics and implement fixed point-value slots**,
so that **the game functions as an educational tool instead of a gambling simulation**.

## Acceptance Criteria

1. **AC1:** All gambling-related stores removed from `game.ts` (balance, betAmount, riskLevel, etc.)
2. **AC2:** All gambling-related types removed from `types/game.ts` (BetMode, RiskLevel enums)
3. **AC3:** Fixed point slots implemented: `[100, 500, 1000, 0, 10000, 0, 1000, 500, 100]`
4. **AC4:** Row count fixed at 16 (no user configuration)
5. **AC5:** Scoring logic changed from multiplication to addition
6. **AC6:** PlinkoEngine collision handler returns point value instead of multiplier
7. **AC7:** All gambling UI components deleted (BetControls, GameConfig, Balance, LiveStatsWindow)
8. **AC8:** Slot visual labels display point values instead of multipliers
9. **AC9:** No betting controls visible in UI
10. **AC10:** localStorage cleaned of balance persistence

## Tasks / Subtasks

### Phase 1: Remove Gambling Data Model (AC: #1, #2)
- [x] Delete balance, betAmount, betAmountOfExistingBalls, riskLevel stores from `src/lib/stores/game.ts`
- [x] Delete RiskLevel, BetMode enums from `src/lib/types/game.ts`
- [x] Delete binPayouts multiplier table from `src/lib/constants/game.ts`
- [x] Remove balance persistence logic from `src/routes/+layout.svelte`
- [x] Clean up any imports referencing deleted stores/types

### Phase 2: Implement Fixed Point Slots (AC: #3, #4, #6)
- [x] Add `POINT_SLOTS = [100, 500, 1000, 0, 10000, 0, 1000, 500, 100]` constant to `src/lib/constants/game.ts`
- [x] Add `FIXED_ROW_COUNT = 16` constant
- [x] Modify `PlinkoEngine.ts` `onBallEnteredBin()` to return `POINT_SLOTS[binIndex]` instead of multiplier
- [x] Update collision event to dispatch `{ binIndex, points }` instead of multiplier

### Phase 3: Refactor Scoring Logic (AC: #5)
- [x] Change scoring from `balance = balance + (betAmount * multiplier)` to `points = points + POINT_SLOTS[binIndex]`
- [x] Update `Plinko.svelte` ball landing handler to add points directly
- [x] Remove win/loss calculation logic (no bet to compare against)

### Phase 4: Update UI (AC: #7, #8, #9, #10)
- [x] Delete `src/lib/components/Balance.svelte` file
- [x] Delete `src/lib/components/BinsDistribution.svelte` file
- [x] Delete `src/lib/components/LiveStatsWindow/` folder (entire directory)
- [x] Delete `src/lib/components/Sidebar/BetControls.svelte` file (Note: This was part of Sidebar.svelte)
- [x] Delete `src/lib/components/Sidebar/GameConfig.svelte` file (Note: This was part of Sidebar.svelte)
- [x] Update slot bin labels to show point values (not "1.0x", "5.0x" etc.)
- [x] Remove all betting UI elements from main page

## Dev Notes

### Technical Summary

This story transforms the core game mechanics from a gambling simulator to an educational points system. The critical change is replacing dynamic multiplier calculations with fixed point values, simplifying both the data model and scoring logic. All gambling-specific UI components and stores must be completely removed to avoid confusion and ensure the educational focus.

The physics engine (Matter.js) remains unchanged - only the collision event handlers are modified to return point values instead of multipliers.

### Project Structure Notes

- **Files to modify:**
  - `src/lib/stores/game.ts` (delete stores)
  - `src/lib/types/game.ts` (delete types)
  - `src/lib/constants/game.ts` (replace binPayouts with POINT_SLOTS)
  - `src/lib/components/Plinko/PlinkoEngine.ts` (modify collision handler)
  - `src/lib/components/Plinko/Plinko.svelte` (scoring logic)
  - `src/routes/+layout.svelte` (remove balance persistence)
  - `src/routes/+page.svelte` (remove betting UI)

- **Files to delete:**
  - `src/lib/components/Balance.svelte`
  - `src/lib/components/BinsDistribution.svelte`
  - `src/lib/components/LiveStatsWindow/` (entire folder)
  - `src/lib/components/Sidebar/BetControls.svelte`
  - `src/lib/components/Sidebar/GameConfig.svelte`

- **Expected test locations:**
  - Unit tests: `src/lib/constants/__tests__/game.test.ts` (verify POINT_SLOTS)
  - Integration tests: `tests/e2e/scoring.spec.ts` (verify point accumulation)

- **Estimated effort:** 5 story points (3-5 days)

### References

- **Tech Spec:** See `tech-spec.md` sections:
  - "Game Mechanics Transformation (Stories 1-4)" for approach
  - "Implementation Guide - Phase 1" for step-by-step instructions
  - "Source Tree Structure" for complete file list

- **Architecture:** Existing SvelteKit + Matter.js brownfield codebase
  - Physics engine unchanged (Matter.js 0.19.0)
  - Only modify event handlers and UI layer

## Dev Agent Record

### Context Reference

<!-- Path(s) to story context XML will be added here by context workflow -->

### Agent Model Used

Claude Sonnet 4.5 (claude-sonnet-4-5-20250929)

### Debug Log References

N/A - Implementation completed successfully without debugging requirements

### Completion Notes List

**Implementation Summary:**

All four phases completed successfully, transforming the gambling-based Plinko game into an educational point system:

1. **Phase 1 - Data Model Cleanup**: Removed all gambling stores (balance, betAmount, riskLevel, etc.), enums (BetMode, RiskLevel), and types (WinRecord, BetAmountOfExistingBalls) from the codebase. Deleted binPayouts multiplier table and balance persistence logic.

2. **Phase 2 - Point Slots**: Added POINT_SLOTS constant `[100, 500, 1000, 0, 10000, 0, 1000, 500, 100]` and FIXED_ROW_COUNT=16. Refactored PlinkoEngine collision handler to dispatch custom window events with point values instead of calculating multipliers.

3. **Phase 3 - Scoring Logic**: Created new `points` and `recentWins` stores. Implemented additive point accumulation in Plinko.svelte via ballEnteredBin event listener. Removed all win/loss calculation logic.

4. **Phase 4 - UI Cleanup**: Deleted Balance, BinsDistribution, and LiveStatsWindow components. Completely rewrote Sidebar component to display total points and a simple "Drop Ball" button. Updated BinsRow to display point values instead of multipliers. Refactored LastWins component to show recent point wins. Fixed benchmark page to remove gambling references.

**Additional Changes:**
- Fixed SSR issues by wrapping window event listeners in browser checks (`typeof window !== 'undefined'`)
- Updated utils/game.ts to remove balance persistence functions
- All existing unit tests pass (9 tests in colors and numbers utils)
- Build succeeds with no errors
- Physics simulation maintained at 60fps

### File List

**Modified Files:**
- src/lib/stores/game.ts
- src/lib/types/game.ts
- src/lib/constants/game.ts
- src/lib/components/Plinko/PlinkoEngine.ts
- src/lib/components/Plinko/Plinko.svelte
- src/lib/components/Plinko/BinsRow.svelte
- src/lib/components/Plinko/LastWins.svelte
- src/lib/components/Sidebar/Sidebar.svelte
- src/lib/utils/game.ts
- src/routes/+page.svelte
- src/routes/benchmark/+page.svelte

**Deleted Files:**
- src/lib/components/Balance.svelte
- src/lib/components/BinsDistribution.svelte
- src/lib/components/LiveStatsWindow/ (entire directory)

## SM Review & Acceptance

**Review Date:** 2025-10-22
**Reviewed By:** Bob (Scrum Master)
**Decision:** ✅ ACCEPTED

### Acceptance Criteria Validation (10/10)

All acceptance criteria validated and confirmed met:
- AC1-2: Gambling data model removed ✓
- AC3-4: Fixed point slots and row count implemented ✓
- AC5-6: Additive scoring with point returns ✓
- AC7-10: All gambling UI components deleted ✓

### Quality Gates

- **Unit Tests:** 9/9 passing (colors.test.ts, numbers.test.ts)
- **Build Status:** ✅ Successful, no errors
- **Performance:** ✅ 60fps physics maintained
- **SSR Compatibility:** ✅ SvelteKit prerendering compatible
- **Technical Debt:** ✅ None introduced

### Definition of Done

- ✅ All acceptance criteria met
- ✅ Code compiles without errors
- ✅ Tests passing
- ✅ Documentation complete
- ✅ Aligns with Tech Spec Phase 1

### Story Metrics

- **Effort:** Within 5 SP estimate
- **Files Modified:** 11
- **Files Deleted:** 3
- **Lines Changed:** ~500+
- **Completion Date:** 2025-10-22

**Status:** Ready for Review → **Done**

Story successfully transforms gambling simulator to educational point system. Codebase ready for Story 1-2 (Student Ranking Board).
