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
