
# PinSeeker Web - Development Log

## Version: V7.24.0 (Green Orientation Fix)
**Date:** 2024-06-10
**Branch:** `main`
**Status:** ✅ CURRENT

### Features & Fixes
- **Map Orientation Logic**:
  - Fixed a UX issue where the green was appearing at the bottom of the screen instead of the top.
  - Inverted the map container rotation (`-bearing`) so that the "Tee to Green" line points upwards (North/Top).
- **Label Readability**:
  - Adjusted all text labels (Distance, Notes, Measurements) to rotate in the opposite direction of the map, ensuring they remain perfectly horizontal and upright for the user regardless of hole orientation.

## Version: V7.23.0 (Tournament Scorer Mode)
**Date:** 2024-06-09
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **Tournament Scorer Mode**:
  - Added ability to select a specific player to score for when starting a tournament round.
  - Displayed a sticky banner ("Scoring for: [PlayerName]") when in scorer mode to prevent identity confusion.
  - Scores are saved to the specific player's history, not the logged-in user's default history.
- **Map Rotation Logic**:
  - Fixed a critical bug where the map container was double-rotating, causing the green to drift off-screen.
  - The green is now rigorously locked to the top of the device view for all holes.
- **System Stability**:
  - Implemented a robust `CloudService` mock using LocalStorage. This ensures the app functions completely offline or without Supabase credentials during development/demos.

## Version: V7.22.0 (Data Conflict Resolution)
**Date:** 2024-06-09
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **Sync Conflict UI**:
  - Implemented `BagSyncConflictModal` to handle discrepancies between local storage and cloud database upon login.
  - Users can now choose to **Download Cloud Data** (overwrite local) or **Keep Local Data** (overwrite cloud).
- **Database Integrity**:
  - Fixed a critical bug in `syncBag` where `upsert` operations failed due to missing `onConflict` constraints on the `username` column.
  - Optimized `App.tsx` login flow to defer cloud sync until after conflict resolution.

## Version: V7.21.1 (Documentation Sync)
**Date:** 2024-06-09
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Documentation Updates
- **User Manual**: Added dedicated section for Cloud Profile & Sync features in `UserManual.tsx`.
- **Whitepaper**: Updated Core Features to include Cloud Ecosystem and revised the Standard Operating Procedure (SOP) to reflect the new Login flow.
- **Readme**: Updated highlights to mention Multi-User Cloud support.

## Version: V7.21.0 (Multi-User & Cloud Sync)
**Date:** 2024-06-09
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Major Features
- **Multi-User Architecture**:
  - Implemented `UserSession` logic to support individual user profiles.
  - **Single-Terminal Mutex**: Added logic to enforce single-device login. Logging in on a new device invalidates the session on previous devices (Heartbeat check).
- **Cloud Synchronization (Supabase)**:
  - **Profiles**: Stores user identity and active session tokens.
  - **Club Bag Sync**: User's club distances and dispersion settings are now synced to the cloud and restored upon login.
  - **Round History**: Finished rounds are automatically uploaded to the `user_rounds` table in Supabase.
- **Login Flow**:
  - Added a new `Login` page acting as the gateway.
  - Integrated "Pull on Login" to restore user data (Bag & History) from the cloud immediately.

## Version: V7.20.2 (Search Disambiguation)
**Date:** 2024-06-08
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **Course Search Experience**:
  - **Multi-Result Selection**: When using the "Search & Map" feature, if multiple location candidates are found (via OpenStreetMap), the app now presents a **Selection Modal** instead of automatically picking the first result.
  - **UX Improvement**: Users can see the full address/display name of each candidate to ensure they are mapping the correct golf course.
  - **Smart Data Filling**: Selecting a location from the list automatically populates the Country field based on the geocoded address data.

## Version: V7.20.1 (Course Manager UX)
**Date:** 2024-06-08
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **Course Manager UX**:
  - Added a dedicated "Create Custom Course" button at the top of the "My Courses" tab for easier access (removed dependency on New Round flow).
  - Clearer separation between managing local courses and downloading online ones.
- **Build System**:
  - Fixed dependency issue with `@google/genai` by using wildcard versioning to fetch the latest available package in the CI environment.

## Version: V7.20.0 (Cloud Sync & AI Search)
**Date:** 2024-06-08
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **Cloud Overwrite Logic**:
  - Implemented logic to check if a course already exists in the cloud before uploading.
  - Added a confirmation dialog allowing users to **Overwrite/Update** existing courses or create duplicates.
  - Resolved `CourseManager` upload flow to support course maintenance.
- **Smart Course Search (Editor)**:
  - **AI Grounding**: Integrated Gemini API (`gemini-3-flash-preview`) with Google Search tools to find course coordinates via natural language (e.g., "Carton House O'Meara location").
  - **Direct Coordinates**: Added support for pasting `Lat, Lng` directly into the search bar.
  - **External Maps**: Added a "Find on Google Maps" button to help users locate obscure courses manually.
- **Multi-Course Support**: Added UI hints for users creating complex facilities (27+ holes) to split them into separate 18/9 hole entries.

## Version: V7.19.0 (Codebase Refactoring & Schema)
**Date:** 2024-06-07
**Branch:** `refactor/map-icons`
**Status:** ✅ ARCHIVED

### Architecture & Refactoring
- **Component Decoupling**: Extracted all Leaflet map icon definitions and marker generation logic from `PlayRound.tsx` into a dedicated utility file `utils/mapIcons.ts`.
- **Code Health**: Reduced the complexity of the main game loop component, improving readability and maintainability.
- **Database Schema**: Added `supabase_schema.sql` to the repository. This file contains the idempotent SQL commands required to initialize the `courses` table and apply necessary Row Level Security (RLS) policies for the Cloud Library feature.

## Version: V7.18.3 (Replay Mode Stability)
**Date:** 2024-06-06
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **Replay Course Loading**: Fixed a critical bug where replaying a custom course would incorrectly default to the built-in Duvenhof course. Implemented synchronous state initialization to resolve course data immediately before render.
- **Map Zoom Fix**: Fixed an issue where the map would zoom out to a global view (showing Africa/Atlantic Ocean) during replay due to invalid (0,0) coordinates in the shot history. Added strict filtering for coordinate bounds calculation.

## Version: V7.18.2 (HUD Redesign & Visual Optimization)
**Date:** 2024-06-06
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **HUD Redesign**: Completely refactored the Top-Left Distance display in `PlayRound`.
  - **Vertical Stack**: Layout changed to logical depth order (Back -> Pin -> Front).
  - **Minimalist UI**: Removed redundant text labels ("Front", "Back", "To Pin") to reduce clutter.
  - **Typography**: Significantly increased font sizes. Pin distance is now ultra-prominent (5XL), with legibly large edge distances (LG).
- **Visual Balance**: Adjusted the transparency and compact nature of the HUD card to balance against the right-side tool menu.

## Version: V7.18.1 (UI Polish)
**Date:** 2024-06-06
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **UI Refinement**: Replaced "Tee Off" emojis (🚀/🛰️) with professional Lucide icons (`Rocket`/`Satellite`) to maintain visual consistency with the app's dark/professional theme.
- **Style Unification**: Updated the Tee Off button gradient to match the standard blue action buttons (`from-blue-600 to-blue-700`), removing conflicting colors.
- **Interaction Feedback**: Polished the long-press progress bar animation for the "From GPS" action.

## Version: V7.18.0 (Advanced Stats & GPS Tee)
**Date:** 2024-06-06
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **GPS Tee-Off**: Added long-press (3s) functionality to the "TEE OFF" button. Users can now reset the hole starting point to their current GPS location (e.g., if playing from a different tee box or a specific practice spot).
- **Advanced Analytics**: Completely overhauled the `RoundSummary` page.
  - Added Front 9 / Back 9 / Total split analysis table.
  - Added a traditional horizontal Scorecard Grid view for detailed hole-by-hole review.
  - Added detailed stats including "Average Putts" and "GIR %".
- **Smart Course Data**: Implemented a fallback algorithm for Green Front/Back coordinates. If a course lacks specific edge data, the app now automatically calculates virtual Front/Back points based on the hole orientation and a standard 15-yard radius.

## Version: V7.17.1 (Annotation Tools Repair)
**Date:** 2024-06-06
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **Annotation Mode Fixed**: Restored the missing toolbar for Text, Pin, Drawing, and Eraser tools in `PlayRound`.
- **Map Interaction**: Fixed conflicts where dragging map markers or interacting with UI would accidentally pan the map (updated `RotatedMapHandler`).
- **Drawing Tools**: Added specific "Save" and "Clear" actions for the pen tool to ensure lines are committed correctly.
- **Text Input**: Implemented a modal for entering text notes on the map to prevent layout shifts.

## Version: V7.17.0 (System Stabilization & Git Sync)
**Date:** 2024-06-06
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **Runtime Stability**: Cleaned up `importmap` in `index.html` to resolve "Script error" caused by conflicting React 19/18 dependencies and Vite plugins in the runtime environment.
- **Documentation**: Updated `README.md` with explicit git synchronization commands.
- **Version Control**: Synchronized `package.json` and UI version display to 7.17.0.

## Version: V7.16.1 (Documentation Sync)
**Date:** 2024-06-05
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **User Manual Update**: Added comprehensive guide for the new HDCP-driven auto-configuration feature.
- **Consistency Audit**: Verified that HDCP editing, modal triggers, and storage persistence are fully synchronized across Dashboard and Settings.

## Version: V7.16.0 (HDCP-Driven Strategy)
**Date:** 2024-06-05
**Branch:** `main`
**Status:** ✅ ARCHIVED

### Features & Fixes
- **HDCP Club Auto-Config**:
  - Users can now edit their HDCP from the Dashboard.
  - Added a smart generator that creates a full 14-club bag with realistic Carry, Side Error, and Depth Error based on skill level.
  - Higher HDCP results in shorter distances and wider dispersion ellipses.
- **Persistence**: HDCP is now saved to local storage.
- **UI/UX**: 
  - Added HDCP input modal.
  - Added club synchronization confirmation dialog.

## Version: V7.15.0 (Stable Milestone - Refactored)
**Date:** 2024-06-05
**Branch:** `main`
**Status:** ✅ ARCHIVED
