# Brainstorming Session Results

**Session Date:** 2025-10-22
**Facilitator:** Business Analyst Mary
**Participant:** Frank

## Executive Summary

**Topic:** Transform Classroom-Plinko from gambling game to educational classroom competition game

**Session Goals:** Define MVP requirements for converting the existing browser-based Plinko gambling game into a classroom-appropriate points-based competition system with multi-class leaderboard tracking and offline capability.

**Techniques Used:** Collaborative requirements elicitation through interactive dialogue, focusing on user needs clarification, technical constraints exploration, and systematic feature definition.

**Total Ideas Generated:** 15+ core requirements and features identified

### Key Themes Identified:

1. **Fundamental Game Mechanics Transformation** - Convert from gambling multipliers to additive point accumulation
2. **Classroom Management Integration** - Chip allocation system as behavior management tool
3. **Multi-Class Competition** - Six class periods competing on shared leaderboard
4. **Offline-First Architecture** - Robust local/cloud sync for unreliable school internet
5. **UI Simplification** - Remove gambling-specific features (risk levels, auto-bet, balance system)

## Technique Sessions

### Interactive Requirements Elicitation

**Approach:** Direct questioning and clarification dialogue to uncover user needs and technical requirements

**Key Discoveries:**

1. **Shared Display Model**: Game runs on teacher's computer/projector, not individual student devices
2. **Manual Control**: Teacher manually selects students in real life; students simply press button to drop chip
3. **Class-Level Competition**: Tracking per class period, not individual students (6 classes total)
4. **Behavior Management Tool**: Chip allocation serves dual purpose as incentive system
5. **Physical Classroom Context**: Internet occasionally drops, needs robust offline handling

**Generated Ideas:**

1. Replace gambling multipliers with fixed point values in nine slots
2. Implement three-column leaderboard (class name, total points, chips remaining)
3. Add teacher admin controls for chip management (+/- per class)
4. Automatic midnight reset of chip counts
5. Manual reset button for teacher control
6. Undo functionality for correcting mistakes
7. Remove risk level settings (gambling feature)
8. Remove row count configuration (gambling feature)
9. Remove auto-bet mode (gambling feature)
10. Remove balance/deposit system (gambling feature)
11. Supabase PostgreSQL cloud database
12. IndexedDB for offline queue and sync
13. Point slot configuration: 100, 500, 1000, 0, 10000 (center), 0, 1000, 500, 100
14. Always-visible leaderboard sidebar during gameplay
15. Five chips per class per day default allocation

## Idea Categorization

### Immediate Opportunities
_Ideas ready to implement now_

1. **Point Slot Conversion**
   - Replace multiplier slots with fixed point values
   - Configure nine slots: 100, 500, 1000, 0, 10000, 0, 1000, 500, 100
   - Symmetric layout with highest value in center
   - Simple additive scoring (no multiplication or risk calculation)

2. **Remove Gambling Features**
   - Delete risk level selection UI and logic
   - Remove row count configuration (fix at current board size)
   - Eliminate auto-bet mode completely
   - Remove balance/deposit/withdraw system
   - Simplify UI to essential classroom functions only

3. **Basic Class Period Selection**
   - Add simple UI control for teacher to select which class period is active
   - Six class period options (matching teacher's schedule)
   - Persistent selection until teacher changes it
   - No password protection needed (teacher controls computer)

4. **Simple Leaderboard Display**
   - Three-column table: Class Name | Total Points | Chips Remaining
   - Always visible in sidebar (left or right of game board)
   - Real-time updates as chips are dropped
   - Sorted by total points (highest first)

### Future Innovations
_Ideas requiring development/research_

5. **Supabase Integration**
   - Set up Supabase project and PostgreSQL database
   - Design schema: classes table (id, name, total_points, chips_remaining, last_reset)
   - Implement real-time subscriptions for leaderboard updates
   - Configure Row Level Security policies
   - Set up authentication for potential multi-teacher deployment

6. **Offline Queue System**
   - Implement IndexedDB using Dexie.js library
   - Queue all point additions and chip decrements when offline
   - Auto-sync queue every 30-60 minutes when online
   - Retry failed syncs with exponential backoff
   - Show sync status indicator in UI

7. **Teacher Admin Panel**
   - Chip management controls (+1, -1, reset per class)
   - Undo last drop functionality
   - Manual "Reset All Chips" button
   - View sync status and pending offline queue
   - Export leaderboard data (future: for parent communication)

8. **Automated Daily Reset**
   - Scheduled task runs at midnight local time
   - Resets all class chip counts to 5
   - Preserves total points (cumulative for monthly competition)
   - Logs reset events for audit trail
   - Handles edge cases (app not running at midnight)

### Moonshots
_Ambitious, transformative concepts_

9. **Multi-Teacher Deployment**
   - Multiple teachers using same Supabase backend
   - School-wide leaderboards across all classes
   - Teacher authentication and class assignment
   - Admin dashboard for school coordinator
   - Export reports by teacher, class, time period

10. **Advanced Analytics**
    - Track individual student turns (requires student ID feature)
    - Probability analysis of slot distributions
    - Identify patterns in class performance
    - Gamification insights (optimal chip usage strategies)
    - Parent/student portal for viewing progress

11. **Enhanced Classroom Integration**
    - Integration with Google Classroom or Canvas
    - Automated rewards based on point thresholds
    - Tie chip allocation to behavior tracking systems
    - Printable certificates for winning classes
    - Monthly/quarterly competition reset with archive

12. **Progressive Web App Features**
    - Install as standalone desktop app
    - Push notifications for competition updates
    - Service worker for true offline-first architecture
    - Background sync when app is closed
    - Native-like full-screen experience

### Insights and Learnings
_Key realizations from the session_

1. **Existing Codebase is 90% Complete**: The physics engine, UI components, and game mechanics are already built and functioning. The transformation is primarily about data flow changes, not gameplay reconstruction.

2. **Simplification is Key**: Removing gambling features actually simplifies the codebase and UI significantly, making the educational version cleaner and more maintainable.

3. **Classroom Context Drives UX Decisions**: Understanding that this is a shared display, teacher-controlled experience eliminated entire categories of features (student accounts, individual device support, complex authentication).

4. **Behavior Management is Primary Use Case**: The chip allocation system serves as both game mechanic and classroom management tool, making it central to the design.

5. **Internet Reliability is Critical Concern**: School Wi-Fi instability requires robust offline-first architecture, not just a nice-to-have feature.

6. **Competition Timeframe Matters**: Monthly competition cycle with daily chip resets creates an interesting temporal design - cumulative points persist, but opportunities reset daily.

7. **Teacher Control vs. Automation Balance**: Need both automated systems (midnight reset, auto-sync) and manual overrides (undo, manual reset, chip adjustment) for practical classroom use.

## Action Planning

### Top 3 Priority Ideas

#### #1 Priority: Core Game Mechanics Transformation

**Rationale:** This is the foundational change that enables all other features. Without converting from gambling multipliers to point accumulation, the game cannot function as an educational tool. This touches the core game logic, data models, and UI.

**Next steps:**
1. Audit existing codebase to identify all files/functions related to betting, multipliers, balance, and risk calculation
2. Design new data model: remove balance/bet fields, add class_id and cumulative_points
3. Modify game engine to use fixed point slots instead of dynamic multipliers
4. Update UI to show point values instead of multiplier values in slots
5. Refactor scoring logic from `balance = balance * multiplier` to `points = points + slot_value`
6. Remove all UI components related to betting, deposits, withdrawals, risk settings
7. Test physics and scoring thoroughly to ensure point accumulation is accurate

**Resources needed:**
- Full read of `/src/lib/components/Plinko/PlinkoEngine.ts` (physics engine)
- Analysis of `/src/lib/stores/game.ts` (game state management)
- Review of `/src/lib/types/game.ts` (type definitions to modify)
- Understanding of Matter.js collision detection and slot detection logic

**Timeline:** 2-3 development days (stories 1-4 in tech spec)

#### #2 Priority: Database Integration (Supabase + IndexedDB)

**Rationale:** Persistent data storage is essential for multi-day competition tracking. Without a database, points reset every time the app is closed. The offline-first architecture ensures reliability in classroom environments with unstable internet.

**Next steps:**
1. Set up Supabase project and obtain API credentials
2. Design PostgreSQL schema for classes table
3. Create Supabase client configuration in SvelteKit app
4. Implement Dexie.js wrapper for IndexedDB
5. Build sync service with queue management and retry logic
6. Add service worker for background sync (optional for MVP)
7. Implement error handling and sync status UI indicators
8. Test offline scenarios: queue buildup, sync on reconnect, conflict resolution

**Resources needed:**
- Supabase account and project setup
- Dexie.js library integration
- SvelteKit server-side API routes for Supabase operations
- Understanding of SvelteKit load functions and stores for reactive data

**Timeline:** 3-4 development days (stories 5-7 in tech spec)

#### #3 Priority: Leaderboard and Class Management UI

**Rationale:** The leaderboard is the primary motivational tool for the classroom competition. Class period selection and chip management are essential teacher controls. These features tie together the game mechanics and data persistence into a usable classroom tool.

**Next steps:**
1. Design three-column leaderboard component (class name, points, chips)
2. Implement sidebar layout (responsive positioning for different screen sizes)
3. Create class period selection UI (dropdown or button group)
4. Build teacher admin controls: chip +/-, undo, manual reset
5. Add automatic midnight reset logic (cron job or scheduled task)
6. Implement real-time leaderboard updates via Supabase subscriptions
7. Style UI to be classroom-appropriate (large fonts, high contrast, clean design)
8. Test with multiple classes, various chip counts, and leaderboard sorting

**Resources needed:**
- SvelteKit component development (reactive stores and lifecycle)
- Tailwind CSS for styling (already in project)
- Supabase real-time subscriptions API
- Cron job library or SvelteKit scheduled tasks for midnight reset

**Timeline:** 2-3 development days (stories 8-10 in tech spec)

## Reflection and Follow-up

### What Worked Well

1. **Interactive Dialogue Format**: Voice-based conversation allowed for rapid clarification and iterative refinement of requirements, catching misunderstandings early.

2. **Existing Codebase Analysis**: Having comprehensive documentation of the brownfield project immediately available provided critical context for feasibility discussions.

3. **Constraint Identification**: Uncovering the physical classroom context (shared display, teacher control) early eliminated entire categories of unnecessary features.

4. **Technical Stack Validation**: Confirming SvelteKit as the base prevented a massive framework migration rabbit hole.

5. **Behavior Management Discovery**: Identifying chip allocation as a dual-purpose feature (game mechanic + classroom management) strengthened the design.

### Areas for Further Exploration

1. **Student Identification**: MVP treats classes as monolithic entities. Future exploration: should individual students be tracked within classes? How would that change the data model and UX?

2. **Competition Cadence**: Monthly competition decided, but should there be weekly sub-competitions? Daily mini-goals? How to maintain engagement over 4 weeks?

3. **Point Slot Configuration**: Fixed nine-slot layout defined, but should teachers be able to customize point values or slot count? Trade-off between simplicity and flexibility.

4. **Chip Economy Complexity**: Five chips per day is simple, but could "bonus chips" for achievements create more engagement? Risk of overcomplicating behavior management.

5. **Multi-Teacher Scaling**: If this succeeds, how hard would it be to deploy school-wide? What additional features would that require?

6. **Accessibility**: Are the visuals and interactions accessible for students with disabilities? Color contrast, font sizes, alternative input methods?

### Recommended Follow-up Techniques

1. **User Journey Mapping**: Walk through a typical week in the classroom - when are chips dropped, how are conflicts resolved, what happens when internet fails mid-game?

2. **Failure Mode Analysis**: What could go wrong? Internet outage during competition, accidental chip drops, database corruption, browser crashes. How do we recover?

3. **Comparative Analysis**: Research other classroom gamification tools - what features do they offer? Are there patterns we should adopt or anti-patterns to avoid?

4. **Prototype Testing**: Once MVP is built, pilot with one class before rolling out to all six. What usability issues emerge in real classroom chaos?

5. **Scalability Planning**: If this works, how would it deploy to other teachers? What needs to be configurable vs. hardcoded?

### Questions That Emerged

1. What happens if two classes end with the same total points at month-end? Tie-breaker rules?
2. Should there be a "practice mode" where drops don't affect leaderboard, for testing or demonstrations?
3. How are new students added mid-month? Do they join existing class totals or get a separate entry?
4. Should there be a history log of all drops (date, time, class, points earned) for transparency?
5. What's the reward for winning the monthly competition? Physical prize? Certificate? Social recognition?
6. Should parents have read-only access to see their student's class performance?
7. Is there a way to "pause" a class temporarily (e.g., substitute teacher day) without losing their data?
8. Should the leaderboard show additional stats (average points per chip, best single drop, etc.)?
9. How should the app handle daylight saving time changes for the midnight reset?
10. Should there be sound effects or animations for significant drops (e.g., landing on 10,000)?

### Next Session Planning

**Suggested topics:**
1. Technical specification deep dive - translating these requirements into detailed stories
2. UI/UX mockups - visualizing the leaderboard, admin controls, and simplified game interface
3. Database schema design - defining the exact tables, fields, and relationships for Supabase
4. Testing strategy - unit tests, integration tests, and classroom pilot scenarios
5. Deployment planning - how to package and deploy this for Frank's classroom computer

**Recommended timeframe:** Proceed immediately to technical specification phase (same session or within 24 hours)

**Preparation needed:**
- PM agent to review this brainstorming report
- Load all relevant codebase files for deep analysis
- Reference existing documentation (`/docs/architecture.md`, `/docs/component-inventory.md`, etc.)
- Prepare story template for breaking down MVP into implementable tasks
- Consider edge cases and failure modes for each requirement

---

## Implementation Readiness

### MVP Scope Confirmed

**In Scope:**
- Remove gambling features (multipliers, risk, auto-bet, balance)
- Add nine fixed point slots (100, 500, 1000, 0, 10000, 0, 1000, 500, 100)
- Class period selection (six classes)
- Three-column leaderboard (name, points, chips)
- Teacher admin controls (chip +/-, undo, manual reset)
- Automatic midnight chip reset
- Supabase PostgreSQL database
- IndexedDB offline queue with auto-sync
- SvelteKit architecture (no framework change)

**Out of Scope for MVP:**
- Individual student tracking
- Multi-teacher deployment
- Parent portal
- Advanced analytics
- Google Classroom integration
- Push notifications
- Bonus chip systems

### Success Criteria

MVP will be considered successful when:
1. Teacher can select active class period
2. Students can drop chips and see points accumulate
3. Leaderboard updates in real-time
4. Points persist across browser sessions (database working)
5. Chips reset automatically at midnight
6. Teacher can adjust chips and undo mistakes
7. Game works offline and syncs when internet returns
8. No gambling-related UI or logic remains

### Next Steps

1. **Immediate**: Run `/bmad:bmm:agents:pm` to load Product Manager agent
2. **Execute**: Run `tech-spec` workflow to create technical specification and story files
3. **Break Down**: Generate 8-10 implementable stories for development phase
4. **Review**: Validate stories against existing codebase structure
5. **Plan**: Move to sprint planning phase for development prioritization

---

_Session facilitated using the BMAD CIS brainstorming framework_
_Next Phase: Technical Specification (PM Agent - tech-spec workflow)_
