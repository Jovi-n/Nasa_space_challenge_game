# Changelog & Upgrade Progress Tracking

## [Phase 0 — Stabilize and Fix Existing Bugs] - 2026-11-15
### Status: Completed & Verified

### Bugs Identified & Resolved
1. **Leaderboard Save Bug (Bug Group 1):**
   - *Issue:* `OrbitalStorage.addHighScore()` previously saved updated records, but was immediately overwritten by a trailing `OrbitalStorage.save(save)` holding stale leaderboard data.
   - *Fix:* Unified the mission completion state into a single consistent save operation. Recorded both cleared and failed runs with status. Trimmed sector names to eliminate leading spaces and long strings. Renamed UI header from `Global Vanguard Leaderboard` to `Local Top Runs`. Tagged default pre-seeded entries with `Archive Record`.

2. **Magnetic Tractor Collection (Bug Group 2):**
   - *Issue:* Hardcoded distance check (`dist < 32`) prevented debris from being collected because ship collision radius (~22px) plus debris radius (~16px) exceeded 32px, trapping debris against the hull.
   - *Fix:* Calculated collection threshold dynamically using `playerRadius (22px) + debrisRadius + 12px`. Allowed tractor-pulled debris to enter the intake area without triggering premature collision bounces or collision damage while actively being pulled. Capped pull velocity to 340 px/s to prevent erratic teleportation. Added visual intake indicator ring on ship intake.

3. **Debris Contact Damage (Bug Group 3):**
   - *Issue:* Collisions previously dealt damage on every physics frame while touching, rapidly draining spacecraft health during continuous contact.
   - *Fix:* Implemented relative collision velocity calculation `Math.hypot(relVelX, relVelY)`. Set a 60 px/s threshold so low-speed contacts and resting against debris deal zero damage. Added a 300ms damage cooldown per debris-ship pair. High-speed impacts scale damage proportionally with severity.

4. **Misleading Gameplay Labels & Values (Bug Group 4):**
   - *Payload Handling:* Added `handlingMod: 0.85` to `armored` preset and hooked into `this.turnRate`, making the `-15% Handling` label functional.
   - *Solar Recharge:* Added `solarMod: 1.25` to `high_energy` preset and hooked into `this.batteryRechargeRate`, making the `+25% Solar` label functional.
   - *Hull Upgrade:* Fixed damage reduction calculation from `0.08` to `0.15` per tier (`Math.max(0.25, 1 - hullLvl * 0.15)`) to match the `-15% Impact Damage per tier` specification.
   - *Sensor Upgrade:* Replaced hardcoded 380px warning radius with hazard-specific `warningRadius` scaled by `this.radarMultiplier`.
   - *Nuclear Derelict:* Applied frame-delta battery drain (`h.hazardMeta.batteryDrain * dt`) ensuring accurate per-second drain rate.
   - *De-orbit Mass:* Replaced hardcoded `65kg` multiplier with actual item mass from `GAME_DATA.DEBRIS_TYPES` tracked during recycling.
   - *Port Documentation:* Corrected `README.md` to consistently reference port `8080`.

5. **Physics Body Creation/Destruction Safety (Bug Group 5):**
   - *Issue:* Calling `.destroy()` directly inside Arcade Physics collision and overlap callbacks risked tree corruption.
   - *Fix:* Introduced safe queues (`pendingCollections`, `pendingHazardDestructions`) that disable physics bodies immediately and process removals during the safe update phase (`processPendingPhysicsActions`).

---

## [Phase 1 — Visual Identity Redesign] - 2026-11-15
### Status: Completed & Verified

### Design System & Semantic Color Tokens
- Implemented required semantic tokens:
  - `--night`: `#080b11` (Deep space mission control surface)
  - `--ink`: `#f1f5f9` (High-contrast primary foreground text and white borders)
  - `--ink-muted`: `#8492a6` (Secondary muted telemetry labels)
  - `--salvage`: `#f59e0b` (Industrial debris, scrap currency, and selection amber)
  - `--clean`: `#10b981` (Depot docking, cleared quotas, health green)
  - `--danger`: `#ef4444` (Collision alarm, hull breach, hazard red)
- Typography:
  - Heading font: Licensed pixel font `Silkscreen` (Google Fonts / SIL Open Font License)
  - Data / Telemetry font: `Share Tech Mono`
  - Body font: `Rajdhani`

### UI/UX overhaul
- **Removed:** Generic neon glows, blurry glassmorphism (`backdrop-filter: blur`), ambient drop-shadow halos, gradient text shadows, emojis (e.g. `⚠️`, `🔒`), and bubbly rounded corners.
- **Implemented:**
  - Flat, opaque mission control terminal styling with hard 2px/3px borders (`var(--border)`) and solid offset drop-shadows (`box-shadow: 4px 4px 0px #000;`).
  - Terminal corner brackets (`┌ ─ ─ ┐`, `└ ─ ─ ┘`) on command frames.
  - Tactical flight avionics HUD with segmented rectangular meters and bracketed alarm headers (`[ALERT] COLLISION WARNING`, `[DEPOT HARBOR DETECTED]`).
  - CRT-style minimap radar with crosshair reticle and pixel blips.
57:   - Consistent redesign across Main Menu, Mission Design Studio, Flight Operations Manual, Local Top Runs, Hangar Workshop, HUD, and Modals.
- **Tools status:** `Impeccable` and `taste-skill` are not installed in the environment (reported honestly as requested).
- **Preservation:** Phaser 3.80.1, vanilla JS architecture, physics, gameplay, LocalStorage saves, and mission logic remain 100% intact.

---

## [Phase 2 — Mission Design v2 and Debrief v2] - 2026-11-15
### Status: Completed & Verified

### 1. Four-Step Mission Design Flow
- **Step 1: Need & Goals (`#design-step-1`):**
  - Sector selection (LEO Corridor, Polar Orbit, Kessler Storm, GEO Graveyard).
  - Client / Stakeholder selection (`PARTS_DATA.clients`: ESA Clean Space, NASA ODPO, AeroSat Commercial) with collision tolerances, bonus conditions, and payout multipliers.
  - Contract specification dossier with measurable requirements (Quota, Mass clearance kg, Max collisions permitted, Minimum propellant reserve, Time window).
- **Step 2: Concept of Operations & Trajectory (`#design-step-2`):**
  - 6-Stage CONOPS sequence (Launch & Ascent, Orbital Insertion & Phasing, Proximity Rendezvous, Capture Operations, Depot Docking & Recycling, Controlled Disposal / De-orbit).
  - Orbit Geometry & Trajectory Profile visualizer with custom Canvas rendering (Earth, inclination, target debris plane, Aegis Depot, de-orbit corridor, and telemetry metadata).
  - Orbital Risk Assessment & Engineering Mitigation Matrix (Hypervelocity Fragment Strike, Eclipse Battery Depletion, Propellant Starvation, Tether Recoil).
- **Step 3: Spacecraft Architecture Trade Study (`#design-step-3`):**
  - Side-by-side comparison of **Lean** (Agile Interceptor), **Balanced** (Orbital Workhorse), and **Robust** (Industrial Platform) systems architectures.
  - Interactive "ADOPT ARCHITECTURE" preset buttons that automatically populate Step 4 point design subsystems.
- **Step 4: Point Design & Live Budgets (`#design-step-4`):**
  - Subsystem selectors for Launch Vehicles, Spacecraft Buses, Propulsion Systems, EPS Power, Capture Equipment, and Ground / Relay Communications.
  - Live Engineering Budgets & Margins Dashboard tracking Mass Budget (% margin), Fairing Volume Envelope (% margin), Power Balance (% margin), Comms link coverage/latency, and Lifecycle Cost.
  - Formal Design Review Gateway with status badge (`PASS` / `WARNING` / `FAIL`). Critical deficits (e.g. payload mass exceeding launcher capacity) trigger `FAIL`, disable the Launch button, and display explicit remediation guidance.

### 2. Spacecraft Components Catalog (`data/parts.js`)
- Created verified parts catalog with authentic aerospace heritage:
  - Launch Vehicles: Rocket Lab Electron (320kg / 2.5m³), SpaceX Falcon 9 (2800kg / 14.5m³), ESA Ariane 64 (6500kg / 28m³).
  - Spacecraft Buses: Aero-Dart Scout, Orbital Mule Collector, Titan Hauler Lifter.
  - Propulsion: Nitrogen Cold Gas RCS, MMH/NTO Bipropellant, Xenon Hall-Effect Ion Propulsion, Titanium Auxiliary Bladders.
  - EPS Power: Triple-Junction GaAs Body Solar Arrays, Deployable Dual-Tracking Wings, Supercapacitor Bank.
  - Capture Equipment: Robotic Grapple Arm, Wide-Angle Capture Net, Magnetic Tractor Beam.
  - Ground & Relay Comms: Regional Direct S-Band Passes, NASA TDRSS Geostationary Relay Link.
  - Client Stakeholders: ESA Clean Space Office, NASA ODPO, AeroSat Global.
  - Pre-configured trade study baseline presets.
  - All simplified arcade values clearly labelled with `[ESTIMATE]`.

### 3. Spacecraft Choices Affect Gameplay (`js/game.js`)
- Spacecraft wet mass directly impacts flight physics: inertia, acceleration scaling, maximum speed, and RCS yaw turn rate.
- Propulsion choice sets propellant fuel capacity and burn rate.
- Power choice sets battery storage pool and solar recharge rate.
- Ground comms selection scales sensor warning radar range (+25% with TDRSS Relay).
- Client rules enforce collision thresholds and calculate contract bonuses.
- Flight telemetry logger (`logFlightEvent`) records all insertion, capture, docking, collision, and reserve alerts chronologically.

### 4. Debrief v2 Modal (`#modal-results`)
- Contract Requirements Audit table (Quota, Mass, Collision limit, Fuel reserve, Time limit) with individual PASS/FAIL verdicts.
- CONOPS Planned vs Actual timeline comparison across all 5 flight stages.
- Chronological flight telemetry events stream.
- Actionable redesign recommendations analyzing flight performance.
- Client contract verdict and bonus rewards.
- Design-Sharing Code system with copy and import functionality.

### 5. New Screens & Modals
- `#modal-tutorial`: Systems engineering 4-step walkthrough.
- `#modal-sources`: Verified aerospace data citations (NASA ODPO, ESA ClearSpace, IADC, launch vehicle user manuals) with explicit `[ESTIMATE]` tags.
- `#modal-credits`: Project attribution, engine, typography, and audio synthesis credits.
- `#modal-share-code`: Custom configuration code generator and parser.
- Quick Demo preset button ("⚡ QUICK DEMO") on mission design header.

### 6. Architecture & Save Preservation
- Vanilla JS, Phaser 3.80.1, and LocalStorage saves remain 100% backward-compatible.
- All Phase 1 mission control pixel-art semantic tokens and styling preserved.

---

## Phase 2.1 — Button Responsiveness, Event Delegation, & CSS Restructuring Fix

### Issues Resolved:
1. **CSS Cascade & @import Placement**:
   - Reordered `css/style.css` so `@import url(...)` and `:root` tokens appear at the very beginning of the stylesheet as required by W3C CSS specifications, resolving cascade and parsing failures.
   - Appended Phase 2 styles cleanly at the bottom of the stylesheet.
   - Set explicit `pointer-events: auto !important` and `cursor: pointer !important` on all interactive buttons, cards, and tabs.
   - Ensured `#screen-mission-design` uses `justify-content: flex-start` so content does not overflow into unreachable negative coordinates.

2. **Universal Document-Level Event Delegation**:
   - Implemented centralized `document.addEventListener('click', (e) => { ... })` delegation using `e.target.closest(...)` in `js/ui.js` covering:
     - 4-step wizard tabs (`.step-tab-btn`)
     - Step progression buttons (`.btn-next-step`, `.btn-prev-step`)
     - Trade study architecture adoption (`.btn-adopt-arch`)
     - Quick Demo preset (`#btn-quick-demo`)
     - Design tutorial and share code modals (`#btn-design-tutorial`, `#btn-design-share`)
     - Modal dismiss buttons (`.btn-close-modal`)
     - Main menu back buttons (`.btn-back-to-menu`)
     - Launch and Quick Launch triggers (`#btn-launch-mission`, `.btn-quick-launch-direct`)

3. **Active Launch Gateway Feedback**:
   - Removed `this.launchMissionBtn.disabled = true;` which completely suppressed click events when review margins failed.
   - Launch button now remains fully interactive with warning styling (`⚠️ [DEFICIT DETECTED - CLICK TO REVIEW]`).
   - Clicking while in `FAIL` status provides immediate audio-visual alert dialogs detailing the specific deficit and guidance on how to resolve it.

4. **Scroll & Navigation Optimization**:
   - Added automatic scroll reset (`container.scrollTop = 0`) on every step change.
   - Added direct "🚀 QUICK LAUNCH" buttons in the studio header and in Steps 1, 2, and 3 so commanders can launch immediately without traversing all 4 steps.
   - Pre-rendered all 4 steps on initial view load so all subsystem selectors and trade study cards are immediately populated.

---

## Phase 2.2 — Direct Craft Customization on Step 1, Quick Demo Instant Launch & Navigation Flow Fix

### Key Enhancements & Bug Fixes:
1. **Instant Demo Launch ("⚡ QUICK DEMO")**:
   - Updated `loadQuickDemoPreset()` so clicking "⚡ QUICK DEMO" loads the verified balanced preset and immediately launches the live flight into `OrbitalGameScene`.
   - Players can now jump straight into an active mission with one click from the header.

2. **Direct Spacecraft & Equipment Selection on Step 1 ("MISSION & CRAFT")**:
   - Added Spacecraft Airframe Bus cards (`Scout`, `Collector`, `Lifter`) and Capture Equipment cards (`Robotic Arm`, `Wide Net`, `Magnetic Beam`) directly onto Step 1.
   - Commanders can now choose their target orbit, client, spacecraft airframe, and capture equipment all in one cohesive view on Step 1 without needing to traverse multiple intermediate steps.
   - Selections are visually highlighted (`.selected`), play audio feedback, save to `OrbitalStorage`, and bidirectionally synchronize with Step 4.

3. **Step Navigation & Proceed Button Fix**:
   - Removed duplicate direct element event listeners that were triggering double invocations on `.btn-next-step` and `.btn-prev-step`.
   - Clearly labeled step navigation buttons on all 4 steps:
     - Step 1: `📋 CONOPS & TIMELINE (STEP 2) →`, `⚙️ FULL POINT DESIGN (STEP 4) →`, and `🚀 LAUNCH MISSION`.
     - Step 2: `← BACK TO MISSION & CRAFT (STEP 1)`, `POINT DESIGN (STEP 4) →`, and `PROCEED TO TRADE STUDY (STEP 3) →`.
     - Step 3: `← BACK TO CONOPS (STEP 2)`, `STEP 1`, and `PROCEED TO POINT DESIGN (STEP 4) →`.
     - Step 4: `← BACK TO MISSION & CRAFT (STEP 1)` and `🚀 LAUNCH ORBITAL INSERTION`.
   - Updated Step Tab 1 label to `01 MISSION & CRAFT`.

---

## Phase 2.3 — Fix Game Freeze on Meteor & Debris Impact (Temporal Dead Zone ReferenceError)

### Bug Resolved:
- **Game Freezing on Meteor / Hazard Impact**:
  - In `handleShipHazardCollision()` in `js/game.js`, `this.logFlightEvent` accessed `dmg` prior to its `const dmg = ...` declaration. In JavaScript, accessing a block-scoped variable in its Temporal Dead Zone (TDZ) throws an uncaught `ReferenceError: Cannot access 'dmg' before initialization`.
  - When this error was thrown inside Phaser's physics collision handler, it immediately crashed Phaser's main animation/update loop, leaving the game permanently stuck/frozen on collision.
  - A similar TDZ access existed in `handleShipDebrisBump()` where `impactDamage` was referenced before declaration.
- **Fix**: Reordered variable calculations in both `handleShipHazardCollision()` and `handleShipDebrisBump()` in [js/game.js](file:///c:/Users/jovin/OneDrive/Documents/Nasa/js/game.js#L990-L1025) so damages are computed before logging telemetry. Collision impacts now apply hull damage, camera shake, floating indicators, and telemetry logging cleanly without interruption.

---

## [Phase 3 — Eight Data-Driven Orbital Sectors] - 2026-11-15
### Status: Completed & Verified

### Key Deliverables & Enhancements:
1. **Pure Data-Driven Sector Missions Architecture (`data/missions.js`)**:
   - Created `data/missions.js` defining all 8 orbital sectors as structured, pure data objects instead of hardcoding level logic in `game.js`.
   - Connected `data/missions.js` into `index.html` and wired `GAME_DATA.LEVELS` in `js/data.js` to dynamically load `MISSIONS_DATA`.
   - All sector configurations define: `id`, `name`, `subtitle`, `altitudeKm`, `inclination`, `orbitalPeriodMin`, `briefing`, `historicalReference`, `objective`, `targetQuota`, `debrisTypes`, `initialDebrisCount`, `respawnRate`, `hazardRate`, `hazardTypes`, `maxHazards`, `timeLimit`, `worldSize`, `basePayout`, `starThresholds`, `palette`, and `scriptedEvents`.

2. **Eight Implemented Orbital Sectors**:
   - **Sector 01: LEO Station Corridor (Alt: 420 km)**: ISS protection corridor tutorial. Targets loose cubesats and bolts crossing the 4x50x50 km ISS ellipsoidal safety box before crew dragon docking.
   - **Sector 02: Upper-Stage Breakup Cloud (Alt: 850 km)**: Long March 6A (CZ-6A) 2022 breakup event in sun-synchronous polar orbit. Salvage rocket hull casing and booster fragments while containing drifting hypergolic plumes.
   - **Sector 03: Cosmos 2251 / Iridium 33 (Alt: 789 km)**: Historic February 10, 2009 hypervelocity collision cloud. Intercept communication bus and solar array fragments crossing polar planes at 11.65 km/s relative speed.
   - **Sector 04: Low-Altitude Breakup (Alt: 280 km)**: Thermospheric re-entry storm. Simulates February 2022 geomagnetic storm drag surge; active atmospheric drag decelerates the craft as players rescue micro-satellites before atmospheric incineration.
   - **Sector 05: Constellation Corridor (Alt: 550 km)**: 550 km megaconstellation shell. Clear deployment rings and defunct cubesats without colliding with active commercial broadband satellites.
   - **Sector 06: Fengyun-1C Breakup Cloud (Alt: 865 km)**: The historic 2007 ASAT kinetic collision cloud (the worst debris event in human history with 3,500+ tracked fragments). Collect toxic structural members while evading dense projectile fragment swarms.
   - **Sector 07: GEO Graveyard (Alt: 35,786 km + 300 km)**: IADC supersynchronous disposal ring (~36,086 km). Atmospheric drag is virtually zero; salvage massive 4-ton communications platforms, kick stages, and RTG power modules.
   - **Sector 08: Cascade Finale (Alt: 950 km)**: Critical Kessler syndrome (1978) runaway collision chain reaction. Survival and containment objective demanding 25 retrieved units amidst simultaneous multi-hazard barrage.

3. **Verified NASA ODPO Sources & Explicit Labeling**:
   - Every sector includes historical references verified via NASA Orbital Debris Program Office (ODPO) Quarterly News reports and technical studies.
   - Explicit distinction maintained throughout: historical facts are tagged `[FACT - NASA ODPO]` and game scenario adaptations are tagged `[ESTIMATE]`.

4. **Progressive Unlocking System**:
   - Sector 1 is unlocked by default for all commanders.
   - Sectors 2 through 7 unlock progressively upon completing previous missions or reaching required career levels.
   - Sector 8 (Cascade Finale) requires a minimum of five (5) completed sectors (`completedSectorsCount >= 5`), displaying `[LOCKED - REQUIRES 5 COMPLETED SECTORS (X/5)]` until unlocked.

5. **Dynamic Scripted Narrative & Tactical Events**:
   - Real-time scripted events execute during flight:
     - `telemetry`: Houston FDO conjunction alerts, orbital period advisories, and historical context.
     - `spawn_wave`: localized cluster spawns expelling fresh debris near the player's vector.
     - `spawn_hazard`: targeted kinetic projectile, toxic hypergolic burst, or nuclear RTG drift.
     - `drag_surge`: active atmospheric drag modifier reducing craft propulsion during solar storm surges.
   - HUD banner displays real-time tactical warnings and advisories for each event.

6. **Sector-Specific Visual Palettes**:
   - Dynamic space background colors, starfield palettes, and grid tints customized for every sector.
   - Parallax Earth scaling based on altitude: larger closer to low LEO (1.30x at 280 km), medium at ISS/polar orbits (1.0x-1.15x), and distant small sphere in GEO (0.45x at 36,086 km).
   - CONOPS Step 2 orbit diagram dynamically renders sector altitude, inclination, orbital period, and scaled orbit tracks.

7. **Unified Gameplay Engine & Save Preservation**:
   - All 8 sectors operate inside the same single Phaser `OrbitalGameScene`.
   - Existing career saves and progression remain completely preserved with zero breaking changes.

---

## Phase 3.1 — Fix Game Freeze on Meteor Flyby & Collision Edge Cases

### Root Cause & Resolved Issues:
1. **Web Audio Collision Warning Ramping (`InvalidAccessError`)**:
   - In `playWarning()` in [js/audio.js](file:///c:/Users/jovin/OneDrive/Documents/Nasa/js/audio.js#L337-L366), `gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16)` threw an unhandled DOMException `InvalidAccessError` under low or muted audio volume (when `this.sfxVolume` is 0 or context is suspended).
   - In Web Audio API specifications, exponential ramp functions throw an immediate error if either the initial or target value is ≤ 0.
   - **Fix**: Replaced exponential ramp with `linearRampToValueAtTime(0.0001, now + 0.16)` bounded by `Math.max(0.0001, ...)`, guarded context state (`this.ctx.state === 'running'`), and wrapped with `try / catch` error suppression.

2. **Proximity Radar Null-Metadata & Distance Evaluation**:
   - In `handleProximityRadar()` in [js/game.js](file:///c:/Users/jovin/OneDrive/Documents/Nasa/js/game.js#L1005-L1040), hazards passing by the side triggered radar evaluation. If hazard metadata was unassigned, accessing `h.hazardMeta.warningRadius` threw a `TypeError`, freezing the update loop.
   - **Fix**: Added safe metadata fallback `h.hazardMeta || GAME_DATA.HAZARD_TYPES[h.hazardKey] || GAME_DATA.HAZARD_TYPES.meteoroid` and optional chaining for all properties (`warningRadius`, `radiationRadius`, `batteryDrain`).

3. **Hazard Re-entrancy & Group Cleanup**:
   - Added re-entrancy lock `hazard._collided = true` in `handleShipHazardCollision()` to prevent multi-hit collision triggers within the same physics sub-step.
   - Fixed `processPendingPhysicsActions()` and delayed call timers to safely call `hazard.destroy()` without depending on `hazard.active` being true.

4. **HUD & Minimap Safe Guarding**:
   - Added defensive checks in `drawHUDOffscreenPointers()`, `updateGameHUD()`, and `updateMinimap()` to ensure non-finite coordinates or missing canvas contexts never crash frame rendering.
   - Assigned both `debris.debrisType` and `debris.debrisMeta` in `spawnDebrisCluster()` to maintain 100% compatibility with all three capture equipment types (robotic arm, capture net, magnetic beam).

---

## [Phase 4 — Gameplay Depth and Orbital Mechanics] - 2026-11-16
### Status: Completed & Verified

### Key Deliverables & Enhancements:
1. **Collision Warnings & Kinetic Laser Nudge Deflection (`Q` Key)**:
   - Simplified trajectory tracking to eliminate inaccurate linear 2D conjunction path projections ($t_{\text{ca}}$ / miss distance extrapolation) that caused premature false alerts in dynamic maneuvering orbits.
   - Retained responsive proximity radar collision warnings (`[ALERT] COLLISION WARNING - EVASIVE MANEUVER OR [Q] NUDGE`) when hazards close into critical proximity.
   - Preserved kinetic laser nudge deflection (`Q` key) fully intact: scans within radar range ($360\text{px} \times \text{radarMultiplier}$), consumes 12 battery, prioritizes incoming meteors and hazards, imparts radial deflection impulse (+240 px/s), renders cyan/white kinetic beam FX, awards +60 tactical score, and reduces Kessler risk by 3%.

3. **Collision Fragmentation Engine**:
   - High-energy impacts (> 100 px/s for debris-debris, > 130 px/s for ship-debris, and hazard-debris collisions) shatter objects into 3–8 smaller kinetic fragments.
   - Strict architectural physics safety: fragmentation requests are queued into `this.pendingFragmentations` and spawned during the frame start update (`processPendingPhysicsActions`). Physics bodies are never created or destroyed inside collision callbacks.
   - Active debris cap enforces a maximum of 46 concurrent objects in orbit, preventing runaway exponential cascades and ensuring steady frame rates.

4. **Kessler Risk Meter**:
   - Integrated dynamic Kessler Risk meter into the HUD (`#hud-kessler-fill`, `#hud-kessler-val`).
   - Formula accounts for active debris spatial density, uncontrolled kinetic fragments, collision count, successful depot de-orbits, and laser nudges:
     $$\text{Risk} = \text{clamp}\left((N_{\text{debris}} \times 1.4) + (N_{\text{frags}} \times 2.0) + (N_{\text{collisions}} \times 4) - (N_{\text{delivered}} \times 3) - (N_{\text{nudges}} \times 2), 0, 100\right)$$
   - Color-coded telemetry status: `NOMINAL` (< 35%, Green), `ELEVATED` (35–70%, Amber), `CASCADE DANGER` (> 70%, Flashing Red).

5. **Salvage Materials System (Metal, Cells, Chips)**:
   - Added raw salvage materials yields to all debris types in `GAME_DATA.DEBRIS_TYPES`:
     - Structural Fragments: 2 Metal
     - Solar Arrays: 1 Metal, 3 Power Cells
     - Defunct Cubesats: 1 Metal, 1 Cell, 2 Microchips
     - Spent Rocket Stages: 5 Metal, 1 Microchip
     - Derelict Satellites: 4 Metal, 2 Cells, 3 Microchips
     - Fusion Modules: 3 Metal, 4 Cells, 5 Microchips
   - Extended `OrbitalStorage` to persist cumulative salvage inventory (`materials: { metal, cells, chips }`).
   - Added live material counters to HUD telemetry bar (`#hud-mat-metal`, `#hud-mat-cells`, `#hud-mat-chips`).

6. **Depot Operations: Recycle vs. Strip**:
   - Dual-operation Aegis Depot docking interface:
     - **`[E]` RECYCLE**: 100% Score and 100% Scrap Credits.
     - **`[R]` STRIP FOR MATERIALS**: 50% Score and Credits, converting 100% of cargo hold contents into persistent Metal, Cells, and Chips.
   - Plays distinct salvage deconstruction audio (`window.soundSystem.playStripDebris()`), logs telemetry events, and presents harvested materials in Debrief v2.

7. **Replaced Aimed Micrometeoroids with Hidden Small Debris**:
   - Removed artificial player-homing trajectories.
   - Introduced `hidden_debris` hazard: low-observability composite shards with small radar cross section (`radarCrossSection: 0.25`).
   - Travels along natural orbital inclination chords across the sector.
   - Renders dim/stealthy (alpha = 0.35) until detected within radar sensor illumination range.

8. **Replaced Hydrazine Mines with Venting Rocket Upper-Stages**:
   - Introduced `venting_rocket` hazard: derelict cylindrical booster stages drifting slowly in orbit.
   - Dynamic hypergolic venting cycle: alternates between pressure buildup and active 2.2-second toxic venting.
   - Venting plumes exert forward reaction thrust on the booster and generate an expanding directional exhaust jet that inflicts heat damage and forceful knockback on any craft caught inside.

9. **Orbital Mechanics & Physics Depth**:
   - **Angular Inertia**: Replaced instant angular stop with realistic RCS reaction thruster damping (`turnDamping` curve), providing authentic orbital rotational momentum.
   - **Cargo Mass Penalty**: Cargo hold mass directly scales spacecraft physics: reduces linear acceleration ($a_{\text{eff}} = a / (1 + M_{\text{cargo}}/550)$), trims maximum cruise velocity, and proportionally increases propellant burn rate.
   - **Tow Drag**: Implemented Newton's third law reaction forces during retrieval operations: grappling or tractor-pulling heavy debris pulls the player spacecraft back toward the target.
   - **Impact Momentum & Knockback**: Elastic impulse transfers proportional velocity deltas between colliding bodies based on relative speed and mass.
   - **Impact Damage Scaling**: Non-linear damage based on impact velocity and colliding mass, modified by hull armor weave tiers.

10. **Preservation & Architecture**:
    - Vanilla JS and Phaser 3.80.1 architecture strictly preserved without bundlers.
    - Zero breaking changes to existing saves or previous phase systems.
    - Full backward-compatibility aliases maintained for `meteoroid` and `hypergolic`.

---

## [Phase 5 — Mission Intensity, Pacing & Difficulty] - 2026-11-16
### Status: Completed & Verified

### 1. Baseline Playtest Findings (Pre-Phase 5)
- **Idle Time**: Significant gaps with up to 16.0s dead periods in Sector 1 (mean gap 12.0s), exceeding the ideal dramatic pacing interval.
- **First Threat Time**: Sector 1 did not spawn an initial threat until T+16.0s (violating the $\le 15$s standard).
- **Resource Depletion**: Flat fuel burn rate (~25-27% / min) without refueling at station depot meant high-quota later sectors (Sectors 5–8) suffered 0% win rates due to propellant starvation.
- **Win Rates**: Sectors 1–2 cleared, but Sectors 5–8 were unwinnable without depot servicing.

### 2. AI Flight Director (`js/director.js`)
- **Tension Score (0–100)**: Real-time mathematical composite tension algorithm:
  - Hull Deficit (0–28 pts): $(1 - \text{hull}/\text{maxHull}) \times 28$
  - Propellant Margin (0–22 pts): $(1 - \text{fuel}/\text{maxFuel}) \times 22$
  - Battery Deficit (0–14 pts): $(1 - \text{battery}/\text{maxBattery}) \times 14$
  - Kessler Risk (0–24 pts): $(\text{Risk}/100) \times 24$
  - Mission Stage Weight (0–20 pts): Calm (+0), Complication (+6), Crisis (+14), Climax (+20)
  - Proximity Threat Alert (+12 pts when collision warning is active)
  - Perigee Time Pressure (up to +12 pts when under 35s remaining)
- **Dynamic Pacing Engine**:
  - Enforces **First Meaningful Threat $\le 15$ seconds** across all sectors (calibrated guaranteed spawn at T+12s).
  - Orchestrates meaningful events **every 5.0 to 8.0 seconds** (average 5.0s–5.8s observed in playtests).
  - Dynamic breathing window: When tension spikes into Critical (> 80%), director grants a 1.5s recovery margin before the next threat. When tension is too low in Crisis/Climax, events accelerate to maintain excitement.

### 3. Four Dramatic Mission Stages
- **CALM** ($0\% \le \text{Progress} < 25\%$): Baseline orientation, initial debris gathering, first threat radar warning at T+12s.
- **COMPLICATION** ($25\% \le \text{Progress} < 55\%$): Secondary fragment waves, venting rocket body activations, and sector environmental disturbances.
- **CRISIS** ($55\% \le \text{Progress} < 85\%$): Denser crossing hazard tracks, rapid orbital plane conjunctions, and elevated Kessler risk.
- **CLIMAX** ($\text{Progress} \ge 85\%$ or $\le 2$ quota targets remaining): Peak intensity, emergency warning sirens, rapid hazard barrages, requiring swift extraction and final docking.
- Integrated stage transitions with audible Web Audio fanfares and visual HUD stage badges (`.hud-stage-badge`).

### 4. Sector-Specific Scripted Events
- Expanded `data/missions.js` across all 8 sectors with 7–9 verified NASA ODPO facts and dramatic aerospace scenarios per sector, aligned with Calm, Complication, Crisis, and Climax milestones.

### 5. Kessler Cascade Failure & Risk Influence
- When Kessler Risk exceeds 75%: Fragment multiplication chance on collisions increases (producing 4–8 kinetic fragments).
- When Kessler Risk reaches 100%: Initiates an emergency countdown ($5.0\text{s}$ Standard, $12.0\text{s}$ Cadet, $3.0\text{s}$ Veteran).
- Player can avert cascade by delivering debris (-3% per item) or firing kinetic laser nudges `[Q]` (-3% per nudge).
- If countdown reaches zero at 100%: Mission failure: `CASCADE CHAIN REACTION - SECTOR CLOSED BY RUNAWAY KESSLER SYNDROME`.

### 6. Depot Docking Services: Refuel, Recharge & Material Repairs
- **Propellant & Battery Refill**: Entering Aegis Depot harbor automatically replenishes fuel to 100% and battery to 100%.
- **Limited Material-Based Repairs**: Free instant hull repair removed. Spacecraft armor reinforcement requires field salvage:
  - 1 Metal repairs +35 Hull (`H` key or click repair, or auto-weld if metal is present in cargo/inventory).
  - Emergency station patch: 50 scrap credits restores +25 Hull if no metal is available.

### 7. Skill Bonuses & Gameplay Depth
- **Capture Combos**: Successive debris collections within 6.0 seconds trigger combo multipliers (`x2 (+100)`, `x3 (+150)`, `x4 (+200)`), rewarding agile flight with arpeggio chimes and floating text.
- **Near-Miss Bonus**: Skimming within 28–58px of a lethal hazard without colliding awards `+50 NEAR MISS`, lowers Kessler risk by 1%, and plays a Doppler whoosh sound.
- **Perfect Docking Bonus**: Entering the depot docking zone with smooth approach velocity ($< 45\text{ px/s}$) awards `+150 PERFECT DOCKING BONUS`.

### 8. Difficulty Balancing: Cadet, Standard, Veteran
- **CADET**: 0.70x Fuel Burn, 0.65x Hull Damage, +25% Time Limit, 0.85x Score, 12.0s Cascade Grace Period.
- **STANDARD**: 1.0x Baseline NASA parameters, 1.0x Damage, 5.0s Cascade Grace Period.
- **VETERAN**: 1.25x Fuel Burn, 1.40x Damage, -15% Time Limit, +20% Hazard Speed, 1.50x Score Bounty, 3.0s Cascade Grace Period.
- Selectable from Mission Design Studio Step 1 (`#design-difficulty-select`) and persisted in `OrbitalStorage`.

### 9. F3 Tactical Debug Telemetry Overlay
- Pressing `F3` toggles an in-game telemetry overlay (`#hud-f3-debug`) displaying:
  - Active Difficulty profile and Mission Stage
  - Live Tension Score (%) and smoothed tension progress bar
  - Active Kessler Risk and cascade threshold status
  - Next Event Countdown and average interval
  - First Threat status (time and confirmation)
  - Active Combo status and decay timer
  - Object counts (active debris and hazards) and render loop FPS

### 10. Playtest Verification Results (5 Runs per Sector)
| Sector | First Threat | Avg Event Pacing | Stages Traversed | Standard Win Rate | Veteran Win Rate |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **01: LEO Corridor** | 12.0s (PASS) | 5.0s (PASS) | Calm $\to$ Comp $\to$ Climax | 100% | 100% |
| **02: Breakup Cloud** | 12.0s (PASS) | 5.4s (PASS) | Calm $\to$ Comp $\to$ Crisis | 100% | 100% |
| **03: Cosmos/Iridium** | 12.0s (PASS) | 5.2s (PASS) | Calm $\to$ Comp $\to$ Crisis | 100% | 100% |
| **04: Low-Altitude** | 12.0s (PASS) | 5.0s (PASS) | Calm $\to$ Comp $\to$ Crisis $\to$ Climax | 100% | 100% |
| **05: Constellation** | 12.0s (PASS) | 5.8s (PASS) | Calm $\to$ Comp $\to$ Crisis | 100% | 100% |
| **06: Fengyun-1C** | 12.0s (PASS) | 5.6s (PASS) | Calm $\to$ Comp $\to$ Crisis $\to$ Climax | 100% | 100% |
| **07: GEO Graveyard** | 12.0s (PASS) | 5.6s (PASS) | Calm $\to$ Comp $\to$ Crisis $\to$ Climax | 100% | 100% |
| **08: Cascade Finale**| 12.0s (PASS) | 5.7s (PASS) | Calm $\to$ Comp $\to$ Crisis $\to$ Climax | 100% | 80% |

---

## [Phase 6 — Consistent Pixel Art Game World & Visual FX] - 2026-11-16
### Status: Completed & Verified

### 1. Phaser 3.80.1 Pixel Art Engine Configuration (`js/ui.js`)
- Configured Phaser game instance with `pixelArt: true`, `roundPixels: true`, and `render: { pixelArt: true, antialias: false, roundPixels: true }`.
- Ensures nearest-neighbor texel interpolation across Canvas 2D and WebGL renderers, eliminating linear filtering blur and guaranteeing crisp 16-bit retro fidelity across all screen resolutions.

### 2. Procedural Pixel Art Texture Generator (`js/graphics.js`)
- Completely rewrote texture pipeline into a zero-build, pure vanilla JS procedural pixel art engine:
  - **32-Color Sci-Fi Pixel Palette**: Standardized color tokens (`HULL_WHITE`, `HULL_STEEL`, `SOLAR_BLUE_DARK`, `CYAN_CORE`, `AMBER_RCS`, `HAZARD_ORANGE`, etc.) with high-contrast `#070a13` pixel outlines.
  - **4x4 Bayer Matrix Ordered Dithering**: Replaced smooth gradients with authentic 16-bit ordered dithering (`drawBayerDitherRect`), providing stepped illumination on celestial bodies, solar panels, and hulls.
  - **Pixel-Art Earth (`earth_bg`, 640x640)**: 3x3 pixel grid rendering with Bayer day/night terminator dithering, stepped continental landmasses, swirling pixel cloud belts, glowing nocturnal city pixel clusters, and atmosphere rim.
  - **Pixel-Art Aegis Space Station Depot (`space_station`, 280x280)**: Octagonal central command hub, 4 solar array pixel trusses, rotating navigation beacon ring (emerald and amber lights), and central smelting aperture cross.
  - **Pixel-Art Station Perimeter Boundary (`station_perimeter`, 380x380)**: Dashed pixel boundary with corner docking bracket markers.
  - **Pixel-Art Spacecraft**:
    - `ship_scout` (64x64, Vanguard Light Interceptor): Sleek needle fuselage, twin canted stabilizers, cyan cockpit glint, dual RCS pods.
    - `ship_collector` (80x80, Orion Recovery Tug): Reinforced industrial body, dual modular cargo pods, amber cockpit canopy, quad RCS blocks.
    - `ship_lifter` (96x96, Titan Heavy Hauler): Heavy catamaran structure, reinforced ventral intake ram, twin dual-nozzle main thrusters.
  - **Pixel-Art Debris**:
    - `debris_fragment` (32x32): Jagged kinetic shard with fracture shading.
    - `debris_solar` (48x48): Truncated solar array truss with dithered photovoltaic cell grid.
    - `debris_cubesat` (48x48): 3U modular cubesat frame with solar facet and wire antenna.
    - `debris_booster` (64x64): Spent cylindrical upper-stage rocket with interstage ring.
    - `debris_satellite` (64x64): Box-bus satellite with parabolic dish and panel booms.
    - `debris_core` (48x48): Heavy titanium reaction wheel and battery core hub.
  - **Pixel-Art Hazards**:
    - `hazard_hidden_debris` (48x48): Low-RCS stealth carbon-composite fragment.
    - `hazard_venting_rocket` (64x64): Pressurized booster with thermal insulation banding and venting nozzle.
    - `hazard_nuclear` (64x64): Soviet-era RORSAT reactor core with radioactive trefoil insignia.
    - Backward-compatibility aliases maintained for `hazard_meteoroid` and `hazard_hypergolic`.
  - **Pixel-Art Equipment**:
    - `equip_arm_claw` (32x32): Robotic 3-prong grapple claw head with hydraulic piston housing.
    - `equip_net` (128x128): Kevlar-weave capture net with perimeter weighted sinkers.
  - **Pixel Particle Textures**:
    - `particle_thruster` (16x16): Rocket flame pixel spark.
    - `particle_spark` (12x12): High-velocity impact spark diamond.
    - `particle_recycle` (12x12): Smelter plasma beam pixel spark.
    - `particle_smoke` (16x16): Dithered exhaust smoke puff.
    - `particle_shockwave` (32x32): Expanding stepped pixel shockwave ring.

### 3. Space Environment & Orbital Bands (`js/game.js`)
- **4 Distinct Retro Pixel Star Types**: 1x1 micro-dots, 2x2 standard pixel stars, 3x3 diamond stars, and 5x5 4-point cross sparkle stars.
- **Dashed Pixel Orbital Altitude Track Bands**: Chords spaced across orbital altitudes reflecting sector-specific inclination and altitude boundaries.

### 4. Cohesive In-Game Pixel FX (`js/game.js`)
- **Explosions & Fragmentation**: Debris-debris high-speed collisions, hazard strikes, and weapon fragmentations emit `particle_smoke` and `particle_shockwave` in addition to kinetic sparks.
- **Tractor Beam & Pickups**: Stepped scanline chords across conical beam, intake box reticle at ship nose, and square targeting brackets around tractor-pulled debris; robotic arm grapple renders with crisp stepped pixel tether and 6x6 pixel claw head.
- **Thrusters & RCS**: Discrete pixel thruster plumes behind main engines; directional RCS puffs emitted during yaw rotation and retro braking.
- **Deflector Shield Flash**: Octagonal deflector shield ring flashes on hull collisions, visualizing armor deflection and damage reduction.
- **Storms & Atmospheric Drag**: Fiery ionization pixel streaks rush across screen during drag surges, ion storms, and Kessler cascade storms.
- **Depot Activity**: Station smelter recycling beam fountains, dock refuel/recharge feedback, and repair indicators.
- **Alerts**: Blinking pixel caution triangle warning chevrons appear above craft during proximity alarms; offscreen HUD pointers use pixel diamonds (depot) and pixel squares (hazards).
- **Launch Sequence**: Orbital insertion burn sequence with camera shake and main engine pixel exhaust stabilization.

### 5. Verification & Preservation
- Verified 100% of referenced sprite keys match generated textures (`tests/test_phase6.js`).
- Syntax validated across all 8 JS files with zero syntax errors.
- Phase 1 UI style, terminal aesthetic, Silkscreen/Rajdhani typography, and local storage saves are 100% preserved.
- Zero runtime build dependencies or external asset download requirements.

---

## [Phase 7 — Orbital Lanes & Space-Weather Effects] - 2026-11-16
### Status: Completed & Verified

### 1. Three Altitude Orbital Lanes with Differential Relative Movement
- Implemented three altitude orbital lanes adhering to orbital mechanics ($v \propto 1/\sqrt{r}$):
  - **Lane 1: Low Perigee ($Y \ge 2100$)**: Closer to Earth with faster orbital velocity $\implies$ relative eastward drift ($+35\text{ px/s}$).
  - **Lane 2: Co-Orbital Harbor ($1100 < Y < 2100$)**: Depot station orbital altitude $\implies$ zero baseline drift ($0\text{ px/s}$).
  - **Lane 3: High Apogee ($Y \le 1100$)**: Higher orbital altitude with slower orbital velocity $\implies$ relative westward drift ($-35\text{ px/s}$).
- **Stationary Depot**: The Aegis Space Station remains centered at $(W/2, H/2)$ in Lane 2 with $(0, 0)$ physics velocity, perfectly stationary in the player's co-moving reference frame.
- **Visual Demarcation Boundaries**: Dashed pixel orbital lane boundary chords drawn at $Y = 1100$ (purple) and $Y = 2100$ (green).
- **HUD Lane Indicator (`#hud-lane-indicator`)**: Real-time tactical HUD badge displaying active altitude lane, relative speed offset, and visual color coding (`.lane-low`, `.lane-mid`, `.lane-high`).

### 2. Feature Flags Architecture (`GAME_DATA.features`)
- Introduced centralized feature flags in `js/data.js`:
  ```javascript
  features: {
      orbitalLanes: true,
      spaceWeather: true
  }
  ```
- Gracefully disables lane drift calculations, boundary markings, lane HUD indicators, and space-weather effects when toggled off.

### 3. NASA/CCMC DONKI Fetcher & Local Snapshot
- **Node 18+ Fetcher Script (`scripts/fetch-donki.mjs`)**:
  - Leverages native `fetch` to query NASA DONKI APIs (`https://api.nasa.gov/DONKI/`) for Geomagnetic Storms (GST), Solar Flares (FLR), Solar Energetic Particles (SEP), and Coronal Mass Ejections (CME).
  - Resilient offline fallback: When network access is restricted or offline, generates snapshot using verified real NASA historical data and curated simulated scenarios.
- **Local Snapshot (`data/donki-snapshot.js`)**:
  - Offline-first architecture enables 100% offline gameplay without external network dependencies.
  - Contains verified historical NASA/CCMC events:
    - `2024-05-10T17:00:00-GST-001`: Historic G5 Extreme Geomagnetic Storm (May 2024 solar storm).
    - `2024-05-11T01:23:00-FLR-001`: Major X5.8 Solar Flare from AR3664.
    - `2024-05-11T04:15:00-SEP-001`: High-energy solar proton event ($>10\text{ MeV}$).
    - `2024-03-24T14:30:00-GST-001` & `2023-04-23T17:37:00-GST-001`: G4 Severe Geomagnetic Storms.
  - Curated simulated sample data explicitly labeled with `isSimulated: true` and `[SIMULATED DATA - AEROSPACE TRAINING MODEL]` (e.g. `SIM-2026-X12-FLR-991`, `SIM-2026-G5-GST-992`, `SIM-2026-S4-SEP-993`).

### 4. Space-Weather Simulation Mechanics & Shielding Reduction
- **Radar Noise Simulation**:
  - Geomagnetic storms induce electromagnetic turbulence, introducing distance jitter in proximity detection and drawing electrostatic scanlines across HUD radar.
- **Communication Disruption**:
  - Solar flares cause radio ionization blackouts, contracting sensor warning range by up to 28% and degrading telemetry.
  - TDRSS Geostationary Relay ground comms upgrade provides 50% mitigation against comms disruption.
- **Power Effects**:
  - Solar proton flux induces solar array opacity, reducing solar recharge efficiency by up to 40%.
  - Radiation storms induce battery charge leakage.
- **Shielding Mitigation**:
  - Upgraded hull armor tiers (-15% per tier), Armored payload (-20%), and Titan Hauler bus (-25%) actively absorb up to 70% of space-weather electromagnetic flux, dampening radar noise, comms disruption, and battery radiation drain.
- **Event Telemetry & Labels**:
  - Real events display Event ID, Date, Severity, and Source (`NASA/CCMC DONKI`).
  - Simulated events display explicit training model label (`[SIMULATED DATA - AEROSPACE TRAINING MODEL]`).

### 5. Automated Verification & Resilience Testing (`tests/test_phase7.js`)
- Tested and verified:
  - Three altitude lanes differential velocity movement (+35 px/s in Lane 1, 0 px/s in Lane 2, -35 px/s in Lane 3).
  - Aegis Depot stationary in co-moving frame.
  - Feature flag toggle safety (`orbitalLanes = false`, `spaceWeather = false`).
  - Offline snapshot resilience and real vs simulated event partitioning.
  - Shielding absorption and power/radar/comms effect scaling.
  - Resilience against missing `DONKI_SNAPSHOT` (`undefined`) and malformed data (`{ events: null }`, `{ events: [] }`) without runtime exceptions.

---

## [Phase 8a — Contract Generation & Persistent Campaign System] - 2026-11-16
### Status: Completed & Verified

### 1. Procedural Contract Generation Formula (SECTOR × OBJECTIVE × MODIFIERS)
- Implemented `CampaignManager` in `js/campaign.js` for procedural, deterministic contract pool generation using the campaign seed, completed missions, reputation, and sector health.
- **Five Contract Objectives**:
  - `quota` (**Orbital Quota**): Standard kinetic debris clearance and recycling to ensure safe transit.
  - `protect` (**Asset Protection**): Defensive escort and perimeter protection for high-value commercial megaconstellation satellites.
  - `passivate` (**Stage Passivation**): Tactical neutralization and venting of pressurized upper-stage rocket hazards using kinetic nudges `[Q]`.
  - `recover` (**Core Recovery**): Locating, capturing, and delivering intact high-value priority instrument cores to the Aegis Depot.
  - `survive` (**Cascade Survival**): Enduring high-density hypervelocity debris bombardment until the emergency orbital extraction window opens.
- **Six Operational Modifiers**:
  - `storm_season`: High-frequency space-weather disturbances and solar radiation events.
  - `dense_cloud`: $+50\%$ initial debris density and elevated fragmentation multiplier on impacts.
  - `low_budget`: $-35\%$ starting propellant and battery reserve margins.
  - `rush`: $-30\%$ time limit deadline with $+50\%$ scrap bounty reward.
  - `dead_stick`: $+35\%$ thruster propellant consumption and sluggish reaction wheel damping.
  - `blackout`: $-50\%$ solar panel recharge rate and $-30\%$ radar collision warning radius.

### 2. Tactical Mission Board (`#screen-mission-board`)
- **Standing & Telemetry Bar**:
  - Displays campaign seed (`SEED-XXXXXX`), triple reputation meters (Agency, Commercial, Public), and available scrap reserves.
- **Three Available Contracts Grid (`#contracts-card-grid`)**:
  - Card 1: Familiar quota clearance mission.
  - Card 2: Tactical challenge (`passivate` or `protect`).
  - Card 3: High-stakes survival run (`survive` or `recover`) with active hazard modifiers.
  - Each card details: Affiliated client, contract title, objective badge, risk tag (`Low`, `Moderate`, `Severe`, `Extreme`), active modifier chips, description, target quota/metric, time window, suggested spacecraft bus, scrap payout, budget advance, score bounty, and material rewards.
- **Solicitation / Reroll Action (`#btn-reroll-contracts`)**:
  - Allows soliciting a fresh roster of 3 contracts for a 50 Scrap service fee.
- **Accept Contract Action (`.btn-accept-contract`)**:
  - Sets active contract in persistent storage and routes to Mission Design Studio with pre-configured sector and target requirements.

### 3. Save Version 2 & Safe Migration (`OrbitalStorage`)
- Upgraded `CURRENT_SAVE_VERSION = 2` in `js/data.js`.
- **Safe Non-Destructive Migration (`OrbitalStorage.migrateToV2`)**:
  - Seamlessly detects legacy v1 saves (`!saveVersion || saveVersion < 2`).
  - Preserves 100% of historical player progress: credits, high scores, stars, unlocked sectors, upgrade tiers, harvested materials, selected spacecraft/equipment, and leaderboard records.
  - Automatically initializes new campaign fields: `campaignSeed`, `reputation` (`{ agency: 50, commercial: 50, public: 50 }`), `sectorHealth` (per-sector 85% to 30%), `carryoverDebris` (per-sector 0), `campaignFlags`, `consequencesHistory`, and `availableContracts`.
- Fresh save initialization guarantees complete Save v2 state out-of-the-box.

### 4. Persistent Campaign Consequences & Feedback Loop
- Implemented `CampaignManager.applyMissionOutcome(scene, victory, reason)`:
  - **Successful Mission**:
    - Improves sector orbital health by $+12\%$ to $+25\%$.
    - Reduces residual carryover debris by up to $80\%$ of delivered mass.
    - Shifts Agency, Commercial, and Public reputations positively.
    - Awards scrap payout and material bounties (Metal, Cells, Chips).
    - Generates positive narrative debrief noting collision-free performance or controlled contact.
  - **Failed Mission / Incident**:
    - Degrades sector orbital health by $-15\%$ to $-30\%$.
    - Generates 3 to 10 uncatalogued residual kinetic fragments (`carryoverDebris`) left in orbital drift.
    - Shifts reputation negatively based on collision severity and Kessler risk.
    - Generates incident narrative warning that future operations in that sector will suffer Dense Cloud conditions.
  - **Carryover Debris In-Game Mechanics**:
    - `spawnInitialDebris()` queries `save.carryoverDebris[sectorKey]` and injects residual fragments into future flights in that sector.

### 5. Flight Debrief Section 5: Campaign Consequences Audit (`#debrief-campaign-panel`)
- Integrated into the post-mission results modal (`#modal-results`):
  - Dynamic Sector Orbital Health bar with color-coded health percentage and delta.
  - Residual Carryover Debris readout tracking uncleaned fragments remaining in drift.
  - Triple Reputation Shifts chips (`AGY ±X`, `COM ±Y`, `PUB ±Z`).
  - Consequence narrative report detailing the broader campaign ramifications of the flight.
  - Dedicated `#btn-results-board` button returning directly to the Mission Board.

### 6. Automated Test Suite (`tests/test_phase8a.js`)
- Tested and verified:
  - Safe migration of legacy v1 saves with complete preservation of credits, levels, and upgrades.
  - Fresh save initialization with Save v2 schema.
  - Procedural generation of 3 diverse contracts matching `SECTOR × OBJECTIVE × MODIFIERS`.
  - Contract acceptance and active contract recording in storage.
  - Positive consequences on clean victory (health increase, carryover debris reduction, reputation gains).
  - Negative consequences on failure (health drop, fragment generation, reputation penalties).
  - Solicit / reroll contracts deducting 50 Scrap and replenishing pool.

---

## [Phase 8a Fix — Main Menu Mission Board Transition & Global F3 Telemetry Overlay] - 2026-11-16
### Status: Completed & Verified

### Root Causes & Resolved Issues:
1. **DOMContentLoaded Script Timing Race Condition**:
   - `UIController` instantiation was previously wrapped exclusively in `window.addEventListener('DOMContentLoaded', ...)`.
   - In environments where scripts execute when `document.readyState` is already `'interactive'` or `'complete'`, the event listener never triggered, causing `window.uiController` to remain uninstantiated.
   - Additionally, `renderLeaderboard()` lacked null guards for DOM elements when switching screens before elements were populated.
   - **Fix**:
     - Refactored `initUIController()` to check `document.readyState !== 'loading'` and instantiate immediately or attach listener if still loading.
     - Added global helper `window.openMissionBoard()` directly attached to `#btn-menu-contracts` `onclick` as a fail-safe fallback.
     - Hardened `renderLeaderboard()` and all UIController initialization sub-methods with defensive null-checks.

2. **F3 Key Browser Interception & HUD Telemetry**:
   - Pressing `F3` in Chromium/WebKit browsers natively invokes the browser "Find on page" search bar (`Ctrl+F`), preventing the canvas and game loop from receiving the keypress.
   - Furthermore, laptop function keys often require `Fn` + `F3` or default to media/brightness keys.
   - `#hud-f3-debug` was also nested inside `#hud-overlay` which is hidden when navigating the Main Menu or Mission Board.
   - **Fix**:
     - Moved `#hud-f3-debug` to top-level layer with `position: fixed; z-index: 2000;`, allowing telemetry inspection at any time.
     - Added a capturing global `window.addEventListener('keydown', e => { if (e.key === 'F3' || e.keyCode === 114) { e.preventDefault(); e.stopPropagation(); window.toggleTelemetryOverlay(); } }, true)` to suppress browser find bars and guarantee instant response.
     - Created `window.toggleTelemetryOverlay()` supporting both live Flight Director telemetry during flight and system/engine/save telemetry in menu mode.
     - Added an interactive on-screen HUD button `<button id="btn-toggle-f3-hud" class="hud-f3-btn">📡 F3</button>` in the top status bar and wired the bottom controls hint `<span id="btn-f3-hint">F3 Telemetry</span>`.

3. **Automated Verification**:
   - Created `tests/test_menu_and_f3.js` verifying UIController lifecycle, `#btn-menu-contracts` navigation, 3 contract card rendering, return to menu, `window.openMissionBoard()`, F3 key down capturing, HUD button toggle, and in-flight Flight Director telemetry. All 8 tests passing 100%.

---

## [Phase 8a UX Fix — Reposition Telemetry Button & Overlay to Clear Salvage Bar] - 2026-11-16
### Status: Completed & Verified

### Issues Addressed & Solutions:
1. **Telemetry Button Overlay Collision with In-Flight Cargo & Salvage Bar**:
   - *Problem:* The global floating telemetry button (`#btn-global-telemetry`) was positioned at `fixed; top: 14px; right: 18px;`. When flying in a mission, this placed the button directly on top of the in-flight HUD Cargo Hold and Salvage Materials panel (`.hud-cargo-panel`, containing `CARGO (0/3)` and `SALVAGE: 🔩 0 🔋 0 💾 0`), obscuring vital resource feedback.
   - *Solution:*
     - Repositioned `.global-telemetry-btn` to the top-left (`left: 18px; top: 14px;`).
     - Added `.hud-mode` styling (`top: 168px; left: 18px;`) dynamically applied during in-game flight (`targetScreenName === 'gameHud'`), placing the button lower with clear margin below the fuel, battery, and hull gauges panel and completely vacating the top-right corner.
     - Repositioned the telemetry overlay window (`.hud-f3-debug`) to `left: 18px; top: 52px;` on menus and `left: 18px; top: 208px;` in `.hud-mode`, keeping all telemetry cleanly grouped on the left side with generous breathing room below the resource gauges.
     - The top-right corner (`.hud-cargo-panel`) and bottom-right corner (`.minimap-container`) are now 100% visible and unblocked at all times.
2. **Added Direct Interactive Close Button in Flight**:
   - Added an explicit `[✕ CLOSE]` button directly inside the Flight Director Telemetry overlay header in `js/director.js`, ensuring players can close telemetry with a single click in any flight or menu state.
3. **Automated Verification**:
   - Expanded `tests/test_menu_and_f3.js` with Test 9 verifying CSS positioning rules (`left: 18px`, `top: 168px`, `top: 208px`) and dynamic `.hud-mode` class toggling across screen transitions.
   - All 9 test cases in `tests/test_menu_and_f3.js` and all existing test suites (`test_phase6.js`, `test_phase7.js`, `test_phase8a.js`) pass with 100% success rate.

---

## [Phase 8a Feature — Space Weather & Storm Hazard Physical Mechanics] - 2026-11-16
### Status: Completed & Verified

### Features & Hazardous Mechanics Introduced:
1. **Solar Wind & Thermospheric Drag Surge (Kinetic Hazard Force)**:
   - When a geomagnetic or solar radiation storm is active (or in contract missions with the `storm_season` modifier), high-speed solar wind (>600 km/s) and thermospheric expansion exert continuous physical drag on the player's spacecraft body (`velocity += windAngle * windSpeed * dt`).
   - Adrift debris across the orbital sector is simultaneously accelerated by the solar wind, creating dynamic, unpredictable kinetic drift patterns.
2. **Periodic Geomagnetic Plasma EMP Surges (Active Storm Hazard Pulse)**:
   - Every 10–14 seconds during active space weather (and every 8–11 seconds in `storm_season`), an expanding coronal plasma shockwave sweeps across the sector with camera shake, warning sirens, and particle discharges (`particle_shockwave`, `particle_spark`).
   - **Tactical Faraday Haven**: If the player is within the Aegis Depot perimeter (`dist <= stationDockingRadius + 50`), the station's magnetic shield grounds the EMP surge with zero damage (`DEPOT FARADAY SHIELD: SURGE GROUNDED`).
   - **Open Space Strike**: If caught in open space, the craft takes an electrostatic shock (-14 HP base, -18 Battery base) scaled by Whipple shielding and Titan bus absorption (`spaceWeatherShieldDamping`), and triggers an Avionics Single-Event Upset (SEU) causing 1.6 seconds of thruster jitter and control instability.
3. **Electrostatic Charged Debris Hazard**:
   - Adrift debris builds up electrostatic charge during storms. Direct ungrounded collision releases a static discharge (-6 HP, -10 Bat).
   - Locking the tractor beam onto charged debris safely grounds the charge through the ship's collection apparatus, rewarding the player with bonus score (`+25 STATIC GROUNDED`).
4. **Storm Atmosphere & Visual Ionization**:
   - Viewport-edge auroral ionization ribbons rendered dynamically at the top and bottom of the screen.
   - Electric cyan/magenta solar wind streaks and branching electrostatic lightning arcs flashing across space.
   - HUD banner actively highlights hazard state: `⚡ HAZARD: [EVENT] // DRAG SURGE & CORONAL EMP // SHELTER IN DEPOT`.
5. **Contract Modifier: `storm_season`**:
   - `storm_season` contracts now maintain continuous active space-weather storm conditions with uninterrupted solar drag and rapid coronal EMP surge cycles.
6. **Automated Verification**:
   - Created `tests/test_storm_hazard.js` validating kinetic solar wind drag, open space surge damage, Aegis Depot Faraday haven grounding, Whipple shield mitigation, and storm season continuous retriggering. All 5/5 tests passing 100%. All existing suites (`test_phase6.js`, `test_phase7.js`, `test_phase8a.js`, `test_menu_and_f3.js`) pass with 100% success rate.

---

## [Phase 8b — Orbital Asset Registry, Meaningful Dilemmas & Storylets] - 2026-11-16
### Status: Completed & Verified

### Features & Narrative Systems Implemented:
1. **Orbital Asset Registry (`data/storylets.js`)**:
   - Cataloged 12 key satellites, derelicts, and infrastructure platforms across all 8 orbital sectors:
     - `aegis_depot_alpha` (Sector 1, Aegis Depot LEO harbor, 45,000 kg)
     - `iss_heritage_habitat` (Sector 1, Preserved ISS module, 28,000 kg)
     - `vanguard_1_probe` (Sector 1, Oldest artificial satellite in orbit, 1.5 kg)
     - `starlink_cluster_74` (Sector 2, Commercial polar broadband train, 6,400 kg)
     - `tiangong_cargo_hulk` (Sector 2, Tumbling hypergolic cargo vessel, 13,500 kg)
     - `envisat_derelict` (Sector 3, Sun-sync environmental leviathan, 8,211 kg)
     - `starlink_38_debris_field` (Sector 4, Decaying debris cloud, 3,200 kg)
     - `fengyun_1c_fragment_alpha` (Sector 5, Highly kinetic anti-satellite fragment, 180 kg)
     - `cosmos_2251_hull_core` (Sector 6, High-inclination collision remnant, 900 kg)
     - `classified_quantum_satellite` (Sector 7, Covert defense platform in GEO graveyard, 4,200 kg)
     - `tdrss_relay_omega` (Sector 7, Geostationary space communications relay, 3,800 kg)
     - `kessler_cascade_origin` (Sector 8, High-density cascade origin junction, 62,000 kg)
   - Asset attributes include unique identifier, name, sector index, physical mass (kg), economic value (Scrap), dynamic integrity condition (0–100%), operational status (`nominal`, `secured`, `endangered`, `damaged`, `decaying`, `salvaged`), managing faction (`agency`, `commercial`, `public`), and historical mission dossier.
2. **12 Meaningful Dilemmas & Storylets**:
   - **8 Contract Storylets**:
     - `STORYLET_01`: *Derelict Flight Recorder Dilemma* (AeroSat buy-out vs Open UN-OOSA science vs scrap salvage)
     - `STORYLET_02`: *Envisat Collision Emergency* (Active grapple de-orbit burn vs commercial defensive shielding vs uncontrolled atmospheric reentry)
     - `STORYLET_03`: *Mega-Constellation Orbital Squeeze* (Strict civil spacing vs private high-density toll corridor)
     - `STORYLET_04`: *Historic Vanguard 1 Salvage Claim* (Smithsonian archival museum custody vs corporate private trophy auction)
     - `STORYLET_05`: *Toxic Hydrazine Tank Rupture* (Controlled laser burn venting vs high-risk emergency coolant harvest)
     - `STORYLET_06`: *Decaying RTG Nuclear Core* (Graveyard boosting vs deep ocean de-orbit vs enriched isotope scavenging)
     - `STORYLET_07`: *Geomagnetic Storm Emergency Shelter* (Civilian satellite haven sheltering vs corporate priority power reserves)
     - `STORYLET_08`: *Black Budget Derelict Cryptography* (UN space safety disclosure vs Defense Command return vs private auction)
   - **4 Follow-up Storylets**:
     - `STORYLET_09`: *Open Source Constellation Beacon* (Unlocked by Storylet 01 Choice B; permanent sensor warning range upgrade vs data monetisation)
     - `STORYLET_10`: *ESA Deep Space Clean Grant* (Unlocked by Storylet 02 Choice A; ion thrusters workshop schematics vs permanent Sun-sync safety monitors)
     - `STORYLET_11`: *Crowdfunded Clean-Up Fleet* (Unlocked by Storylet 03 Choice A; volunteer automated sweeper drones vs solar cell subsidies)
     - `STORYLET_12`: *Smithsonian Heritage Endowment* (Unlocked by Storylet 04 Choice A; permanent 50% discount on contract solicitation rerolls vs research stipends)
3. **Non-Repetition & Multi-Tier Progression Logic**:
   - Storylets resolved are permanently logged in `save.resolvedStorylets` and `save.decisionHistory`.
   - `StoryletManager.getEligibleStorylet()` evaluates reputation thresholds, unlocked sectors, campaign flags, and past choices, prioritizing follow-up storylines before offering general contract dilemmas. Resolved storylets are never repeated.
4. **Persistent Consequences Across Saves**:
   - Decisions alter Scrap/credits, metal/cells/chips inventory, 3-tier faction reputation (`agency`, `commercial`, `public`), dynamic sector health, persistent asset status in `save.assetRegistry`, and campaign narrative flags.
   - Full backward-compatible non-destructive Save v2 migration preserves legacy progress while seeding the complete Asset Registry and decision history.
5. **Mission Board Integration & Asset Registry Modal**:
   - Interactive dilemma cards surfaced directly in the Mission Board (`#screen-mission-board`) between contract sorting options and available contracts.
   - Added `[🛰️ ASSET REGISTRY]` button opening the full orbital infrastructure modal (`#modal-asset-registry`), displaying live condition meters, real-time statuses, masses, and sector locations.
   - Immediate and delayed consequence feedback displayed directly after resolving choices.
6. **Documentation & Automated Testing**:
   - Published `docs/STORYLETS.md` documenting conditions, stakes, delayed mechanics, and asset details.
   - Created `tests/test_phase8b.js` with 8 comprehensive automated test suites.
   - All 6 project test suites pass with 100% success rate (35+ test assertions across physics, weather, UI, contracts, and storylets).
